import { describe, expect, it } from "vitest";
import { buildFileName, isAllowedMediaUrl, normalizeTikTokUrl } from "./link";

describe("normalizeTikTokUrl", () => {
  it("accepts TikTok links on any tiktok.com subdomain", () => {
    expect(normalizeTikTokUrl("https://www.tiktok.com/@user/video/123")).toBe("https://www.tiktok.com/@user/video/123");
    expect(normalizeTikTokUrl("https://vm.tiktok.com/ZMabc/")).toBe("https://vm.tiktok.com/ZMabc/");
    expect(normalizeTikTokUrl("  https://m.tiktok.com/v/1  ")).not.toBeNull();
  });

  it("rejects other hosts, lookalike hosts and non-https links", () => {
    expect(normalizeTikTokUrl("https://evil-tiktok.com/video")).toBeNull();
    expect(normalizeTikTokUrl("https://tiktok.com.evil.io/video")).toBeNull();
    expect(normalizeTikTokUrl("http://www.tiktok.com/@a/video/1")).toBeNull();
    expect(normalizeTikTokUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeTikTokUrl("not a url")).toBeNull();
  });
});

describe("isAllowedMediaUrl", () => {
  it("allows TikTok CDN and resolver hosts over https only", () => {
    expect(isAllowedMediaUrl("https://v16m.tiktokcdn-us.com/abc.mp4")).toBe(true);
    expect(isAllowedMediaUrl("https://www.tikwm.com/video/media/play/1.mp4")).toBe(true);
  });

  it("blocks other hosts, plain http and internal addresses", () => {
    expect(isAllowedMediaUrl("http://v16m.tiktokcdn-us.com/abc.mp4")).toBe(false);
    expect(isAllowedMediaUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedMediaUrl("https://localhost:3000/secret")).toBe(false);
    expect(isAllowedMediaUrl("https://tiktokcdn.com.evil.io/x.mp4")).toBe(false);
  });
});

describe("buildFileName", () => {
  it("joins author and title and keeps Vietnamese letters", () => {
    expect(buildFileName({ author: "minhanh", title: "Chuyển cảnh zoom" }, "mp4")).toBe(
      "minhanh - Chuyển cảnh zoom.mp4",
    );
  });

  it("removes characters that are unsafe in file names", () => {
    expect(buildFileName({ author: "a/b", title: 'x:y*z?"<>|' }, "mp3")).not.toMatch(/[\\/:*?"<>|]/);
  });

  it("adds a 1-based index for images and falls back when empty", () => {
    expect(buildFileName({ author: "", title: "", index: 1 }, "jpg")).toBe("tiktok-2.jpg");
  });

  it("caps the base name at 80 characters", () => {
    const name = buildFileName({ author: "a".repeat(100), title: "b" }, "mp4");
    expect(name.length).toBeLessThanOrEqual(84);
  });
});
