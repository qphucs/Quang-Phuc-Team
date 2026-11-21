import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { savedTrends, trendItems, trendRuns, trendSnapshots, users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { startOfTodayInVietnam } from "@/lib/format";
import { emit } from "@/lib/realtime";
import { normalizeTikTokUrl } from "@/lib/tiktok-link";
import { heatScore } from "./heat";
import { fetchOembed } from "./oembed";
import { TREND_SOURCES } from "./sources";

type TrendType = "capcut_edit" | "sound";

/** Admin adds a trend by link. Title, author and thumbnail come from TikTok's oEmbed. */
export async function addManualTrend(
  actor: { id: string },
  input: { url: string; type: TrendType; note: string; publishNow: boolean },
) {
  const url = normalizeTikTokUrl(input.url);
  if (!url)
    throw new AppError("VALIDATION_ERROR", "Link không hợp lệ. Hãy dán link video TikTok.", {
      url: "Link không hợp lệ.",
    });

  const [existing] = await db.select({ id: trendItems.id }).from(trendItems).where(eq(trendItems.url, url)).limit(1);
  if (existing) throw new AppError("CONFLICT", "Trend này đã có trong danh sách.", { url: "Link này đã được thêm." });

  const info = await fetchOembed(url);
  const now = new Date();
  const [row] = await db
    .insert(trendItems)
    .values({
      type: input.type,
      source: "manual",
      url,
      title: info.title,
      author: info.author,
      coverUrl: info.thumbnail,
      status: input.publishNow ? "published" : "pending",
      note: input.note,
      addedBy: actor.id,
      publishedAt: input.publishNow ? now : null,
    })
    .returning({ id: trendItems.id });

  await writeAudit({ actorId: actor.id, action: "trend.added", targetType: "trend", targetId: row.id });
  await emit("trend.updated", { id: row.id });
  return { id: row.id };
}

export async function setTrendStatus(actor: { id: string }, id: string, status: "published" | "rejected" | "pending") {
  const result = await db
    .update(trendItems)
    .set({
      status,
      publishedAt: status === "published" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(trendItems.id, id))
    .returning({ id: trendItems.id });
  if (result.length === 0) throw new AppError("NOT_FOUND");
  await writeAudit({ actorId: actor.id, action: `trend.${status}`, targetType: "trend", targetId: id });
  await emit("trend.updated", { id });
  return { id, status };
}

export async function setTrendPinned(actor: { id: string }, id: string, pinned: boolean) {
  const result = await db
    .update(trendItems)
    .set({ isPinned: pinned, updatedAt: new Date() })
    .where(eq(trendItems.id, id))
    .returning({ id: trendItems.id });
  if (result.length === 0) throw new AppError("NOT_FOUND");
  await writeAudit({
    actorId: actor.id,
    action: pinned ? "trend.pinned" : "trend.unpinned",
    targetType: "trend",
    targetId: id,
  });
  await emit("trend.updated", { id });
  return { id, pinned };
}

/** Members see published trends. `saved` shows the viewer's saved items. */
export async function listFeed(
  input: { type: "capcut_edit" | "sound" | "saved"; range: "today" | "week" },
  userId: string,
) {
  const since = input.range === "today" ? startOfTodayInVietnam() : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const conditions = [eq(trendItems.status, "published"), gte(trendItems.firstSeenAt, since)];
  if (input.type !== "saved") conditions.push(eq(trendItems.type, input.type));
  else
    conditions.push(
      sql`${trendItems.id} in (select ${savedTrends.trendId} from ${savedTrends} where ${savedTrends.userId} = ${userId})`,
    );

  return db
    .select({
      id: trendItems.id,
      type: trendItems.type,
      url: trendItems.url,
      title: trendItems.title,
      author: trendItems.author,
      coverUrl: trendItems.coverUrl,
      soundName: trendItems.soundName,
      heatScore: trendItems.heatScore,
      isPinned: trendItems.isPinned,
      firstSeenAt: trendItems.firstSeenAt,
      note: trendItems.note,
      saved: sql<boolean>`exists (select 1 from ${savedTrends} where ${savedTrends.trendId} = ${trendItems.id} and ${savedTrends.userId} = ${userId})`,
    })
    .from(trendItems)
    .where(and(...conditions))
    .orderBy(desc(trendItems.isPinned), desc(trendItems.heatScore), desc(trendItems.firstSeenAt))
    .limit(100);
}

export async function listQueue(status: "pending" | "published" | "rejected") {
  return db
    .select({
      id: trendItems.id,
      type: trendItems.type,
      url: trendItems.url,
      title: trendItems.title,
      author: trendItems.author,
      coverUrl: trendItems.coverUrl,
      heatScore: trendItems.heatScore,
      isPinned: trendItems.isPinned,
      note: trendItems.note,
      source: trendItems.source,
      firstSeenAt: trendItems.firstSeenAt,
      addedByName: users.name,
    })
    .from(trendItems)
    .leftJoin(users, eq(users.id, trendItems.addedBy))
    .where(eq(trendItems.status, status))
    .orderBy(desc(trendItems.isPinned), desc(trendItems.heatScore), desc(trendItems.firstSeenAt))
    .limit(200);
}

export async function toggleSavedTrend(userId: string, trendId: string) {
  const [row] = await db
    .select({ trendId: savedTrends.trendId })
    .from(savedTrends)
    .where(and(eq(savedTrends.userId, userId), eq(savedTrends.trendId, trendId)))
    .limit(1);
  if (row) {
    await db.delete(savedTrends).where(and(eq(savedTrends.userId, userId), eq(savedTrends.trendId, trendId)));
    return { saved: false };
  }
  await db.insert(savedTrends).values({ userId, trendId });
  return { saved: true };
}

/**
 * Daily scan (run by the worker). For each enabled source: record a run, upsert items by URL,
 * store a snapshot, and recompute heat from the previous snapshot.
 * Items from automatic sources start as pending for admin review.
 */
export async function runScan(now: Date = new Date()) {
  const results: { source: string; ok: boolean; found: number; created: number }[] = [];
  for (const source of TREND_SOURCES) {
    const [run] = await db
      .insert(trendRuns)
      .values({ source: source.name, startedAt: now })
      .returning({ id: trendRuns.id });
    try {
      const items = await source.fetch();
      let created = 0;
      for (const item of items) {
        const [existing] = await db.select().from(trendItems).where(eq(trendItems.url, item.url)).limit(1);
        let trendId: string;
        if (existing) {
          trendId = existing.id;
          await db
            .update(trendItems)
            .set({
              viewCount: item.viewCount,
              useCount: item.useCount,
              title: item.title || existing.title,
              updatedAt: now,
            })
            .where(eq(trendItems.id, trendId));
        } else {
          const [row] = await db
            .insert(trendItems)
            .values({
              type: item.type,
              source: source.name,
              url: item.url,
              title: item.title,
              author: item.author,
              coverUrl: item.coverUrl,
              soundName: item.soundName,
              viewCount: item.viewCount,
              useCount: item.useCount,
              firstSeenAt: now,
            })
            .returning({ id: trendItems.id });
          trendId = row.id;
          created += 1;
        }

        const [previous] = await db
          .select()
          .from(trendSnapshots)
          .where(eq(trendSnapshots.trendId, trendId))
          .orderBy(desc(trendSnapshots.capturedAt))
          .limit(1);
        await db
          .insert(trendSnapshots)
          .values({ trendId, viewCount: item.viewCount, useCount: item.useCount, capturedAt: now });

        const hoursBetween = previous ? (now.getTime() - previous.capturedAt.getTime()) / 3_600_000 : 0;
        const firstSeen = existing?.firstSeenAt ?? now;
        const score = heatScore({
          previousViews: previous?.viewCount ?? null,
          currentViews: item.viewCount,
          hoursBetween,
          hoursSinceFirstSeen: (now.getTime() - firstSeen.getTime()) / 3_600_000,
        });
        await db.update(trendItems).set({ heatScore: score }).where(eq(trendItems.id, trendId));
      }
      await db
        .update(trendRuns)
        .set({ ok: true, finishedAt: new Date(), foundCount: items.length, newCount: created })
        .where(eq(trendRuns.id, run.id));
      results.push({ source: source.name, ok: true, found: items.length, created });
    } catch (error) {
      await db
        .update(trendRuns)
        .set({
          ok: false,
          finishedAt: new Date(),
          error: error instanceof Error ? error.message.slice(0, 500) : "unknown",
        })
        .where(eq(trendRuns.id, run.id));
      results.push({ source: source.name, ok: false, found: 0, created: 0 });
    }
  }
  if (results.length > 0) await emit("trend.updated", {});
  return results;
}

export async function listRecentRuns(limit = 20) {
  return db.select().from(trendRuns).orderBy(desc(trendRuns.startedAt)).limit(limit);
}
