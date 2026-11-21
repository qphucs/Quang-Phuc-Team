"use server";
import { z } from "zod";
import { action } from "@/lib/action";
import { getQuota } from "./quota";
import { listAllDownloads, listMyDownloads, previewMedia } from "./service";
import { previewSchema } from "./schemas";

export const previewDownload = action({
  schema: previewSchema,
  permission: "download:use",
  handler: (input) => previewMedia(input.url),
});

export const getMyQuota = action({
  schema: z.object({}),
  permission: "download:use",
  handler: (_input, { user }) => getQuota(user.id),
});

export const getMyDownloads = action({
  schema: z.object({}),
  permission: "download:use",
  handler: (_input, { user }) => listMyDownloads(user.id),
});

export const getAllDownloads = action({
  schema: z.object({}),
  permission: "download:view_all",
  handler: () => listAllDownloads(),
});
