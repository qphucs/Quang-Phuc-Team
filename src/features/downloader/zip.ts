import { zipSync } from "fflate";

export type ZipEntry = { name: string; data: Uint8Array };

/** Packs files into a ZIP archive. Images are already compressed, so level 0 (store) is fast and close to the same size. */
export function buildZip(entries: ZipEntry[]): Uint8Array {
  const files: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (const entry of entries) {
    // Keep names unique if two images share a name.
    let name = entry.name;
    let n = 2;
    while (name in files) {
      const dot = entry.name.lastIndexOf(".");
      name = dot > 0 ? `${entry.name.slice(0, dot)}-${n}${entry.name.slice(dot)}` : `${entry.name}-${n}`;
      n += 1;
    }
    files[name] = [entry.data, { level: 0 }];
  }
  return zipSync(files);
}
