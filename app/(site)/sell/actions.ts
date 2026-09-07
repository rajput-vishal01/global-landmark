"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, propertyOwners } from "@/lib/db/schema";
import { uniqueSlug } from "@/lib/db/unique-slug";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { refCode as buildRefCode } from "@/lib/attributes";
import { isAreaUnit } from "@/lib/taxonomy/area";
import { isConfiguration, PROPERTY_TYPES } from "@/lib/taxonomy/property";
import { CITY_NAMES } from "@/lib/locations";

/**
 * "List your property" — the public seller submission (R-56).
 *
 * A submission is NOT a new kind of record. It is an ordinary `properties`
 * row written with `publicationState: "draft"`, which the single
 * `isPubliclyVisible()` gate already hides from every public query, the
 * detail route and the sitemap. Approving it is publishing it; declining it
 * is archiving it. `submittedAt` is what marks it as having come from here
 * rather than from a broker starting a draft.
 *
 * Three rules make a public write to the listings table safe:
 *
 * 1. **Allowlist, not passthrough.** Only the fields below are ever read
 *    from the request. Everything internal — brokerage, circle rate, owner
 *    notes, unit number, coordinates, legal flags, publication state — is
 *    not in this file at all, so no crafted field can reach them.
 * 2. **The lifecycle fields are constants here**, never client-supplied. A
 *    request cannot ask to be published, or to be Available, or to be
 *    attributed to Global Landmark.
 * 3. **Contact details go to `property_owners`**, the internal table the
 *    leak-check gate already asserts never reaches a public page.
 *
 * Same shape as tours/contact/newsletter: honeypot, rate limit, fail soft,
 * and nothing echoed back to the visitor.
 */

export type ListPropertyState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Long enough for a real description, short enough not to be a payload. */
const MAX_DESCRIPTION = 4000;

/** Trimmed, capped, empty-as-null — the public mirror of lib/admin/form-fields. */
function field(formData: FormData, key: string, max: number): string | null {
  return String(formData.get(key) ?? "").trim().slice(0, max) || null;
}

/** A price or area the seller typed. Rejects junk rather than coercing it. */
function positiveNumber(formData: FormData, key: string, max: number): number | null {
  const raw = String(formData.get(key) ?? "").trim().replace(/,/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n <= max ? Math.round(n) : null;
}

/** Unknown select values are dropped, not rejected — the house rule everywhere else. */
function oneOf(value: string | null, allowed: readonly string[]): string | null {
  return value && allowed.includes(value) ? value : null;
}

export async function submitProperty(
  _prev: ListPropertyState,
  formData: FormData
): Promise<ListPropertyState> {
  // Honeypot — real visitors never fill this hidden field. Reported as
  // success so a bot learns nothing from the difference.
  if (formData.get("company")) return { status: "sent" };

  // Tighter than the enquiry forms: this one writes a row to the listings
  // table, so the per-connection budget is a handful a day, not a handful
  // an hour. The global cap is the backstop a spoofed IP cannot escape.
  if (isRateLimited("list-property", clientIp(await headers()), 5, 100)) {
    return {
      status: "error",
      message: "Too many submissions from this connection. Please try again later.",
    };
  }

  const ownerName = field(formData, "ownerName", 200);
  const mobile = field(formData, "mobile", 50);
  const email = field(formData, "email", 200);
  const title = field(formData, "title", 200);

  // A listing with no name is unreviewable and a seller with no number is
  // unreachable — everything else can be filled in during the review call.
  if (!title || !ownerName || !mobile) {
    return {
      status: "error",
      message: "Please give the property a title, your name and a phone number.",
    };
  }
  if (email && !EMAIL_RE.test(email)) {
    return { status: "error", message: "That email address does not look right." };
  }

  const city = oneOf(field(formData, "city", 100), CITY_NAMES);
  const areaUnitRaw = field(formData, "areaUnit", 20);
  const configuration = field(formData, "configuration", 40);

  try {
    const slug = await uniqueSlug(title);
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(properties)
        .values({
          slug,
          title,
          description: field(formData, "description", MAX_DESCRIPTION) ?? "",

          // Not from the request. A submission is always an unpublished,
          // owner-sourced draft awaiting review.
          publicationState: "draft",
          listingStatus: "Available",
          addedBy: "Owner",
          sourceName: ownerName,
          submittedAt: new Date(),

          // A seller is either selling or letting; the other two category
          // values are buy-side and cannot be reached from this form.
          category: field(formData, "category", 20) === "lease" ? "lease" : "sale",
          propertyType: oneOf(field(formData, "propertyType", 60), PROPERTY_TYPES),
          configuration: configuration && isConfiguration(configuration) ? configuration : null,

          city,
          locality: field(formData, "locality", 120),
          sector: field(formData, "sector", 60),
          location: field(formData, "address", 300) ?? "",

          areaValue: positiveNumber(formData, "areaValue", 10_000_000),
          // NOT NULL with a "sqft" default — an unrecognised unit falls back
          // rather than failing the insert.
          areaUnit: areaUnitRaw && isAreaUnit(areaUnitRaw) ? areaUnitRaw : "sqft",
          // The seller's asking price. `showPricePublicly` stays false (its
          // default), so even once this is approved the figure is not on the
          // page until an admin deliberately publishes it.
          demandPrice: positiveNumber(formData, "expectedPrice", 100_000_000_000),
        })
        .$returningId();

      // Same scheme as the admin path: derived from the row id inside the
      // transaction, so two submissions at the same moment cannot collide.
      await tx
        .update(properties)
        .set({ refCode: buildRefCode(city, new Date().getFullYear(), row.id) })
        .where(eq(properties.id, row.id));

      // The seller's contact details live here and nowhere else. This table
      // is internal by construction — no public query reads it.
      await tx.insert(propertyOwners).values({
        propertyId: row.id,
        name: ownerName,
        mobile,
        sellerCategory: "Owner",
        ownerType: "Individual",
        notes: email ? `Submitted from the website. Email: ${email}` : "Submitted from the website.",
      });
    });
  } catch (err) {
    console.error("submitProperty failed:", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return { status: "sent" };
}
