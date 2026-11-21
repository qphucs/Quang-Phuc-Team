"use client";

export type UploadedFile = { id: string; kind: "image" | "video" | "document"; originalName: string };

/** Uploads one file through /api/upload and returns its id. Throws a Vietnamese message on failure. */
export async function uploadFile(
  file: File,
  purpose: "image" | "video" | "document" | "avatar",
): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const json = (await response.json().catch(() => null)) as
    { ok: true; data: UploadedFile } | { ok: false; error: { message?: string; code: string } } | null;
  if (!json) throw new Error("Tải lên thất bại. Hãy thử lại.");
  if (!json.ok) throw new Error(json.error.message ?? "Tải lên thất bại. Hãy thử lại.");
  return json.data;
}
