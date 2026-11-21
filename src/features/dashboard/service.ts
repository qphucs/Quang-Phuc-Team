import "server-only";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, downloads, skills, trendItems, users } from "@/db/schema";
import { AUDIT_LABELS } from "@/lib/audit-labels";
import { startOfTodayInVietnam } from "@/lib/format";

const ONLINE_WINDOW_MS = 2 * 60_000;

/** Admin overview numbers. Each is a cheap count; the page refreshes on realtime events. */
export async function getDashboard() {
  const now = Date.now();
  const [members] = await db
    .select({
      total: sql<number>`count(*)::int`,
      online: sql<number>`count(*) filter (where ${users.lastSeenAt} >= ${new Date(now - ONLINE_WINDOW_MS)})::int`,
    })
    .from(users)
    .where(and(isNull(users.deletedAt), eq(users.status, "active"), eq(users.banned, false)));
  const [pendingTrends] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(trendItems)
    .where(eq(trendItems.status, "pending"));
  const [publishedSkills] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(skills)
    .where(and(eq(skills.status, "published"), isNull(skills.deletedAt)));
  const [downloadsToday] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(downloads)
    .where(and(eq(downloads.status, "ok"), gte(downloads.createdAt, startOfTodayInVietnam())));
  const activity = await db
    .select({ action: auditLogs.action, createdAt: auditLogs.createdAt, actorName: users.name })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(8);

  return {
    members: members?.total ?? 0,
    onlineNow: members?.online ?? 0,
    pendingTrends: pendingTrends?.value ?? 0,
    publishedSkills: publishedSkills?.value ?? 0,
    downloadsToday: downloadsToday?.value ?? 0,
    activity: activity.map((a) => ({ ...a, label: AUDIT_LABELS[a.action] ?? a.action.replace(/[._]/g, " ") })),
  };
}
