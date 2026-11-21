import { z } from "zod";

export const TREND_TYPES = ["capcut_edit", "sound"] as const;

export const addTrendSchema = z.object({
  url: z.string().trim().min(1, "Hãy dán link TikTok.").max(2048),
  type: z.enum(TREND_TYPES),
  note: z.string().trim().max(200, "Ghi chú tối đa 200 ký tự.").default(""),
  publishNow: z.boolean().default(false),
});

export const trendStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["published", "rejected", "pending"]),
});

export const trendPinSchema = z.object({ id: z.uuid(), pinned: z.boolean() });

export const feedSchema = z.object({
  type: z.enum(["capcut_edit", "sound", "saved"]),
  range: z.enum(["today", "week"]).default("today"),
});

export const queueSchema = z.object({ status: z.enum(["pending", "published", "rejected"]) });

export const savedTrendSchema = z.object({ trendId: z.uuid() });
