import { z } from "zod";

export const DIFFICULTIES = ["basic", "intermediate", "advanced"] as const;
export const DIFFICULTY_LABEL: Record<(typeof DIFFICULTIES)[number], string> = {
  basic: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^https:\/\//.test(v), "Link phải bắt đầu bằng https://");

/** YouTube videos are embedded; TikTok is linked (its embed needs an id we do not store). */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "m.youtube.com") return u.searchParams.get("v");
    return null;
  } catch {
    return null;
  }
}

const embedUrl = optionalUrl.refine((v) => {
  if (v === undefined) return true;
  try {
    const host = new URL(v).hostname.replace(/^www\./, "");
    return host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("tiktok.com");
  } catch {
    return false;
  }
}, "Chỉ nhận link YouTube hoặc TikTok.");

export const skillStepSchema = z.object({
  title: z.string().trim().min(1, "Hãy nhập tên bước.").max(120, "Tên bước tối đa 120 ký tự."),
  body: z.string().trim().max(2000, "Nội dung bước tối đa 2000 ký tự.").default(""),
  mediaFileId: z.uuid().nullable().optional(),
});

export const skillAttachmentSchema = z.object({
  fileId: z.uuid(),
  label: z.string().trim().min(1, "Hãy đặt tên tài liệu.").max(80),
});

export const skillInputSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(3, "Tiêu đề có ít nhất 3 ký tự.").max(120, "Tiêu đề tối đa 120 ký tự."),
    summary: z.string().trim().max(300, "Mô tả ngắn tối đa 300 ký tự.").default(""),
    difficulty: z.enum(DIFFICULTIES).default("basic"),
    durationMin: z.coerce.number().int().min(0).max(600).default(0),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(24)).max(10, "Tối đa 10 thẻ.").default([]),
    coverFileId: z.uuid().nullable().optional(),
    videoKind: z.enum(["none", "upload", "embed"]).default("none"),
    videoFileId: z.uuid().nullable().optional(),
    videoEmbedUrl: embedUrl,
    capcutTemplateUrl: optionalUrl,
    levelId: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable().optional()),
    isRequired: z.boolean().default(false),
    steps: z.array(skillStepSchema).max(30, "Tối đa 30 bước.").default([]),
    attachments: z.array(skillAttachmentSchema).max(20, "Tối đa 20 tài liệu.").default([]),
  })
  .superRefine((value, ctx) => {
    if (value.videoKind === "upload" && !value.videoFileId) {
      ctx.addIssue({ code: "custom", path: ["videoFileId"], message: "Hãy tải lên video." });
    }
    if (value.videoKind === "embed" && !value.videoEmbedUrl) {
      ctx.addIssue({ code: "custom", path: ["videoEmbedUrl"], message: "Hãy dán link YouTube hoặc TikTok." });
    }
  });
export type SkillInput = z.input<typeof skillInputSchema>;

export const skillIdSchema = z.object({ id: z.uuid() });
export const skillPublishSchema = z.object({ id: z.uuid(), publish: z.boolean() });

export const memberListSchema = z.object({
  q: z.string().trim().max(60).optional(),
  difficulty: z.enum(["all", ...DIFFICULTIES]).default("all"),
  tag: z.string().trim().max(24).optional(),
});

export const toggleSaveSchema = z.object({ skillId: z.uuid() });
export const markCompleteSchema = z.object({ skillId: z.uuid(), completed: z.boolean() });
