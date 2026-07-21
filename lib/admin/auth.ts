import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless admin session: `exp.hmac(exp)` signed with ADMIN_SESSION_SECRET.
 * Pure crypto only — imported by proxy.ts, server actions, and login.
 *
 * Revocation: tokens have no per-session kill switch — to force-logout a
 * leaked session, rotate ADMIN_SESSION_SECRET (invalidates every session).
 */

export const ADMIN_COOKIE = "gld_admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createAdminToken(now = Date.now()): string {
  const exp = String(now + SESSION_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !secret()) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
