"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

/**
 * Newsletter signup, submitted from the footer on every public page.
 *
 * A folder with no page.tsx: this is an action, not a route. It sits under
 * app/(site) with the other public actions rather than next to the form,
 * matching contact/actions.ts and sell/actions.ts.
 *
 * The stored address is INTERNAL. Nothing here returns it, and no public
 * query reads the table — see the note in lib/db/content.ts.
 */

export type SubscribeState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  // Honeypot — real users never fill this hidden field. Reported as success
  // so a bot learns nothing from the difference.
  if (formData.get("company")) return { status: "ok", message: "You're on the list." };

  if (isRateLimited("newsletter", clientIp(await headers()), 5, 200)) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const email = String(formData.get("email") ?? "").trim().slice(0, 200).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  try {
    // The email column is UNIQUE and a second signup is the NORMAL case —
    // people forget they subscribed — so a duplicate must not read as an
    // error. MySQL has no RETURNING, so the two outcomes are told apart by
    // asking first and letting the unique index settle the race: a
    // simultaneous duplicate throws ER_DUP_ENTRY, which is caught below and
    // answered with the same friendly line rather than a failure.
    //
    // Deliberately does NOT clear `unsubscribedAt` — an unsubscribe stays
    // honoured, which is why this is not a blind upsert.
    const existing = await db
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length) return { status: "ok", message: "You're already subscribed." };

    try {
      await db.insert(newsletterSubscribers).values({ email, source: "footer" });
    } catch (err) {
      if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
        return { status: "ok", message: "You're already subscribed." };
      }
      throw err;
    }

    return { status: "ok", message: "Thank you — you're on the list." };
  } catch (err) {
    console.error("subscribeToNewsletter failed:", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}
