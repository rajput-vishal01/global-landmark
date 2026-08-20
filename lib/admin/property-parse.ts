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
import {
  DOCUMENTATION_FLAGS,
  LEGAL_FLAGS,
  LOAN_FLAGS,
  PARKING_TYPES,
  PLC_ATTRIBUTES,
} from "../taxonomy/features";
import {
  CONFIGURATIONS,
  DEAL_ATTRIBUTES,
  PROPERTY_AGES,
  ROOM_FLAGS,
} from "../taxonomy/property";
import { OWNER_TYPES, SELLER_CATEGORIES } from "../taxonomy/status";
import { CHARGE_TYPES, isChargeBasis } from "../taxonomy/price";
import { toSqft } from "../taxonomy/area";

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


/**
 * An unchecked HTML checkbox submits NOTHING, so every boolean field is
 * rendered as a hidden "false" immediately followed by a checkbox carrying
 * "true". That means the key arrives twice when ticked and once when not —
 * and `formData.get()` returns the FIRST value, which is always "false".
 * Reading all of them is the only correct way; getting this wrong makes a
 * box look impossible to tick.
 */
export function parseBool(formData: FormData, name: string): boolean {
  return formData.getAll(name).includes("true");
}

/**
 * A JSON string array from one of the checklist widgets, filtered against a
 * taxonomy when one is given. Unknown values are dropped rather than
 * rejected, matching every other parser here; `allowed = null` keeps
 * whatever was typed (amenities, banks on panel).
 */
export function parseList(
  json: string,
  allowed: readonly string[] | null,
  max = 60
): string[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > max) return null;
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const value = item.trim().slice(0, 120);
    if (!value) continue;
    if (allowed && !allowed.includes(value)) continue;
    seen.add(value);
  }
  return [...seen];
}

export type ParsedOwner = {
  name: string;
  sellerCategory: string | null;
  ownerType: string | null;
  ownerCount: number | null;
  mobile: string | null;
  altMobile: string | null;
  address: string | null;
  notes: string | null;
};

/** Owner rows. A row without a name is dropped — it identifies nothing. */
export function parseOwners(json: string): ParsedOwner[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 10) return null;
  const owners: ParsedOwner[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const o = item as Record<string, unknown>;
    const name = str(o.name, 200);
    if (!name) continue;
    owners.push({
      name,
      sellerCategory: pick(o.sellerCategory, SELLER_CATEGORIES),
      ownerType: pick(o.ownerType, OWNER_TYPES),
      ownerCount: int(o.ownerCount, 50),
      // Digits only: a number carrying spaces and dashes cannot be dialled
      // from the admin, and duplicate detection compares them literally.
      mobile: digits(o.mobile),
      altMobile: digits(o.altMobile),
      address: str(o.address, 500) || null,
      notes: str(o.notes, 1000) || null,
    });
  }
  return owners;
}

export type ParsedCharge = {
  chargeType: string;
  amount: number;
  basis: string;
  isIncludedInDemand: boolean;
};

export function parseCharges(json: string): ParsedCharge[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 30) return null;
  const charges: ParsedCharge[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const c = item as Record<string, unknown>;
    const chargeType = pick(c.chargeType, CHARGE_TYPES);
    const amount = int(c.amount, 100_000_000_000);
    // A charge with no type or no amount is an empty row the admin left
    // behind, not data.
    if (!chargeType || amount === null) continue;
    charges.push({
      chargeType,
      amount,
      basis: isChargeBasis(String(c.basis ?? "")) ? String(c.basis) : "lump_sum",
      isIncludedInDemand: c.isIncludedInDemand === true,
    });
  }
  return charges;
}

export type ParsedMedium = { kind: string; url: string; label: string };

const MEDIA_KINDS = ["video", "drone", "virtual_tour", "google_map", "brochure"];

/**
 * Link media. https only — an http embed would be blocked as mixed content
 * anyway, and a javascript: URL must never reach an href.
 */
