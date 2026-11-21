/** Accepts only https links on TikTok domains (including short links). Anything else is rejected before any request. */
export function normalizeTikTokUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  const isTikTok = host === "tiktok.com" || host.endsWith(".tiktok.com");
  return isTikTok ? url.toString() : null;
}

/** Media hosts we are willing to fetch from. Prevents the proxy from being used to reach arbitrary URLs. */
const MEDIA_HOST = /(^|\.)(tiktokcdn[a-z0-9-]*\.com|tiktokv\.com|tikwm\.com)$/i;

export function isAllowedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && MEDIA_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

/** Builds a safe, readable file name: "<author>-<title>.<ext>", max 80 characters before the extension. */
export function buildFileName(parts: { author: string; title: string; index?: number }, ext: string): string {
  const clean = (s: string) =>
    s
      .normalize("NFC")
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const base = [clean(parts.author), clean(parts.title)].filter(Boolean).join(" - ").slice(0, 80).trim() || "tiktok";
  const suffix = parts.index !== undefined ? `-${parts.index + 1}` : "";
  return `${base}${suffix}.${ext}`;
}
