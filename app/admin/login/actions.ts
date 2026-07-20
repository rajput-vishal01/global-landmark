"use server";

import { timingSafeEqual } from "crypto";
import { clearAdminSession, setAdminSession } from "@/lib/admin/session";

export type LoginState = { error?: string; success?: boolean };

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
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    return { error: "That password is not correct." };
  }
  await setAdminSession();
  // No server redirect: a client-router navigation would bypass the proxy's
  // host rewrite and render the public site on the admin origin. The form
  // does a full-page navigation instead.
  return { success: true };
}

export type LogoutState = { done?: boolean };

export async function logout(): Promise<LogoutState> {
  await clearAdminSession();
  return { done: true };
}
