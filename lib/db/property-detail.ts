import { and, asc, eq } from "drizzle-orm";
import { db } from "./index";
import { propertyDocuments, propertyUnitSizes } from "./schema";
import { publicDocumentUrl } from "@/lib/storage";

/**
 * The two Phase-E reads the property detail page needs on top of
 * getPropertyBySlug(), each one gated in SQL rather than at render time.
 *
 * They live here rather than in queries.ts because one of them is a gate,
 * not a projection, and a gate belongs next to the reason it exists:
 *
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

export type PropertyDetailExtras = {
  unitSizes: PublicUnitSize[];
  documents: PublicDocument[];
};

const EMPTY: PropertyDetailExtras = { unitSizes: [], documents: [] };

export async function getPropertyDetailExtras(
  propertyId: number
): Promise<PropertyDetailExtras> {
  try {
    const [unitSizes, documents] = await Promise.all([
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
    ]);

    return {
      unitSizes,
      documents: documents.map(({ storageKey, ...doc }) => ({
        ...doc,
        url: publicDocumentUrl(storageKey),
      })),
    };
  } catch (err) {
    // Fail soft, like every other public read: a detail page missing its
    // unit table still beats a 500.
    console.error("getPropertyDetailExtras failed:", err);
    return EMPTY;
  }
}
