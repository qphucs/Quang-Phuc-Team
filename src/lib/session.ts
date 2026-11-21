import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, type SessionUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

const PRESENCE_TOUCH_MS = 60_000;

/** Current session, de-duplicated per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** For pages inside the app: signed in and password already changed. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/dang-nhap");
  if (session.user.mustChangePassword) redirect("/doi-mat-khau");
  await touchLastSeen(session.user.id);
  return session.user;
}

/** Updates lastSeenAt at most once a minute (powers the "online" dot). */
async function touchLastSeen(userId: string) {
  const now = new Date();
  await db
    .update(users)
    .set({ lastSeenAt: now })
    .where(
      and(
        eq(users.id, userId),
        or(isNull(users.lastSeenAt), lt(users.lastSeenAt, new Date(now.getTime() - PRESENCE_TOUCH_MS))),
      ),
    );
}

/** For admin pages: hides the page entirely (404) when the permission is missing. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) notFound();
  return user;
}
