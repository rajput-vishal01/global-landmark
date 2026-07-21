import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin/auth";

/**
 * Session gate for the admin panel at /admin/* — unauthenticated requests
 * land on the login page. Pages and actions still verify the cookie
 * themselves (defense in depth); this just keeps the UX right.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

  if (!authed && pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (authed && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
