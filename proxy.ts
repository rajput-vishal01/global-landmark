import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin/auth";

/**
 * Host-based admin isolation:
 *  - main domain:   /admin/* does not exist (404) — the panel has no public URL
 *  - admin.<domain>: every path is rewritten into /admin/* and gated by the
 *    signed session cookie (login page excepted)
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  // Exact match when ADMIN_HOST is configured; the prefix fallback is
  // dev-only (admin.localhost:3000 without config). In production an unset
  // ADMIN_HOST fails closed — the Host header is attacker-supplied, so a
  // prefix match there would let any "admin.*" Host reach the panel routes.
  const adminHost = process.env.ADMIN_HOST;
  const isAdminHost = adminHost
    ? host === adminHost
    : process.env.NODE_ENV !== "production" && host.startsWith("admin.");
  const { pathname } = request.nextUrl;

  if (!isAdminHost) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  // Public API routes (search, ig-thumb) stay at their real paths — the
  // admin panel's own pages call them too.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const adminPath =
    pathname === "/admin" || pathname.startsWith("/admin/")
      ? pathname // already internal (server-action POSTs resolve here)
      : pathname === "/"
        ? "/admin"
        : `/admin${pathname}`;

  const authed = verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

  // Redirect/rewrite targets derive from request.url, whose host has just
  // matched ADMIN_HOST exactly in production — so the origin is pinned, not
  // attacker-chosen.

  if (!authed && adminPath !== "/admin/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authed && adminPath === "/admin/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.rewrite(new URL(adminPath, request.url));
}

export const config = {
  // Skip static assets; everything else (pages, RSC, server actions) is routed.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
