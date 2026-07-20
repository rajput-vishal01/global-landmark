import { cookies } from "next/headers";
import { ADMIN_COOKIE, createAdminToken, verifyAdminToken } from "./auth";

/** Cookie helpers for server actions / server components. */

export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/**
 * Server actions must authorize themselves — proxy coverage alone is not
 * enough (Next data-security guidance). Throws on missing/invalid session.
 */
export async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!verifyAdminToken(store.get(ADMIN_COOKIE)?.value)) {
    throw new Error("Unauthorized");
  }
}
