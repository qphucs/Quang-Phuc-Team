import { streamMedia } from "@/features/downloader/service";
import { fileQuerySchema } from "@/features/downloader/schemas";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function jsonError(code: keyof typeof ERROR_CODES, message?: string) {
  return Response.json(
    { ok: false, error: { code, message: message ?? ERROR_CODES[code].message } },
    { status: ERROR_CODES[code].status, headers: { "Cache-Control": "no-store" } },
  );
}

/** Content-Disposition with an ASCII fallback plus the UTF-8 name, so Vietnamese file names survive. */
function attachment(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/** Streams a watermark-free file to a signed-in member, after checking quota and permission. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("UNAUTHENTICATED");
  if (!can(session.user, "download:use")) return jsonError("FORBIDDEN");

  const { searchParams } = new URL(request.url);
  const parsed = fileQuerySchema.safeParse({
    url: searchParams.get("url") ?? "",
    kind: searchParams.get("kind") ?? "",
    index: searchParams.get("index") ?? undefined,
  });
  if (!parsed.success) return jsonError("VALIDATION_ERROR", "Yêu cầu tải không hợp lệ.");

  try {
    const file = await streamMedia({
      userId: session.user.id,
      input: parsed.data.url,
      kind: parsed.data.kind,
      index: parsed.data.index,
    });
    const headers: Record<string, string> = {
      "Content-Type": file.contentType,
      "Content-Disposition": attachment(file.fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (file.contentLength) headers["Content-Length"] = file.contentLength;
    return new Response(file.body, { headers });
  } catch (error) {
    if (error instanceof AppError) return jsonError(error.code, error.message);
    console.error("[downloads] unexpected error", error);
    return jsonError("INTERNAL_ERROR");
  }
}
