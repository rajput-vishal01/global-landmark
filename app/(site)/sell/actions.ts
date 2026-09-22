"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { properties, propertyImages, propertyOwners } from "@/lib/db/schema";
import { uniqueSlug } from "@/lib/db/unique-slug";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { refCode as buildRefCode } from "@/lib/attributes";
import { isAreaUnit } from "@/lib/taxonomy/area";
import { isConfiguration, PROPERTY_TYPES } from "@/lib/taxonomy/property";
import { CITY_NAMES, placeFromAddress } from "@/lib/locations";
import { parseMapsUrl } from "@/lib/admin/property-parse";
import { parseSellPhotos } from "@/lib/sell-photos";
import { deleteStoredFiles, storageKeyFromUrl } from "@/lib/storage";
import { sendSubmissionEmail } from "@/lib/email";

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
 * Same shape as tours/contact: honeypot, rate limit, fail soft,
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

  const mapsUrl = parseMapsUrl(formData.get("mapsUrl"));
  if (mapsUrl === "invalid") {
    return {
      status: "error",
      message: "The map link should be a Google Maps link — in Google Maps press Share, then Copy link.",
    };
  }

  // The seller’s exact address is private (the form promises so), so it
  // goes on the owner record and the listing gets a public line built from
  // sector, locality and city instead. It used to be saved as the listing’s
  // own address, which put it on the website the moment it was approved.
  const address = field(formData, "address", 300);
  const locality = field(formData, "locality", 120);
  const sector = field(formData, "sector", 60);
  const city =
    oneOf(field(formData, "city", 100), CITY_NAMES) ??
    (address ? placeFromAddress(address)?.city ?? null : null);
  const publicLocation = [sector, locality, city].filter(Boolean).join(", ");
  const areaUnitRaw = field(formData, "areaUnit", 20);
  const configuration = field(formData, "configuration", 40);

  // Dropped rather than rejected, and restricted to files this site stored
  // itself — see parseSellPhotos. A bad list loses the photos, not the
  // submission.
  const photos = parseSellPhotos(formData.get("photosJson"));

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
          locality,
          sector,
          location: publicLocation,
          mapsUrl,

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

      // The seller's photographs. Inside the transaction with the row they
      // belong to, so a failure half way cannot leave a gallery pointing at
      // a property that was never created.
      if (photos.length) {
        await tx.insert(propertyImages).values(
          photos.map((url, i) => ({
            propertyId: row.id,
            url,
            // No alt text from a public form: it is a free-text field on a
            // page that renders it, and the broker writes a real one when
            // they review the submission.
            alt: "",
            sortOrder: i,
          }))
        );
      }

      // The seller's contact details live here and nowhere else. This table
      // is internal by construction — no public query reads it.
      await tx.insert(propertyOwners).values({
        propertyId: row.id,
        name: ownerName,
        mobile,
        sellerCategory: "Owner",
        ownerType: "Individual",
        address,
        notes: email ? `Submitted from the website. Email: ${email}` : "Submitted from the website.",
      });
    });
  } catch (err) {
    console.error("submitProperty failed:", err);

    // The photos were written to disk by /api/sell/upload before this action
    // ran, so a failed transaction would strand them: files with no row that
    // will ever point at them, on a public upload path anyone can reach.
    // Sweep them here, where the keys are still in hand.
    //
    // Best-effort on purpose. If the sweep itself fails the seller still gets
    // the error they need, and scripts/sweep-orphan-uploads.mjs is the
    // backstop for anything this misses.
    try {
      await deleteStoredFiles(
        photos.map(storageKeyFromUrl).filter((k): k is string => Boolean(k)),
        "public"
      );
    } catch (sweepErr) {
      console.error("submitProperty: orphaned photo sweep failed:", sweepErr);
    }

    return { status: "error", message: "Something went wrong. Please try again." };
  }

  // Saved first, emailed after the response, as for tours: the listing is
  // already in Admin → Submissions, so mail trouble is a `[mail]` log line.
  after(() =>
    sendSubmissionEmail({ title, location: publicLocation, ownerName, mobile, email, photos: photos.length })
  );

  return { status: "sent" };
}
