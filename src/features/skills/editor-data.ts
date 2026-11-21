import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";
import { getSkillForEditor } from "./service";

/** Loads a skill in the shape the editor form expects, plus display names for its files. */
export async function loadEditorInitial(id: string) {
  const { skill, steps, attachments } = await getSkillForEditor(id);

  const ids = [
    skill.coverFileId,
    skill.videoFileId,
    ...steps.map((s) => s.mediaFileId),
    ...attachments.map((a) => a.fileId),
  ].filter((v): v is string => Boolean(v));
  const rows = ids.length
    ? await db.select({ id: files.id, name: files.originalName }).from(files).where(inArray(files.id, ids))
    : [];
  const nameOf = new Map(rows.map((r) => [r.id, r.name]));

  return {
    id: skill.id,
    status: skill.status,
    coverName: skill.coverFileId ? (nameOf.get(skill.coverFileId) ?? null) : null,
    videoName: skill.videoFileId ? (nameOf.get(skill.videoFileId) ?? null) : null,
    attachmentNames: Object.fromEntries(attachments.map((a) => [a.fileId, a.originalName])),
    stepMediaNames: Object.fromEntries(
      steps
        .filter((s) => s.mediaFileId)
        .map((s) => [s.mediaFileId as string, nameOf.get(s.mediaFileId as string) ?? "Ảnh"]),
    ),
    values: {
      id: skill.id,
      title: skill.title,
      summary: skill.summary,
      difficulty: skill.difficulty,
      durationMin: skill.durationMin,
      tags: skill.tags,
      coverFileId: skill.coverFileId,
      videoKind: (skill.videoKind ?? "none") as "none" | "upload" | "embed",
      videoFileId: skill.videoFileId,
      videoEmbedUrl: skill.videoEmbedUrl ?? undefined,
      capcutTemplateUrl: skill.capcutTemplateUrl ?? undefined,
      levelId: skill.levelId,
      isRequired: skill.isRequired,
      steps: steps.map((s) => ({ title: s.title, body: s.body, mediaFileId: s.mediaFileId })),
      attachments: attachments.map((a) => ({ fileId: a.fileId, label: a.label })),
    },
  };
}
