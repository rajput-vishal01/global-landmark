import { and, asc, eq } from "drizzle-orm";
import { db } from "./index";
import { properties, propertyDocuments, propertyUnitSizes } from "./schema";
import { publicDocumentUrl } from "@/lib/storage";

/**
 * The three Phase-E reads the property detail page needs on top of
 * getPropertyBySlug(), each one gated in SQL rather than at render time.
 *
 * They live here rather than in queries.ts because two of them are gates,
 * not projections, and a gate belongs next to the reason it exists:
 *
 *   - The map pin is selected ONLY when `showMapPublicly` is true. That
 *     column defaults to false and this is the single place a public page
 *     can obtain coordinates. Putting `latitude`/`longitude` into
 *     PUBLIC_PROPERTY_COLUMNS instead would have shipped the pin in the RSC
 *     payload of every listing whether or not the broker published it —
 *     the same mistake the withheld demand price already taught us (see the
 *     note above PUBLIC_PRICE_EXTRA in queries.ts).
 *   - Documents are selected ONLY where `isPublic` is true, and never by
 *     `docType`. A doc type is a label an admin typed; it is not consent to
 *     publish a sale deed.
 *
 * Unit sizes are public by nature — a price list is what a project page is
 * for — so that one is a plain read.
 *
 * Uncached on purpose: the page itself is ISR (revalidate 3600) and admin
 * saves bust it through revalidatePath, so wrapping these in unstable_cache
 * would add a second cache layer with nothing left to save.
 */

export type PublicUnitSize = {
  id: number;
  unitLabel: string;
  areaValue: number | null;
  areaUnit: string | null;
  price: number | null;
};

/** A published brochure. `url` already points at the public document route. */
export type PublicDocument = {
  id: number;
  docType: string;
  fileName: string;
  sizeBytes: number;
  url: string;
};

/**
 * Coordinates as numbers, rounded to three decimals (~110 m).
 *
 * The rounding is the "approximate-area pin, not door-pin" rule: a launched
 * project wants to be findable, and a private resale kothi whose owner
 * details are internal should not have its front door published even once
 * the broker has ticked the box.
 */
export type PublicMapPin = { latitude: number; longitude: number };

export type PropertyDetailExtras = {
  unitSizes: PublicUnitSize[];
  documents: PublicDocument[];
  mapPin: PublicMapPin | null;
};

const EMPTY: PropertyDetailExtras = { unitSizes: [], documents: [], mapPin: null };

/** Coordinates are stored as text (copied out of Google Maps by hand). */
function toPin(latitude: string | null, longitude: string | null): PublicMapPin | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return {
    latitude: Math.round(lat * 1000) / 1000,
    longitude: Math.round(lng * 1000) / 1000,
  };
}

export async function getPropertyDetailExtras(
  propertyId: number
): Promise<PropertyDetailExtras> {
  try {
    const [unitSizes, documents, pinRows] = await Promise.all([
      db
        .select({
          id: propertyUnitSizes.id,
          unitLabel: propertyUnitSizes.unitLabel,
          areaValue: propertyUnitSizes.areaValue,
          areaUnit: propertyUnitSizes.areaUnit,
          price: propertyUnitSizes.price,
        })
        .from(propertyUnitSizes)
        .where(eq(propertyUnitSizes.propertyId, propertyId))
        .orderBy(asc(propertyUnitSizes.sortOrder), asc(propertyUnitSizes.id)),

      db
        .select({
          id: propertyDocuments.id,
          docType: propertyDocuments.docType,
          fileName: propertyDocuments.fileName,
          sizeBytes: propertyDocuments.sizeBytes,
          storageKey: propertyDocuments.storageKey,
        })
        .from(propertyDocuments)
        .where(
          and(
            eq(propertyDocuments.propertyId, propertyId),
            // The gate. Never `docType = 'Brochure'`, never a render-time
            // check on a row this query already returned.
            eq(propertyDocuments.isPublic, true)
          )
        )
        .orderBy(asc(propertyDocuments.id)),

      db
        .select({ latitude: properties.latitude, longitude: properties.longitude })
        .from(properties)
        .where(
          and(
            eq(properties.id, propertyId),
            // The gate. An unpublished pin never leaves the database, so
            // there is nothing in the payload to read out of devtools.
            eq(properties.showMapPublicly, true)
          )
        ),
    ]);

    return {
      unitSizes,
      documents: documents.map(({ storageKey, ...doc }) => ({
        ...doc,
        url: publicDocumentUrl(storageKey),
      })),
      mapPin: pinRows[0]
        ? toPin(pinRows[0].latitude, pinRows[0].longitude)
        : null,
    };
  } catch (err) {
    // Fail soft, like every other public read: a detail page missing its
    // unit table still beats a 500.
    console.error("getPropertyDetailExtras failed:", err);
    return EMPTY;
  }
}