export function parseMedia(json: string): ParsedMedium[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 20) return null;
  const media: ParsedMedium[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const m = item as Record<string, unknown>;
    const kind = pick(m.kind, MEDIA_KINDS);
    const url = str(m.url, 1000);
    if (!kind || !url) continue;
    try {
      if (new URL(url).protocol !== "https:") continue;
    } catch {
      continue;
    }
    media.push({ kind, url, label: str(m.label, 120) });
  }
  return media;
}

/**
 * The one area a listing is sorted and filtered by, normalised to sq.ft.
 *
 * Candidates are tried in the order a property is actually judged: plot size
 * first (a plot sells on land), then super area (how flats are quoted), then
 * built-up, then carpet. The first one actually filled wins; null when the
 * listing carries no area at all.
 */
function primaryAreaSqft(
  candidates: [number | null, string | null][]
): number | null {
  for (const [value, unit] of candidates) {
    if (value == null || !unit) continue;
    const sqft = toSqft(value, unit);
    if (sqft != null) return sqft;
  }
  return null;
}

// --- small shared coercions, used only by the row parsers above -------------

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function pick(v: unknown, allowed: readonly string[]): string | null {
  const s = str(v, 120);
  return s && allowed.includes(s) ? s : null;
}

function int(v: unknown, max: number): number | null {
  if (typeof v !== "number") {
    const raw = str(v, 20);
    // Number("") is 0, not NaN — without this an unanswered owner count
    // lands in the database as zero, and an empty charge row passes the
    // "no amount" check and gets inserted as a real ₹0 charge.
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= max ? parsed : null;
  }
  return Number.isInteger(v) && v >= 0 && v <= max ? v : null;
}

function digits(v: unknown): string | null {
  // Strips every NON-digit. An unescaped /D/ would strip literal capital-D
  // characters instead and leave the spaces in, which breaks click-to-dial
  // and the duplicate-detection index that compares numbers literally.
  const d = str(v, 40).replace(/[^0-9]/g, "");
  return d || null;
}

