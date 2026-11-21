import { z } from "zod";

export const previewSchema = z.object({
  url: z.string().trim().min(1, "Hãy dán link TikTok.").max(2048, "Link quá dài."),
});

export const DOWNLOAD_KINDS = ["video", "audio", "image"] as const;

export const fileQuerySchema = z.object({
  url: z.string().trim().min(1).max(2048),
  kind: z.enum(DOWNLOAD_KINDS),
  index: z.coerce.number().int().min(0).max(49).default(0),
});
