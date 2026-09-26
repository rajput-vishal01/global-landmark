import {
  ADDED_BY,
  AREA_UNITS,
  FURNISHINGS,
  PUBLICATION_STATES,
} from "../attributes";
import { normalisePropertyType } from "../taxonomy/property";
import { moneyField } from "./form-fields";
import { isCity, normaliseLocality, placeFromAddress } from "../locations";
import {
  isBundledImageUrl,
  isLocalImageUrl,
  MAX_UPLOAD_BYTES,
  storageKeyFromUrl,
} from "../storage";
import { FIELD_LABELS, requiredFieldsFor } from "../taxonomy/sections";
import {
  DOCUMENTATION_FLAGS,
  LEGAL_FLAGS,
  LOAN_FLAGS,
  PARKING_TYPES,
  PLC_ATTRIBUTES,
} from "../taxonomy/features";
import { OWNER_TYPES, SELLER_CATEGORIES } from "../taxonomy/status";
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
  // Repo-bundled Tricity photography (public/local) — same origin, no
  // remotePattern needed, and what the seed data points at.
  if (isBundledImageUrl(url)) return true;
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

export type ParsedDocument = {
  docType: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string | null;
  uploadedBy: string | null;
  isPublic: boolean;
};

/**
 * Legal documents (R-29). Every row must carry a storageKey that already
 * exists under private/ — this parser never writes bytes, it only accepts
 * or rejects rows pointing at a file the upload route already stored.
 * `docType` is validated against DOCUMENTATION_FLAGS so the vault and the
 * documentation checklist stay one vocabulary.
 */
export function parseDocuments(json: string): ParsedDocument[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 30) return null;
  const documents: ParsedDocument[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const d = item as Record<string, unknown>;
    const docType = pick(d.docType, DOCUMENTATION_FLAGS);
    const storageKey = str(d.storageKey, 200);
    const fileName = str(d.fileName, 200);
    const mimeType = str(d.mimeType, 100);
    const sizeBytes = int(d.sizeBytes, MAX_UPLOAD_BYTES);
    // A row missing any of these does not point at a real uploaded file —
    // drop it rather than saving a broken download link.
    if (!docType || !storageKey || !fileName || !mimeType || sizeBytes === null) {
      continue;
    }
    documents.push({
      docType,
      storageKey,
      fileName,
      mimeType,
      sizeBytes,
      note: str(d.note, 1000) || null,
      uploadedBy: str(d.uploadedBy, 200) || null,
      // `=== true` and nothing else. NEVER derived from docType: a document
      // type is a label an admin typed, and a mistyped one must not be able
      // to publish a sale deed. Anything that is not a literal true — a
      // missing field, "true" as a string, a truthy object — is false, so
      // the private default is what a malformed payload gets.
      isPublic: d.isPublic === true,
    });
  }
  return documents;
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


/**
 * A Google Maps link, pasted from Share → Copy link. Replaces the old
 * latitude / longitude pair: one field, and the admin gets it the same way
 * any visitor would. It is PUBLIC — pasting it is the decision to show the
 * map, so there is no separate "show on map" switch.
 *
 * Only Google's own hosts get through: this lands in an href on the public
 * page, so an arbitrary URL here would be a link to anywhere wearing our
 * "Open in Google Maps" label.
 */
export function parseMapsUrl(value: FormDataEntryValue | null): string | null | "invalid" {
  const s = String(value ?? "").trim().slice(0, 1000);
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return "invalid";
  }
  if (u.protocol !== "https:") return "invalid";
  const host = u.hostname.toLowerCase();
  const isMaps =
    host === "maps.app.goo.gl" ||
    /^maps\.google\.[a-z.]+$/.test(host) ||
    ((host === "goo.gl" || /^(www\.)?google\.[a-z.]+$/.test(host)) &&
      u.pathname.startsWith("/maps"));
  return isMaps ? u.toString() : "invalid";
}

/**
 * Exactly the fields the form carries — nothing else.
 *
 * Fields the client removed from the form (category, status, price and
 * charges, configuration, classification, unit sizes, specifications, the
 * detailed location) are deliberately NOT here. The action spreads this
 * object into the UPDATE, so anything listed here and missing from the form
 * would be written back as null / false / a default on every save, wiping
 * whatever an older listing held. Leaving them out leaves those columns
 * untouched.
 */
