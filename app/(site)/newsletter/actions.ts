"use server";

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
    // people forget they subscribed. onConflictDoNothing turns that from a
    // constraint violation into an empty `returning`, which also settles the
    // race between two submissions of the same address. Note it deliberately
    // does NOT clear `unsubscribedAt`: an unsubscribe stays honoured.
    const inserted = await db
      .insert(newsletterSubscribers)
      .values({ email, source: "footer" })
      .onConflictDoNothing({ target: newsletterSubscribers.email })
      .returning({ id: newsletterSubscribers.id });

    return inserted.length > 0
      ? { status: "ok", message: "Thank you — you're on the list." }
      : { status: "ok", message: "You're already subscribed." };
  } catch (err) {
    console.error("subscribeToNewsletter failed:", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}
