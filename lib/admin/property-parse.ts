import { isCategory } from "../categories";
import {
  ADDED_BY,
  AREA_UNITS,
  FACINGS,
  FURNISHINGS,
  LISTING_STATUSES,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  PUBLICATION_STATES,
} from "../attributes";
import { CITY_NAMES, isLocalityIn } from "../locations";
import { isLocalImageUrl, storageKeyFromUrl } from "../storage";
import { requiredFieldsFor } from "../taxonomy/sections";

/**
 * Pure parsing and validation for the property form.
 *
 * Deliberately free of anything server-only — no db, no next/headers — for
 * two reasons: a "use server" module cannot be compiled and required by
 * scripts/check-taxonomy.mjs, so parsing there would be unassertable; and
 * actions.ts was already approaching the file-size ceiling before the CFF
 * added ~150 fields and five child tables.
 *
 * Every helper here follows the house rule: an unknown value is DROPPED, not
 * rejected. A broker mid-call must not lose a listing to a stale select.
 */

/**
 * Draft saves skip the required-field checks; everything present is still
 * validated, and unknown values are still dropped. Autosave exists to
 * preserve a half-entered listing, so it must not refuse to save one for
 * being half-entered — the enforcement lives at publish, in one place.
 */
export type ParseMode = "draft" | "publish";

export type ParsedImage = { url: string; storageKey: string | null; alt: string };

const MAX_IMAGES = 20;

// Must stay in sync with images.remotePatterns in next.config.ts — a stored
// URL from any other host makes next/image throw at render and takes the
// public pages down with it, so reject it here at the entry point.
//
// Uploaded images are same-origin (/api/images/<sha256>) and need no host
// entry at all; this list only covers the remaining stock photography,
// which goes away when the client's own images land.
const IMAGE_HOSTS = new Set(["images.unsplash.com"]);

export function isAllowedImageUrl(url: string): boolean {
  if (isLocalImageUrl(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && IMAGE_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

export function parseImages(json: string): ParsedImage[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > MAX_IMAGES) return null;
  const images: ParsedImage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { url, alt } = item as Record<string, unknown>;
    if (typeof url !== "string" || !isAllowedImageUrl(url)) return null;
    images.push({
      url: url.slice(0, 1000),
      // Derived from the URL, never taken from the client: a forged key
      // would otherwise let a save delete an unrelated blob. External URLs
      // yield null and are never deleted from storage.
      storageKey: storageKeyFromUrl(url),
      alt: typeof alt === "string" ? alt.slice(0, 300) : "",
    });
  }
  return images;
}

export function parseOptionalInt(
  value: FormDataEntryValue | null
): number | null | "invalid" {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 100_000_000 ? n : "invalid";
}

/** Empty or unknown values become null — never a hard failure. */
export function parseChoice(
  value: FormDataEntryValue | null,
  allowed: readonly string[]
): string | null {
  const s = String(value ?? "").trim();
  return s && allowed.includes(s) ? s : null;
}

export function parseAmenities(json: string): string[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 40) return null;
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const value = item.trim().slice(0, 100);
    if (value) seen.add(value);
  }
  return [...seen];
}

export function parseExtras(
  json: string
): { title: string; description: string }[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 20) return null;
  const extras: { title: string; description: string }[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { title, description } = item as Record<string, unknown>;
    if (typeof title !== "string" || typeof description !== "string") return null;
    const t = title.trim().slice(0, 120);
    const d = description.trim().slice(0, 1000);
    if (t) extras.push({ title: t, description: d });
  }
  return extras;
}

export type ParsedProperty = {
  title: string;
  publicationState: string;
  listingStatus: string;
  addedBy: string;
  sourceName: string | null;
  city: string | null;
  locality: string | null;
  kind: "project" | "unit";
  category: "sale" | "purchase" | "lease" | "invest";
  projectName: string;
  description: string;
  location: string;
  propertyType: string | null;
  configuration: string | null;
  beds: number | null;
  baths: number | null;
  areaValue: number | null;
  areaUnit: string;
  facing: string | null;
  possessionStatus: string | null;
  furnishing: string | null;
  amenities: string[];
  extras: { title: string; description: string }[];
  images: ParsedImage[];
};

