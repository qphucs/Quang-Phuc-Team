import { unzipSync } from "fflate";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({
  db: { insert: () => ({ values: async () => undefined }) },
}));
vi.mock("./provider", () => ({ resolveCached: vi.fn() }));

import { resolveCached } from "./provider";
import { buildImagesZip } from "./service";
import { AppError } from "@/lib/errors";

const LINK = "https://www.tiktok.com/@creator/photo/123";
const IMG = (n: number) => `https://p16-sign.tiktokcdn.com/image-${n}.jpeg`;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(resolveCached).mockReset();
});

describe("buildImagesZip (slideshow → ZIP)", () => {
  it("downloads every image and packs them into one archive", async () => {
    vi.mocked(resolveCached).mockResolvedValue({
      title: "Ảnh đẹp",
      author: "creator",
      cover: null,
      durationSec: null,
      video: null,
      audio: null,
      images: [IMG(1), IMG(2), IMG(3)],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => new Response(new TextEncoder().encode(`data:${url}`), { status: 200 })),
    );

    const result = await buildImagesZip({ userId: "u1", input: LINK });

    expect(result.fileName).toBe("creator - Ảnh đẹp.zip");
    const files = unzipSync(result.body);
    expect(Object.keys(files).sort()).toEqual([
      "creator - Ảnh đẹp-1.jpg",
      "creator - Ảnh đẹp-2.jpg",
      "creator - Ảnh đẹp-3.jpg",
    ]);
    expect(new TextDecoder().decode(files["creator - Ảnh đẹp-2.jpg"])).toBe(`data:${IMG(2)}`);
  });

  it("rejects a video post with no images", async () => {
    vi.mocked(resolveCached).mockResolvedValue({
      title: "Video",
      author: "creator",
      cover: null,
      durationSec: 10,
      video: "https://v16m.tiktokcdn-us.com/v.mp4",
      audio: null,
      images: [],
    });
    await expect(buildImagesZip({ userId: "u1", input: LINK })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("fails cleanly when one image cannot be fetched, instead of returning a partial archive", async () => {
    vi.mocked(resolveCached).mockResolvedValue({
      title: "Ảnh",
      author: "creator",
      cover: null,
      durationSec: null,
      video: null,
      audio: null,
      images: [IMG(1), IMG(2)],
    });
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        call += 1;
        return new Response("nope", { status: call === 1 ? 200 : 500 });
      }),
    );
    const error = await buildImagesZip({ userId: "u1", input: LINK }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("UPSTREAM_ERROR");
  });

  it("refuses media hosts outside the allow-list", async () => {
    vi.mocked(resolveCached).mockResolvedValue({
      title: "Ảnh",
      author: "creator",
      cover: null,
      durationSec: null,
      video: null,
      audio: null,
      images: ["https://169.254.169.254/latest"],
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(buildImagesZip({ userId: "u1", input: LINK })).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