export type ParsedProperty = {
  title: string;
  publicationState: string;
  hideFromListings: boolean;
  addedBy: string;
  sourceName: string | null;
  kind: "project" | "unit";
  projectName: string;
  description: string;
  location: string;
  mapsUrl: string | null;
  /**
   * City and locality read out of the address — they still drive the public
   * city filter. Null when the address names no known city; the action then
   * leaves whatever the row already has.
   */
  place: { city: string; locality: string | null } | null;
  propertyType: string | null;
  plotArea: number | null;
  plotAreaUnit: string | null;
  builtUpArea: number | null;
  builtUpAreaUnit: string | null;
  superArea: number | null;
  superAreaUnit: string | null;
  carpetArea: number | null;
  carpetAreaUnit: string | null;
  areaSqft: number | null;
  /**
   * What the office is asking, in rupees. Internal: the public queries read
   * it through `showPricePublicly`, which is off by default, so a listing
   * still says "Price on request" until someone deliberately turns it on.
   */
  demandPrice: number | null;
  frontFeet: number | null;
  depthFeet: number | null;
  plcAttributes: string[];
  furnishing: string | null;
  furnishingInventory: string[];
  amenities: string[];
  parkingTypes: string[];
  parkingSlots: number | null;
  legalFlags: string[];
  reraNumber: string | null;
  loanFlags: string[];
  banksOnPanel: string[];
  documentationFlags: string[];
  extras: { title: string; description: string }[];
  images: ParsedImage[];
  /** Child tables, written by the action after the row itself. */
  owners: ParsedOwner[];
  media: ParsedMedium[];
  documents: ParsedDocument[];
};

/**
 * Where the listing is filed: the city and locality the form sent, falling
 * back to what the address reads like.
 *
 * The form used to send neither, and the city was guessed from the address
 * text alone. An address the parser did not recognise — a locality spelled
 * differently, a missing city — left the row with no city at all, and a
 * listing with no city appears under no city filter and on no location card,
 * with nothing in the admin to show why. The dropdowns make it explicit; the
 * guess stays as their default.
 */
function chosenPlace(
  formData: FormData,
  location: string
): { city: string; locality: string | null } | null {
  const city = String(formData.get("city") ?? "").trim();
  if (!city || !isCity(city)) return placeFromAddress(location);
  // The locality may be one the broker typed — the client's list never named
  // every colony they sell in. normaliseLocality keeps a known name exact and
  // accepts a clean new one.
  return { city, locality: normaliseLocality(city, formData.get("locality") as string) };
}

