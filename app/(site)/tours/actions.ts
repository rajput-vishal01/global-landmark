"use server";

import { headers } from "next/headers";
import { idField } from "@/lib/admin/form-fields";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { properties, tourRequests } from "@/lib/db/schema";
import { sendTourEmails } from "@/lib/email";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { isTourTime, isTourType } from "@/lib/taxonomy/tours";

/**
 * "Schedule a tour", submitted from a property detail page.
 *
 * A folder with no page.tsx — an action, not a route — matching
 * contact/actions.ts.
 *
 * What lands in `tour_requests` is INTERNAL: a name, a phone number and an
 * email belonging to someone who asked to visit a property. Nothing here
 * returns it, no public query reads the table, and the confirmation the
 * visitor sees echoes nothing back.
 */

export type TourState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A date input submits YYYY-MM-DD; the column is a `date`, not a timestamp. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function requestTour(
  _prev: TourState,
  formData: FormData
): Promise<TourState> {
  // Honeypot — real visitors never fill this hidden field. Reported as
  // success so a bot learns nothing from the difference.
  if (formData.get("company")) return { status: "sent" };

  if (isRateLimited("tour", clientIp(await headers()), 5, 200)) {
    return {
      status: "error",
      message: "Too many requests from this connection. Please try again later.",
    };
  }

  const propertyId = idField(formData, "propertyId");

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 50);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);

  // A tour is a callback: without a way to reach them there is nothing to
  // schedule, so a phone number is the one hard requirement beyond a name.
  if (!name || !phone) {
    return { status: "error", message: "Please give your name and a phone number." };
  }
  if (email && !EMAIL_RE.test(email)) {
    return { status: "error", message: "That email address does not look right." };
  }

  const tourType = String(formData.get("tourType") ?? "");
  const preferredTime = String(formData.get("preferredTime") ?? "");
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();

  const request = {
    name,
    phone,
    email: email || null,
    // Unknown values are dropped rather than rejected, the same house rule
    // the admin parsers follow: a stale select must not lose the request.
    tourType: isTourType(tourType) ? tourType : null,
    preferredDate: DATE_RE.test(preferredDate) ? preferredDate : null,
    preferredTime: isTourTime(preferredTime) ? preferredTime : null,
    message: String(formData.get("message") ?? "").trim().slice(0, 2000) || null,
  };

  try {
    await db.insert(tourRequests).values({ propertyId, ...request });
  } catch (err) {
    console.error("requestTour failed:", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  // Saved first, emailed second: the request is already in Admin → Tour
  // Requests, so a mail failure is logged and never shown as a failed visit.
  try {
    const [property] = propertyId
      ? await db
          .select({ title: properties.title, refCode: properties.refCode, slug: properties.slug })
          .from(properties)
          .where(eq(properties.id, propertyId))
      : [];
    await sendTourEmails({ ...request, property: property ?? null });
  } catch (err) {
    console.error("requestTour: email failed (request already saved):", err);
  }

  return { status: "sent" };
}
