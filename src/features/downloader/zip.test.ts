import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildZip } from "./zip";

describe("buildZip", () => {
  it("packs every image and the archive round-trips byte for byte", () => {
    const a = new Uint8Array([0xff, 0xd8, 1, 2, 3]);
    const b = new Uint8Array([0xff, 0xd8, 9, 9]);
    const zip = buildZip([
      { name: "a.jpg", data: a },
      { name: "b.jpg", data: b },
    ]);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(["a.jpg", "b.jpg"]);
    expect(Array.from(files["a.jpg"])).toEqual(Array.from(a));
    expect(Array.from(files["b.jpg"])).toEqual(Array.from(b));
  });

  it("keeps duplicate names apart instead of overwriting", () => {
    const zip = buildZip([
      { name: "x.jpg", data: new Uint8Array([1]) },
      { name: "x.jpg", data: new Uint8Array([2]) },
    ]);
    expect(Object.keys(unzipSync(zip)).sort()).toEqual(["x-2.jpg", "x.jpg"]);
  });

  it("returns a valid empty archive for no files", () => {
    expect(Object.keys(unzipSync(buildZip([])))).toEqual([]);
  });
});
