import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth, type SessionUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

/** Current session, de-duplicated per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** For pages inside the app: signed in and password already changed. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/dang-nhap");
  if (session.user.mustChangePassword) redirect("/doi-mat-khau");
  return session.user;
}

/** For admin pages: hides the page entirely (404) when the permission is missing. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) notFound();
  return user;
}
