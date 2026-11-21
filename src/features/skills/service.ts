import "server-only";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { files, learningProgress, skillAttachments, skills, skillSteps } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { assertSkillUnlocked } from "@/lib/levels";
import { notifyActiveMembers } from "@/lib/notify";
import { emit } from "@/lib/realtime";
import { youtubeId, type SkillInput } from "./schemas";

export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "bai-hoc";
}

async function uniqueSlug(title: string, exceptId?: string): Promise<string> {
  const base = slugify(title);
  for (let n = 1; n < 1000; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const [row] = await db.select({ id: skills.id }).from(skills).where(eq(skills.slug, candidate)).limit(1);
    if (!row || row.id === exceptId) return candidate;
  }
  throw new AppError("CONFLICT", "Không tạo được đường dẫn cho bài này. Hãy đổi tiêu đề.");
}

/** Creates or updates a skill and replaces its steps and attachments in one transaction. */
export async function saveSkill(actor: SessionUser, input: SkillInput & { id?: string }) {
  const title = input.title as string;
  const values = {
    title,
    summary: (input.summary as string | undefined) ?? "",
    difficulty: (input.difficulty ?? "basic") as "basic" | "intermediate" | "advanced",
    durationMin: Number(input.durationMin ?? 0),
    tags: (input.tags as string[] | undefined) ?? [],
    coverFileId: (input.coverFileId as string | null | undefined) ?? null,
    videoKind: input.videoKind === "upload" || input.videoKind === "embed" ? input.videoKind : null,
    videoFileId: input.videoKind === "upload" ? ((input.videoFileId as string | null | undefined) ?? null) : null,
    videoEmbedUrl: input.videoKind === "embed" ? ((input.videoEmbedUrl as string | undefined) ?? null) : null,
    capcutTemplateUrl: (input.capcutTemplateUrl as string | undefined) ?? null,
    levelId: (input.levelId as string | null | undefined) ?? null,
    isRequired: Boolean(input.isRequired),
    updatedAt: new Date(),
  };
  const id = await db.transaction(async (tx) => {
    let skillId: string;
    if (input.id) {
      const [existing] = await tx
        .select({ id: skills.id, title: skills.title, authorId: skills.authorId })
        .from(skills)
        .where(and(eq(skills.id, input.id), isNull(skills.deletedAt)))
        .limit(1);
      if (!existing) throw new AppError("NOT_FOUND");
      const slug = existing.title === title ? undefined : await uniqueSlug(title, existing.id);
      await tx
        .update(skills)
        .set({ ...values, ...(slug ? { slug } : {}) })
        .where(eq(skills.id, existing.id));
      skillId = existing.id;
    } else {
      const slug = await uniqueSlug(title);
      const [row] = await tx
        .insert(skills)
        .values({ ...values, slug, authorId: actor.id, status: "draft" })
        .returning({ id: skills.id });
      skillId = row.id;
    }

    await tx.delete(skillSteps).where(eq(skillSteps.skillId, skillId));
    if (input.steps && input.steps.length > 0) {
      await tx.insert(skillSteps).values(
        input.steps.map((step, position) => ({
          skillId,
          position,
          title: step.title,
          body: step.body ?? "",
          mediaFileId: step.mediaFileId ?? null,
        })),
      );
    }

    await tx.delete(skillAttachments).where(eq(skillAttachments.skillId, skillId));
    if (input.attachments && input.attachments.length > 0) {
      await tx
        .insert(skillAttachments)
        .values(input.attachments.map((a) => ({ skillId, fileId: a.fileId, label: a.label })));
    }
    return skillId;
  });

  await writeAudit({
    actorId: actor.id,
    action: input.id ? "skill.updated" : "skill.created",
    targetType: "skill",
    targetId: id,
  });
  await emit("skill.updated", { id });
  return { id };
}

export async function setSkillPublished(actor: SessionUser, id: string, publish: boolean) {
  const [row] = await db
    .select({
      id: skills.id,
      status: skills.status,
      publishedAt: skills.publishedAt,
      title: skills.title,
      slug: skills.slug,
      summary: skills.summary,
    })
    .from(skills)
    .where(and(eq(skills.id, id), isNull(skills.deletedAt)))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND");
  await db
    .update(skills)
    .set({
      status: publish ? "published" : "draft",
      publishedAt: publish ? (row.publishedAt ?? new Date()) : row.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(skills.id, id));
  await writeAudit({
    actorId: actor.id,
    action: publish ? "skill.published" : "skill.unpublished",
    targetType: "skill",
    targetId: id,
  });
  // Notify members only on the first move from draft to published.
  if (publish && row.status !== "published") {
    await notifyActiveMembers({
      type: "skill.published",
      title: `Bài học mới: ${row.title}`,
      body: row.summary,
      link: `/hoc/${row.slug}`,
      exceptUserId: actor.id,
    });
  }
  await emit("skill.updated", { id });
  return { id, status: (publish ? "published" : "draft") as "published" | "draft" };
}
export async function deleteSkill(actor: SessionUser, id: string) {
  const result = await db
    .update(skills)
    .set({ deletedAt: new Date(), status: "draft", updatedAt: new Date() })
    .where(and(eq(skills.id, id), isNull(skills.deletedAt)))
    .returning({ id: skills.id });
  if (result.length === 0) throw new AppError("NOT_FOUND");
  await writeAudit({ actorId: actor.id, action: "skill.deleted", targetType: "skill", targetId: id });
  await emit("skill.updated", { id });
  return { id };
}

/** Admin: full skill for the editor, including file names for attachments. */
export async function getSkillForEditor(id: string) {
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, id), isNull(skills.deletedAt)))
    .limit(1);
  if (!skill) throw new AppError("NOT_FOUND");
  const steps = await db.select().from(skillSteps).where(eq(skillSteps.skillId, id)).orderBy(asc(skillSteps.position));
  const attachments = await db
    .select({
      id: skillAttachments.id,
      fileId: skillAttachments.fileId,
      label: skillAttachments.label,
      originalName: files.originalName,
    })
    .from(skillAttachments)
    .innerJoin(files, eq(files.id, skillAttachments.fileId))
    .where(eq(skillAttachments.skillId, id));
  return { skill, steps, attachments };
}

