import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors";

/**
 * TikTok's public oEmbed endpoint: official, no API key, returns title, author and a thumbnail.
 * Used to fill in a trend when an admin pastes a link.
 */
const oembedSchema = z.object({
  title: z.string().nullish(),
  author_name: z.string().nullish(),
  thumbnail_url: z.string().nullish(),
  html: z.string().nullish(),
});

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "\u0027")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/** For videos where oEmbed gives no title, the caption is inside the embed HTML. */
export function parseEmbedHtml(html: string): { caption: string; author: string } {
  const author = html.match(/tiktok\.com\/@([^/?"\s<]+)/)?.[1] ?? "";
  const section = html.match(/<section>([\s\S]*?)<\/section>/)?.[1] ?? "";
  const caption = decodeEntities(section.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  return { caption: caption.slice(0, 200), author: decodeEntities(author) };
}

export type OembedInfo = { title: string; author: string; thumbnail: string | null };

export async function fetchOembed(url: string): Promise<OembedInfo> {
  let response: Response;
  try {
    response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; QPTeam/1.0)" },
    });
  } catch {
    throw new AppError("UPSTREAM_ERROR", "Không lấy được thông tin từ TikTok. Hãy thử lại sau.");
  }
  if (response.status === 404) throw new AppError("NOT_FOUND", "Không tìm thấy video này trên TikTok.");
  if (!response.ok) throw new AppError("UPSTREAM_ERROR", "Không lấy được thông tin từ TikTok. Hãy thử lại sau.");

  const parsed = oembedSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new AppError("UPSTREAM_ERROR", "Phản hồi từ TikTok không đúng định dạng.");
  const fromHtml = parsed.data.html ? parseEmbedHtml(parsed.data.html) : { caption: "", author: "" };
  return {
    title: (parsed.data.title ?? "").trim() || fromHtml.caption,
    author: (parsed.data.author_name ?? "").trim() || fromHtml.author,
    thumbnail: parsed.data.thumbnail_url ?? null,
  };
}