export function parseProperty(
  formData: FormData,
  mode: ParseMode = "publish"
):
  | { ok: true; data: ParsedProperty }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  // Required even for a draft — it is how the listing is found again.
  if (!title) return { ok: false, error: "A title is required." };

  const location = String(formData.get("location") ?? "").trim().slice(0, 300);
  if (!location) return { ok: false, error: "An address is required." };

  const kind = String(formData.get("kind") ?? "unit");
  if (kind !== "project" && kind !== "unit") {
    return { ok: false, error: "Choose a valid listing type." };
  }

  const mapsUrl = parseMapsUrl(formData.get("mapsUrl"));
  if (mapsUrl === "invalid") {
    return {
      ok: false,
      error:
        "The map link must be a Google Maps link. In Google Maps press Share, then Copy link, and paste that.",
    };
  }

  const images = parseImages(String(formData.get("imagesJson") ?? "[]"));
  if (images === null) {
    return {
      ok: false,
      error:
        "Image list is invalid — upload files, or paste an images.unsplash.com URL.",
    };
  }

  // Not parseChoice: the field is a datalist, so a type the broker typed in
  // is legitimate. normalisePropertyType keeps the known ones exact and
  // accepts a clean custom one, dropping anything else.
  const propertyType = normalisePropertyType(String(formData.get("propertyType") ?? ""));

  // Everything publishing needs, reported together rather than one per
  // round trip. Draft saves skip this entirely.
  if (mode === "publish") {
    const missing = [
      ...(images.length ? [] : ["at least one photo"]),
      ...requiredFieldsFor(propertyType)
        .filter((field) => !String(formData.get(field) ?? "").trim())
        .map((field) => FIELD_LABELS[field]),
    ];
    if (missing.length) {
      return {
        ok: false,
        error: `To publish this listing, add ${missing.join(" and ")}. Or set Publication to Draft to save it for now.`,
      };
    }
  }

  const amenities = parseAmenities(String(formData.get("amenitiesJson") ?? "[]"));
  if (amenities === null) return { ok: false, error: "Amenity list is invalid." };

  const extras = parseExtras(String(formData.get("extrasJson") ?? "[]"));
  if (extras === null) return { ok: false, error: "Additional details are invalid." };

  const owners = parseOwners(String(formData.get("ownersJson") ?? "[]"));
  if (owners === null) return { ok: false, error: "Owner details are invalid." };

  const media = parseMedia(String(formData.get("mediaJson") ?? "[]"));
  if (media === null) return { ok: false, error: "Media links are invalid." };

  const documents = parseDocuments(String(formData.get("documentsJson") ?? "[]"));
  if (documents === null) return { ok: false, error: "Document rows are invalid." };

  const areaUnitValues = AREA_UNITS.map((u) => u.value);
  const num = (name: string) => {
    const v = parseOptionalInt(formData.get(name));
    return v === "invalid" ? null : v;
  };
  const unit = (name: string) => parseChoice(formData.get(name), areaUnitValues);
  // Not `num`: that caps at 10 crore, which a Tricity villa passes. The cap
  // here is 1,000 crore — high enough for anything real, low enough that a
  // pasted phone number or a fat-fingered extra zero is refused. moneyField
  // also ignores the commas a broker types.
  const price = (name: string) => moneyField(formData, name, 100_000_000_000);
  const list = (name: string, allowed: readonly string[] | null, max?: number) =>
    parseList(String(formData.get(name) ?? "[]"), allowed, max) ?? [];

  const plotArea = num("plotArea");
  const plotAreaUnit = unit("plotAreaUnit");
  const superArea = num("superArea");
  const superAreaUnit = unit("superAreaUnit");
  const builtUpArea = num("builtUpArea");
  const builtUpAreaUnit = unit("builtUpAreaUnit");
  const carpetArea = num("carpetArea");
  const carpetAreaUnit = unit("carpetAreaUnit");

  return {
    ok: true,
    data: {
      title,
      // Unknown values fall back to the safe default rather than failing
      // the save: a broker mid-call should not lose a listing to a stale select.
      publicationState:
        parseChoice(formData.get("publicationState"), PUBLICATION_STATES) ?? "draft",
      // Live but unlisted — a Deal of the Week the office does not want on
      // the market. An unchecked box posts nothing, which reads as false.
      hideFromListings: formData.get("hideFromListings") === "1",
      addedBy: parseChoice(formData.get("addedBy"), ADDED_BY) ?? "Global Landmark",
      sourceName: String(formData.get("sourceName") ?? "").trim().slice(0, 200) || null,
      kind,
      // Free text — an unknown name creates the project (never a hard constraint).
      projectName: String(formData.get("projectName") ?? "").trim().slice(0, 200),
      description: String(formData.get("description") ?? "").trim().slice(0, 10_000),
      location,
      mapsUrl,
      place: chosenPlace(formData, location),
      propertyType,
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
      demandPrice: price("demandPrice"),
      frontFeet: num("frontFeet"),
      depthFeet: num("depthFeet"),
      plcAttributes: list("plcAttributesJson", PLC_ATTRIBUTES),
      furnishing: parseChoice(formData.get("furnishing"), FURNISHINGS),
      furnishingInventory: list("furnishingInventoryJson", null, 30),
      amenities,
      parkingTypes: list("parkingTypesJson", PARKING_TYPES),
      parkingSlots: num("parkingSlots"),
      legalFlags: list("legalFlagsJson", LEGAL_FLAGS),
      reraNumber: String(formData.get("reraNumber") ?? "").trim().slice(0, 120) || null,
      loanFlags: list("loanFlagsJson", LOAN_FLAGS),
      banksOnPanel: list("banksOnPanelJson", null, 30),
      // An uploaded file of a type is proof the document exists, so it ticks
      // that type on the checklist even if nobody ticked it by hand.
      documentationFlags: [
        ...new Set([
          ...list("documentationFlagsJson", DOCUMENTATION_FLAGS),
          ...documents.map((d) => d.docType),
        ]),
      ],
      extras,
      images,
      owners,
      media,
      documents,
    },
  };
}
