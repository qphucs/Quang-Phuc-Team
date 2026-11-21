import "server-only";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";

/** 🔒 Upload rules (docs/03-conventions.md §9). Checked by file content, not by file name. */
export type UploadKind = "image" | "video" | "document";

const LIMITS: Record<UploadKind, number> = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  document: 50 * 1024 * 1024,
};

const STORAGE_ROOT = path.resolve(process.cwd(), "storage");

type Detected = { kind: UploadKind; mime: string; ext: string };

function startsWith(buf: Uint8Array, bytes: number[], offset = 0) {
  return bytes.every((b, i) => buf[offset + i] === b);
}
const ascii = (buf: Uint8Array, text: string, offset = 0) =>
  text.split("").every((c, i) => buf[offset + i] === c.charCodeAt(0));

/** Identifies the real file type from its first bytes. Anything unknown is rejected. */
export function detectFile(buf: Uint8Array): Detected | null {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { kind: "image", mime: "image/jpeg", ext: "jpg" };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47])) return { kind: "image", mime: "image/png", ext: "png" };
  if (ascii(buf, "RIFF") && ascii(buf, "WEBP", 8)) return { kind: "image", mime: "image/webp", ext: "webp" };
  if (ascii(buf, "ftyp", 4)) {
    // MOV uses the "qt  " brand, MP4 uses isom/mp41/mp42 and similar.
    const brand = ascii(buf, "qt  ", 8) ? "mov" : "mp4";
    return brand === "mov"
      ? { kind: "video", mime: "video/quicktime", ext: "mov" }
      : { kind: "video", mime: "video/mp4", ext: "mp4" };
  }
  if (ascii(buf, "%PDF")) return { kind: "document", mime: "application/pdf", ext: "pdf" };
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) return { kind: "document", mime: "application/zip", ext: "zip" };
  if (startsWith(buf, [0x00, 0x01, 0x00, 0x00]) || ascii(buf, "true")) {
    return { kind: "document", mime: "font/ttf", ext: "ttf" };
  }
  if (ascii(buf, "OTTO")) return { kind: "document", mime: "font/otf", ext: "otf" };
  return null;
}

export type SavedFile = { storageKey: string; kind: UploadKind; mime: string; sizeBytes: number; ext: string };

/** Saves an uploaded buffer under a server-generated key. The client never chooses the path. */
export async function saveUpload(buf: Uint8Array, expectedKind?: UploadKind): Promise<SavedFile> {
  const detected = detectFile(buf);
  if (!detected) throw new AppError("VALIDATION_ERROR", "Tệp không đúng định dạng cho phép.");
  if (expectedKind && detected.kind !== expectedKind) {
    throw new AppError("VALIDATION_ERROR", "Loại tệp không khớp với nơi tải lên.");
  }
  if (buf.byteLength > LIMITS[detected.kind]) {
    const mb = Math.round(LIMITS[detected.kind] / 1024 / 1024);
    throw new AppError("VALIDATION_ERROR", `Tệp quá lớn. Tối đa ${mb} MB cho loại này.`);
  }

  const now = new Date();
  const dir = path.join(
    STORAGE_ROOT,
    detected.kind,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
  );
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${detected.ext}`;
  await writeFile(path.join(dir, name), buf);

  const storageKey = path.posix.join(
    detected.kind,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    name,
  );
  return { storageKey, kind: detected.kind, mime: detected.mime, sizeBytes: buf.byteLength, ext: detected.ext };
}

function resolveKey(storageKey: string): string {
  const full = path.resolve(STORAGE_ROOT, storageKey);
  // Defence in depth: the key must stay inside the storage root.
  if (!full.startsWith(STORAGE_ROOT + path.sep)) throw new AppError("NOT_FOUND");
  return full;
}

/**
 * Streams a stored file. Supports HTTP Range so phones can seek inside videos.
 * Returns 206 for a valid range, 416 for an unsatisfiable one.
 */
export async function openStored(storageKey: string, rangeHeader: string | null) {
  const full = resolveKey(storageKey);
  let size: number;
  try {
    size = (await stat(full)).size;
  } catch {
    throw new AppError("NOT_FOUND");
  }

  const match = rangeHeader?.match(/^bytes=(\d*)-(\d*)$/);
  if (match && (match[1] !== "" || match[2] !== "")) {
    let start: number;
    let end: number;
    if (match[1] === "") {
      const suffix = Number(match[2]);
      start = Math.max(0, size - suffix);
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
    }
    if (start >= size || start > end) return { status: 416 as const, size };
    const stream = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream<Uint8Array>;
    return { status: 206 as const, size, start, end, stream };
  }

  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream<Uint8Array>;
  return { status: 200 as const, size, start: 0, end: size - 1, stream };
}
