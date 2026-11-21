import { db } from "@/db";
import { files } from "@/db/schema";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { saveUpload, type UploadKind } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 210 * 1024 * 1024; // largest allowed file + form overhead

/** Editors upload a single file (skill cover, video, step image or attachment). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  if (!can(session.user, "skill:write")) {
    return Response.json({ ok: false, error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_REQUEST_BYTES) {
    return Response.json({ ok: false, error: { code: "VALIDATION_ERROR", message: "Tệp quá lớn." } }, { status: 400 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const purpose = form.get("purpose");
    if (!(file instanceof File)) throw new AppError("VALIDATION_ERROR", "Chưa chọn tệp.");

    const expected: UploadKind | undefined =
      purpose === "image" || purpose === "video" || purpose === "document" ? purpose : undefined;
    const saved = await saveUpload(new Uint8Array(await file.arrayBuffer()), expected);

    const [row] = await db
      .insert(files)
      .values({
        kind: saved.kind,
        mime: saved.mime,
        sizeBytes: saved.sizeBytes,
        storageKey: saved.storageKey,
        originalName: file.name.slice(0, 200),
        uploadedBy: session.user.id,
      })
      .returning({ id: files.id, kind: files.kind, originalName: files.originalName });
    return Response.json({ ok: true, data: row });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: ERROR_CODES[error.code].status },
      );
    }
    console.error("[upload] unexpected error", error);
    return Response.json({ ok: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
