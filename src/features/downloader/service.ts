import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { downloads, users, type downloadKind } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { buildFileName, isAllowedMediaUrl, normalizeTikTokUrl } from "./link";
import { countTodayForUser, getDailyLimit } from "./quota";
import { resolveCached, type MediaInfo } from "./provider";

export type Kind = (typeof downloadKind.enumValues)[number];

const FETCH_TIMEOUT_MS = 60_000;
const MEDIA_HEADERS = {
  Referer: "https://www.tikwm.com/",
  "User-Agent": "Mozilla/5.0 (compatible; QPTeam/1.0)",
};

function requireTikTokUrl(input: string): string {
  const url = normalizeTikTokUrl(input);
  if (!url)
    throw new AppError("VALIDATION_ERROR", "Link không hợp lệ. Hãy dán link video TikTok.", {
      url: "Link không hợp lệ.",
    });
  return url;
}

/** Preview: title, author, cover and which downloads exist. No media is fetched or counted. */
export async function previewMedia(input: string) {
  const url = requireTikTokUrl(input);
  const info = await resolveCached(url);
  return {
    url,
    title: info.title,
    author: info.author,
    cover: info.cover,
    durationSec: info.durationSec,
    hasVideo: info.video !== null,
    hasAudio: info.audio !== null,
    images: info.images.map((_, index) => index),
  };
}

function pickRemote(info: MediaInfo, kind: Kind, index: number): { remote: string; ext: string } {
  if (kind === "video" && info.video) return { remote: info.video, ext: "mp4" };
  if (kind === "audio" && info.audio) return { remote: info.audio, ext: "mp3" };
  if (kind === "image" && info.images[index]) return { remote: info.images[index], ext: "jpg" };
  throw new AppError("NOT_FOUND", "Không có tệp này cho video đã chọn.");
}

async function logDownload(entry: {
  userId: string;
  sourceUrl: string;
  kind: Kind;
  title: string;
  author: string;
  status: "ok" | "failed";
  error?: string;
}) {
  await db.insert(downloads).values({
    userId: entry.userId,
    sourceUrl: entry.sourceUrl,
    kind: entry.kind,
    title: entry.title,
    author: entry.author,
    status: entry.status,
    error: entry.error ?? null,
  });
}

/**
 * Streams one file to the member. Order: quota → resolve → fetch media → log → stream.
 * The browser never sees the remote media URL, and only watermark-free media is ever returned.
 */
export async function streamMedia(params: { userId: string; input: string; kind: Kind; index: number }) {
  const url = requireTikTokUrl(params.input);

  const [limit, used] = await Promise.all([getDailyLimit(), countTodayForUser(params.userId)]);
  if (used >= limit) {
    throw new AppError("RATE_LIMITED", `Bạn đã dùng hết ${limit} lượt tải hôm nay. Hãy quay lại vào ngày mai.`);
  }

  const info = await resolveCached(url);
  const { remote, ext } = pickRemote(info, params.kind, params.index);
  if (!isAllowedMediaUrl(remote)) throw new AppError("UPSTREAM_ERROR", "Nguồn trả về một liên kết không an toàn.");

  let upstream: Response;
  try {
    upstream = await fetch(remote, {
      headers: MEDIA_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    await logDownload({
      userId: params.userId,
      sourceUrl: url,
      kind: params.kind,
      title: info.title,
      author: info.author,
      status: "failed",
      error: "fetch",
    });
    throw new AppError("UPSTREAM_ERROR");
  }
  if (!upstream.ok || !upstream.body) {
    await logDownload({
      userId: params.userId,
      sourceUrl: url,
      kind: params.kind,
      title: info.title,
      author: info.author,
      status: "failed",
      error: `http ${upstream.status}`,
    });
    throw new AppError("UPSTREAM_ERROR");
  }

  const fileName = buildFileName(
    { author: info.author, title: info.title, index: params.kind === "image" ? params.index : undefined },
    ext,
  );
  await logDownload({
    userId: params.userId,
    sourceUrl: url,
    kind: params.kind,
    title: info.title,
    author: info.author,
    status: "ok",
  });

  return {
    body: upstream.body,
    contentType: upstream.headers.get("content-type") ?? "application/octet-stream",
    contentLength: upstream.headers.get("content-length"),
    fileName,
  };
}

export async function listMyDownloads(userId: string, limit = 20) {
  return db
    .select({
      id: downloads.id,
      kind: downloads.kind,
      title: downloads.title,
      status: downloads.status,
      createdAt: downloads.createdAt,
    })
    .from(downloads)
    .where(eq(downloads.userId, userId))
    .orderBy(desc(downloads.createdAt))
    .limit(limit);
}

export async function listAllDownloads(limit = 100) {
  return db
    .select({
      id: downloads.id,
      kind: downloads.kind,
      title: downloads.title,
      author: downloads.author,
      sourceUrl: downloads.sourceUrl,
      status: downloads.status,
      error: downloads.error,
      createdAt: downloads.createdAt,
      userName: users.name,
      username: users.username,
    })
    .from(downloads)
    .innerJoin(users, eq(users.id, downloads.userId))
    .orderBy(desc(downloads.createdAt))
    .limit(limit);
}
