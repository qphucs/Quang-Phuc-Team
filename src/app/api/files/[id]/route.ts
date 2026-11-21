import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { files, skillAttachments, skills, skillSteps } from "@/db/schema";
import { AppError, ERROR_CODES } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { openStored } from "@/lib/storage";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/** A member may read a file only when a published skill uses it. Editors may read anything. */
async function memberCanRead(fileId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(
        eq(skills.status, "published"),
        or(
          eq(skills.coverFileId, fileId),
          eq(skills.videoFileId, fileId),
          sql`exists (select 1 from ${skillSteps} where ${skillSteps.skillId} = ${skills.id} and ${skillSteps.mediaFileId} = ${fileId})`,
          sql`exists (select 1 from ${skillAttachments} where ${skillAttachments.skillId} = ${skills.id} and ${skillAttachments.fileId} = ${fileId})`,
        ),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  if (!UUID.test(id)) return Response.json({ ok: false, error: { code: "NOT_FOUND" } }, { status: 404 });

  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) return Response.json({ ok: false, error: { code: "NOT_FOUND" } }, { status: 404 });

  const allowed = can(session.user, "skill:write") || (await memberCanRead(id));
  if (!allowed) return Response.json({ ok: false, error: { code: "NOT_FOUND" } }, { status: 404 });

  try {
    const range = request.headers.get("range");
    const result = await openStored(file.storageKey, range);
    const headers: Record<string, string> = {
      "Content-Type": file.mime,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition":
        file.kind === "document" ? `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}` : "inline",
    };
    if (result.status === 416) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${result.size}` } });
    }
    if (result.status === 206) {
      headers["Content-Range"] = `bytes ${result.start}-${result.end}/${result.size}`;
      headers["Content-Length"] = String(result.end - result.start + 1);
      return new Response(result.stream, { status: 206, headers });
    }
    headers["Content-Length"] = String(result.size);
    return new Response(result.stream, { status: 200, headers });
  } catch (error) {
    const code = error instanceof AppError ? error.code : "INTERNAL_ERROR";
    return Response.json({ ok: false, error: { code } }, { status: ERROR_CODES[code].status });
  }
}
