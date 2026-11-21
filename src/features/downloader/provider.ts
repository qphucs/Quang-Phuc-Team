import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors";

/** What a resolver tells us about one TikTok post. Media URLs are remote and never shown to the browser. */
export type MediaInfo = {
  title: string;
  author: string;
  cover: string | null;
  durationSec: number | null;
  video: string | null; // watermark-free MP4 only; never a watermarked fallback
  audio: string | null;
  images: string[];
};

/** 🔒 Provider interface. Swapping free → paid means adding a class here and changing TIKTOK_PROVIDER. */
export interface TikTokProvider {
  readonly name: string;
  resolve(url: string): Promise<MediaInfo>;
}

const TIKWM_ENDPOINT = "https://www.tikwm.com/api/";
const REQUEST_TIMEOUT_MS = 20_000;

const tikwmSchema = z.object({
  code: z.number(),
  msg: z.string().nullish(),
  data: z
    .object({
      title: z.string().nullish(),
      cover: z.string().nullish(),
      duration: z.number().nullish(),
      play: z.string().nullish(),
      music: z.string().nullish(),
      images: z.array(z.string()).nullish(),
      author: z.object({ nickname: z.string().nullish(), unique_id: z.string().nullish() }).nullish(),
    })
    .nullish(),
});

function nonEmpty(value: string | null | undefined): string | null {
  return value && value.trim() !== "" ? value : null;
}

export class FreeProvider implements TikTokProvider {
  readonly name = "free";

  async resolve(url: string): Promise<MediaInfo> {
    const form = new FormData();
    form.append("url", url);

    let response: Response;
    try {
      response = await fetch(TIKWM_ENDPOINT, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; QPTeam/1.0)" },
      });
    } catch {
      throw new AppError("UPSTREAM_ERROR");
    }
    if (!response.ok) throw new AppError("UPSTREAM_ERROR");

    const parsed = tikwmSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) throw new AppError("UPSTREAM_ERROR");

    // The resolver reports bad or private links with a non-zero code.
    if (parsed.data.code !== 0 || !parsed.data.data) {
      throw new AppError("NOT_FOUND", "Không tìm thấy video. Link có thể sai hoặc video đang riêng tư.");
    }

    const d = parsed.data.data;
    const images = (d.images ?? []).filter((u) => u.trim() !== "");
    const author = nonEmpty(d.author?.nickname) ?? nonEmpty(d.author?.unique_id) ?? "";
    return {
      title: (d.title ?? "").trim(),
      author,
      cover: nonEmpty(d.cover),
      durationSec: typeof d.duration === "number" ? d.duration : null,
      video: images.length === 0 ? nonEmpty(d.play) : null,
      audio: nonEmpty(d.music),
      images,
    };
  }
}

/** Placeholder for the paid API (docs/04-architecture.md §3.2). Not enabled in v1. */
class PaidProvider implements TikTokProvider {
  readonly name = "paid";
  async resolve(): Promise<MediaInfo> {
    throw new AppError("UPSTREAM_ERROR", "Nguồn trả phí chưa được bật.");
  }
}

export function getProvider(): TikTokProvider {
  const name = process.env.TIKTOK_PROVIDER ?? "free";
  return name === "paid" ? new PaidProvider() : new FreeProvider();
}

/** Resolving the same link again within 10 minutes reuses the result: fewer upstream calls. */
const CACHE_TTL_MS = 10 * 60_000;
const cache = new Map<string, { value: MediaInfo; expires: number }>();

export async function resolveCached(url: string): Promise<MediaInfo> {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expires > now) return hit.value;
  const value = await getProvider().resolve(url);
  cache.set(url, { value, expires: now + CACHE_TTL_MS });
  // Keep the map small: drop expired entries whenever we write.
  for (const [key, entry] of cache) if (entry.expires <= now) cache.delete(key);
  return value;
}