export function parseProperty(
  formData: FormData,
  mode: ParseMode = "publish"
):
  | { ok: true; data: ParsedProperty }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  // Required even for a draft — it is how the listing is found again.
  if (!title) return { ok: false, error: "A title is required." };

  const kind = String(formData.get("kind") ?? "unit");
  if (kind !== "project" && kind !== "unit") {
    return { ok: false, error: "Choose a valid listing type." };
  }

  const category = String(formData.get("category") ?? "");
  if (!isCategory(category)) {
    return { ok: false, error: "Choose a valid category." };
  }

  // Free text — an unknown name creates the project (never a hard constraint).
  const projectName = String(formData.get("projectName") ?? "").trim().slice(0, 200);

  const images = parseImages(String(formData.get("imagesJson") ?? "[]"));
  if (images === null) {
    return {
      ok: false,
      error:
        "Image list is invalid — upload files, or paste an images.unsplash.com URL.",
    };
  }
  if (mode === "publish" && !images.length) {
    return { ok: false, error: "Add at least one image before publishing." };
  }

  const beds = parseOptionalInt(formData.get("beds"));
  const baths = parseOptionalInt(formData.get("baths"));
  const areaValue = parseOptionalInt(formData.get("areaValue"));
  if (beds === "invalid" || baths === "invalid" || areaValue === "invalid") {
    return {
      ok: false,
      error: "Beds, baths, and area must be whole non-negative numbers.",
    };
  }

  const amenities = parseAmenities(String(formData.get("amenitiesJson") ?? "[]"));
  if (amenities === null) return { ok: false, error: "Amenity list is invalid." };

  const extras = parseExtras(String(formData.get("extrasJson") ?? "[]"));
  if (extras === null) return { ok: false, error: "Additional details are invalid." };

  const propertyType = parseChoice(formData.get("propertyType"), PROPERTY_TYPES);

  // The conditional rules (R-12): a tower flat cannot publish without a floor
  // and a unit; a plot cannot publish without a plot size. Draft saves skip
  // this entirely.
  if (mode === "publish") {
    const missing = requiredFieldsFor(propertyType).filter(
      (field) => !String(formData.get(field) ?? "").trim()
    );
    if (missing.length) {
      return {
        ok: false,
        error: `${propertyType} listings need ${missing.join(", ")} before publishing.`,
      };
    }
  }

  const city = parseChoice(formData.get("city"), CITY_NAMES);
  const locality = String(formData.get("locality") ?? "").trim().slice(0, 120) || null;

  return {
    ok: true,
    data: {
      title,
      // CFF group 1 — internal. Unknown values fall back to the safe
      // default rather than failing the save: a broker mid-call should not
      // lose a listing to a malformed select.
      publicationState:
        parseChoice(formData.get("publicationState"), PUBLICATION_STATES) ?? "draft",
      listingStatus:
        parseChoice(formData.get("listingStatus"), LISTING_STATUSES) ?? "Available",
      addedBy: parseChoice(formData.get("addedBy"), ADDED_BY) ?? "Global Landmark",
      sourceName:
        String(formData.get("sourceName") ?? "").trim().slice(0, 200) || null,
      city,
      // A locality is only meaningful under its own city — keeping one that
      // belongs to a different city would put the listing under the wrong
      // filter tab.
      locality: city && locality && isLocalityIn(city, locality) ? locality : null,
      kind,
      category,
      projectName,
      description: String(formData.get("description") ?? "").trim().slice(0, 10_000),
      location: String(formData.get("location") ?? "").trim().slice(0, 300),
      propertyType,
      configuration: String(formData.get("configuration") ?? "").trim().slice(0, 100) || null,
      beds,
      baths,
      areaValue,
      areaUnit:
        parseChoice(formData.get("areaUnit"), AREA_UNITS.map((u) => u.value)) ?? "sqft",
      facing: parseChoice(formData.get("facing"), FACINGS),
      possessionStatus: parseChoice(formData.get("possessionStatus"), POSSESSION_STATUSES),
      furnishing: parseChoice(formData.get("furnishing"), FURNISHINGS),
      amenities,
      extras,
      images,
    },
  };
}