export type ParsedProperty = {
  title: string;
  publicationState: string;
  listingStatus: string;
  addedBy: string;
  sourceName: string | null;
  city: string | null;
  locality: string | null;
  sector: string | null;
  block: string | null;
  society: string | null;
  floorNumber: number | null;
  totalFloors: number | null;
  unitNumber: string | null;
  dealAttributes: string[];
  configurations: string[];
  balconies: number | null;
  roomFlags: string[];
  propertyAge: string | null;
  plotArea: number | null;
  plotAreaUnit: string | null;
  builtUpArea: number | null;
  builtUpAreaUnit: string | null;
  superArea: number | null;
  superAreaUnit: string | null;
  carpetArea: number | null;
  carpetAreaUnit: string | null;
  areaSqft: number | null;
  frontFeet: number | null;
  depthFeet: number | null;
  plcAttributes: string[];
  roadWidth: number | null;
  entranceWidth: number | null;
  ceilingHeight: number | null;
  isCorner: boolean;
  isParkFacing: boolean;
  furnishingInventory: string[];
  parkingTypes: string[];
  parkingSlots: number | null;
  legalFlags: string[];
  reraNumber: string | null;
  loanFlags: string[];
  banksOnPanel: string[];
  documentationFlags: string[];
  demandPrice: number | null;
  perSqftRate: number | null;
  isNegotiable: boolean;
  showPricePublicly: boolean;
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
  /** Child tables, written by the action after the row itself. */
  owners: ParsedOwner[];
  charges: ParsedCharge[];
  media: ParsedMedium[];
  /** property_internal — 1:1, internal always. */
  circleRate: number | null;
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

  const owners = parseOwners(String(formData.get("ownersJson") ?? "[]"));
  if (owners === null) return { ok: false, error: "Owner details are invalid." };

  const charges = parseCharges(String(formData.get("chargesJson") ?? "[]"));
  if (charges === null) return { ok: false, error: "Charge rows are invalid." };

  const media = parseMedia(String(formData.get("mediaJson") ?? "[]"));
  if (media === null) return { ok: false, error: "Media links are invalid." };

  const areaUnitValues = AREA_UNITS.map((u) => u.value);
  const num = (name: string) => {
    const v = parseOptionalInt(formData.get(name));
    return v === "invalid" ? null : v;
  };
  const unit = (name: string) => parseChoice(formData.get(name), areaUnitValues);

  const plotArea = num("plotArea");
  const plotAreaUnit = unit("plotAreaUnit");
  const superArea = num("superArea");
  const superAreaUnit = unit("superAreaUnit");
  const builtUpArea = num("builtUpArea");
  const builtUpAreaUnit = unit("builtUpAreaUnit");
  const carpetArea = num("carpetArea");
  const carpetAreaUnit = unit("carpetAreaUnit");

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
      sector: String(formData.get("sector") ?? "").trim().slice(0, 120) || null,
      block: String(formData.get("block") ?? "").trim().slice(0, 120) || null,
      society: String(formData.get("society") ?? "").trim().slice(0, 200) || null,
      floorNumber: num("floorNumber"),
      totalFloors: num("totalFloors"),
      unitNumber: String(formData.get("unitNumber") ?? "").trim().slice(0, 60) || null,
      dealAttributes: parseList(String(formData.get("dealAttributesJson") ?? "[]"), DEAL_ATTRIBUTES) ?? [],
      configurations: parseList(String(formData.get("configurationsJson") ?? "[]"), CONFIGURATIONS) ?? [],
      balconies: num("balconies"),
      roomFlags: parseList(String(formData.get("roomFlagsJson") ?? "[]"), ROOM_FLAGS) ?? [],
      propertyAge: parseChoice(formData.get("propertyAge"), PROPERTY_AGES),
      plotArea,
      plotAreaUnit,
      builtUpArea,
      builtUpAreaUnit,
      superArea,
      superAreaUnit,
      carpetArea,
      carpetAreaUnit,
      // The area a listing is judged by differs per type: a plot is sold on
      // plot size, a flat on super area. Normalising the most meaningful one
      // is what lets a 500 sq.yd plot sort against a 2000 sq.ft flat.
      areaSqft: primaryAreaSqft([
        [plotArea, plotAreaUnit],
        [superArea, superAreaUnit],
        [builtUpArea, builtUpAreaUnit],
        [carpetArea, carpetAreaUnit],
      ]),
      frontFeet: num("frontFeet"),
      depthFeet: num("depthFeet"),
      plcAttributes: parseList(String(formData.get("plcAttributesJson") ?? "[]"), PLC_ATTRIBUTES) ?? [],
      roadWidth: num("roadWidth"),
      entranceWidth: num("entranceWidth"),
      ceilingHeight: num("ceilingHeight"),
      isCorner: parseBool(formData, "isCorner"),
      isParkFacing: parseBool(formData, "isParkFacing"),
      furnishingInventory: parseList(String(formData.get("furnishingInventoryJson") ?? "[]"), null, 30) ?? [],
      parkingTypes: parseList(String(formData.get("parkingTypesJson") ?? "[]"), PARKING_TYPES) ?? [],
      parkingSlots: num("parkingSlots"),
      legalFlags: parseList(String(formData.get("legalFlagsJson") ?? "[]"), LEGAL_FLAGS) ?? [],
      reraNumber: String(formData.get("reraNumber") ?? "").trim().slice(0, 120) || null,
      loanFlags: parseList(String(formData.get("loanFlagsJson") ?? "[]"), LOAN_FLAGS) ?? [],
      banksOnPanel: parseList(String(formData.get("banksOnPanelJson") ?? "[]"), null, 30) ?? [],
      documentationFlags: parseList(String(formData.get("documentationFlagsJson") ?? "[]"), DOCUMENTATION_FLAGS) ?? [],
      demandPrice: num("demandPrice"),
      perSqftRate: num("perSqftRate"),
      isNegotiable: parseBool(formData, "isNegotiable"),
      // Defaults to OFF and must be ticked deliberately: the public site
      // shows "Price on request" unless this is true.
      showPricePublicly: parseBool(formData, "showPricePublicly"),
      owners,
      charges,
      media,
      circleRate: num("circleRate"),
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
