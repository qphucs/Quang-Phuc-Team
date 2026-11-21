import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { detectFile } from "./storage";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (s: string) => new TextEncoder().encode(s);

describe("detectFile (checks real content, not the file name)", () => {
  it("recognises JPEG, PNG and WEBP images", () => {
    expect(detectFile(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(detectFile(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d))?.mime).toBe("image/png");
    expect(detectFile(new Uint8Array([...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")]))?.mime).toBe("image/webp");
  });

  it("recognises MP4 and MOV videos by the ftyp box", () => {
    expect(detectFile(new Uint8Array([0, 0, 0, 0x18, ...text("ftypisom")]))?.mime).toBe("video/mp4");
    expect(detectFile(new Uint8Array([0, 0, 0, 0x14, ...text("ftypqt  ")]))?.mime).toBe("video/quicktime");
  });

  it("recognises PDF, ZIP and fonts", () => {
    expect(detectFile(text("%PDF-1.7"))?.kind).toBe("document");
    expect(detectFile(bytes(0x50, 0x4b, 0x03, 0x04))?.mime).toBe("application/zip");
    expect(detectFile(bytes(0x00, 0x01, 0x00, 0x00))?.mime).toBe("font/ttf");
  });

  it("rejects anything else, including an HTML or script disguised as an image", () => {
    expect(detectFile(text("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectFile(text("GIF89a"))).toBeNull();
    expect(detectFile(new Uint8Array())).toBeNull();
  });
});
