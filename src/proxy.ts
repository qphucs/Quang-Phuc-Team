import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/** Routes reachable without a session. */
const PUBLIC_PATHS = ["/dang-nhap"];
const DEV_PUBLIC_PATHS = ["/kitchen-sink"];

/**
 * Optimistic gate: only checks that a session cookie exists.
 * Real verification happens in layouts (lib/session.ts) and Server Actions (lib/action.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));
  const isPublic =
    PUBLIC_PATHS.includes(pathname) || (process.env.NODE_ENV !== "production" && DEV_PUBLIC_PATHS.includes(pathname));

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/dang-nhap", request.url));
  }
  if (hasSession && pathname === "/dang-nhap") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|webmanifest|js)$).*)"],
};
