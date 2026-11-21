import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseEmbedHtml } from "./oembed";

describe("parseEmbedHtml", () => {
  it("reads the author and caption from the embed HTML", () => {
    const html =
      '<blockquote class="tiktok-embed"><section> <a target="_blank" title="@creator" href="https://www.tiktok.com/@creator?refer=embed">@creator</a> Hiệu ứng zoom &amp; beat #capcut <a href="https://www.tiktok.com/music/x">♬ nhạc</a></section></blockquote>';
    const info = parseEmbedHtml(html);
    expect(info.author).toBe("creator");
    expect(info.caption).toContain("Hiệu ứng zoom & beat #capcut");
  });

  it("returns empty values when the HTML has no section", () => {
    expect(parseEmbedHtml("<div>nothing</div>")).toEqual({ caption: "", author: "" });
  });
});