export async function listSkillsForAdmin() {
  return db
    .select({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
      status: skills.status,
      difficulty: skills.difficulty,
      durationMin: skills.durationMin,
      updatedAt: skills.updatedAt,
      publishedAt: skills.publishedAt,
    })
    .from(skills)
    .where(isNull(skills.deletedAt))
    .orderBy(desc(skills.updatedAt));
}

export async function listPublishedSkills(input: { q?: string; difficulty: string; tag?: string }) {
  const conditions = [eq(skills.status, "published"), isNull(skills.deletedAt)];
  if (input.q) {
    const pattern = `%${input.q.replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(or(ilike(skills.title, pattern), ilike(skills.summary, pattern))!);
  }
  if (input.difficulty !== "all") conditions.push(eq(skills.difficulty, input.difficulty as "basic"));
  if (input.tag) conditions.push(sql`${input.tag} = any(${skills.tags})`);

  return db
    .select({
      id: skills.id,
      slug: skills.slug,
      title: skills.title,
      summary: skills.summary,
      difficulty: skills.difficulty,
      durationMin: skills.durationMin,
      tags: skills.tags,
      coverFileId: skills.coverFileId,
      levelId: skills.levelId,
    })
    .from(skills)
    .where(and(...conditions))
    .orderBy(asc(skills.levelId), desc(skills.publishedAt));
}

/** Member view of one published skill, with the viewer's own progress. */
export async function getPublishedSkillBySlug(slug: string, userId: string) {
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.slug, slug), eq(skills.status, "published"), isNull(skills.deletedAt)))
    .limit(1);
  if (!skill) throw new AppError("NOT_FOUND", "Không tìm thấy bài học này.");
  await assertSkillUnlocked(userId, skill.levelId);

  const steps = await db
    .select()
    .from(skillSteps)
    .where(eq(skillSteps.skillId, skill.id))
    .orderBy(asc(skillSteps.position));
  const attachments = await db
    .select({
      id: skillAttachments.id,
      fileId: skillAttachments.fileId,
      label: skillAttachments.label,
      mime: files.mime,
      sizeBytes: files.sizeBytes,
    })
    .from(skillAttachments)
    .innerJoin(files, eq(files.id, skillAttachments.fileId))
    .where(eq(skillAttachments.skillId, skill.id));
  const [progress] = await db
    .select({ status: learningProgress.status })
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.skillId, skill.id)))
    .limit(1);

  const embed = skill.videoKind === "embed" && skill.videoEmbedUrl ? skill.videoEmbedUrl : null;
  return {
    skill: {
      ...skill,
      youtubeId: embed ? youtubeId(embed) : null,
    },
    steps,
    attachments,
    progress: progress?.status ?? null,
  };
}

/** Saved list and completed items for one member. Saved = any row; completed = status completed. */
export async function listMyLearning(userId: string) {
  return db
    .select({
      skillId: learningProgress.skillId,
      status: learningProgress.status,
      slug: skills.slug,
      title: skills.title,
      difficulty: skills.difficulty,
      completedAt: learningProgress.completedAt,
    })
    .from(learningProgress)
    .innerJoin(skills, eq(skills.id, learningProgress.skillId))
    .where(and(eq(learningProgress.userId, userId), eq(skills.status, "published"), isNull(skills.deletedAt)))
    .orderBy(desc(learningProgress.updatedAt));
}

export async function toggleSaved(userId: string, skillId: string) {
  const [row] = await db
    .select({ status: learningProgress.status })
    .from(learningProgress)
    .where(and(eq(learningProgress.userId, userId), eq(learningProgress.skillId, skillId)))
    .limit(1);
  if (row) {
    await db
      .delete(learningProgress)
      .where(and(eq(learningProgress.userId, userId), eq(learningProgress.skillId, skillId)));
    return { saved: false };
  }
  await db.insert(learningProgress).values({ userId, skillId, status: "saved" });
  return { saved: true };
}

export async function setCompleted(userId: string, skillId: string, completed: boolean) {
  const [skill] = await db.select({ id: skills.id }).from(skills).where(eq(skills.id, skillId)).limit(1);
  if (!skill) throw new AppError("NOT_FOUND");
  await db
    .insert(learningProgress)
    .values({
      userId,
      skillId,
      status: completed ? "completed" : "saved",
      completedAt: completed ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [learningProgress.userId, learningProgress.skillId],
      set: {
        status: completed ? "completed" : "saved",
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  await emit("learning.updated", { id: userId });
  return { completed };
}
