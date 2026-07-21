"use server";

import { timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearAdminSession, setAdminSession } from "@/lib/admin/session";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export type LoginState = { error?: string };

function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // One shared password — throttle guesses per connection, with a global
  // cap that header spoofing cannot escape.
  if (isRateLimited("admin-login", clientIp(await headers()), 10, 100)) {
    return { error: "Too many attempts. Try again in an hour." };
  }
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    return { error: "That password is not correct." };
  }
  // Without this, login would "succeed" but every token verification fails —
  // an undebuggable redirect loop. Fail loudly instead.
  if (!process.env.ADMIN_SESSION_SECRET) {
    return { error: "ADMIN_SESSION_SECRET is not configured on the server." };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}
