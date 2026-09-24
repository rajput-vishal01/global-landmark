/**
 * Physical property taxonomy — the CFF's own lists, verbatim.
 *
 * Every list here is the single source shared by the admin form, the server
 * action's validation and the public renderer. Adding an option needs no
 * migration: these values are stored as text, validated against the list on
 * write, and unknown values are dropped rather than saved.
 */

/**
 * CFF group 2, as the client uses it.
 *
 * Trimmed to five residential types in Sep 2026, then widened again when
 * the client started listing commercial space: a shop, an SCO and a
 * commercial site are things they sell, and a type list that cannot say so
 * pushes that into the title where nothing can filter on it.
 *
 * The five original strings are unchanged, so every stored listing keeps its
 * type. Order here is display order; the groups below only label them.
 *
 * This list is not a closed set any more: the form also accepts a type the
 * broker types in (see `isCustomPropertyType`), because the next thing they
 * sell will not wait for a deploy. Custom values are stored as written and
 * appear in the filters once a listing uses one.
 *
 * The CFF also lists "Lease", "Pre-Leased Property" and "Investment
 * Property" here, but those describe the deal, not the structure — a
 * pre-leased shop is still a Shop — so they are not types. "Lease" itself
 * is the existing `lease` category in lib/categories.ts.
 */
export const PROPERTY_TYPES = [
  "Flat/Apartment",
  "Independent House",
  "Villa",
  "Builder Floor",
  "Penthouse",
  "Studio / SOHO",
  "Shop",
  "Showroom",
  "SCO (Shop-cum-Office)",
  "Office Space",
  "Commercial Site",
  "Residential Plot",
  "Commercial Plot",
  "Agricultural Land",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** How the list is shown: one heading per kind of property. */
export const PROPERTY_TYPE_GROUPS: { label: string; types: PropertyType[] }[] = [
  {
    label: "Residential",
    types: ["Flat/Apartment", "Independent House", "Villa", "Builder Floor", "Penthouse", "Studio / SOHO"],
  },
  {
    label: "Commercial",
    types: ["Shop", "Showroom", "SCO (Shop-cum-Office)", "Office Space", "Commercial Site"],
  },
  {
    label: "Land",
    types: ["Residential Plot", "Commercial Plot", "Agricultural Land"],
  },
];

/** Longest a typed-in type may be — it has to fit a filter row and a card. */
export const MAX_PROPERTY_TYPE = 40;

export function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value);
}

/**
 * A type the broker typed rather than picked.
 *
 * Kept deliberately plain: letters, digits, spaces and the punctuation a
 * property type actually uses ("Shop-cum-Office", "SCO / Booth", "Farm
 * House"). Anything else is refused rather than cleaned up silently, so a
 * pasted paragraph cannot become a filter option.
 */
export function isCustomPropertyType(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length > 1 &&
    trimmed.length <= MAX_PROPERTY_TYPE &&
    /^[\p{L}\p{N}][\p{L}\p{N} ./&()'-]*$/u.test(trimmed)
  );
}

/** The stored value for a submitted type: a known one, a clean custom one, or nothing. */
export function normalisePropertyType(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (isPropertyType(value)) return value;
  return isCustomPropertyType(value) ? value.replace(/\s+/g, " ") : null;
}

/**
 * The picker/filter list: the built-ins, then any custom type already
 * stored. A type typed into one listing becomes a filter option for every
 * other, which is the whole point of allowing them.
 */
export function mergePropertyTypes(inUse: readonly string[]): string[] {
  const extra = [...new Set(inUse.filter((t) => t && !isPropertyType(t)))];
  return [...PROPERTY_TYPES, ...extra.sort()];
}

/** CFF group 10. */
export const FACINGS = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
] as const;

/**
 * CFF group 11, trimmed by the client (Sep 2026): Soft Launch, the 6-month
 * and 1-year possession bands, and Other were dropped.
 */
export const POSSESSION_STATUSES = [
  "Ready to Move",
  "Under Construction",
  "New Launch",
] as const;

/** CFF group 9, level. */
export const FURNISHINGS = [
  "Unfurnished",
  "Semi Furnished",
  "Fully Furnished",
  "Luxury Furnished",
] as const;

/**
 * CFF group 9, inventory. Presence only — the client did not ask for counts
 * ("AC x3"); CONFIRM before adding quantity, which would turn this text[]
 * into a jsonb of {item, count}.
 */
export const FURNISHING_ITEMS = [
  "AC",
  "Beds",
  "Sofa",
  "Dining Table",
  "Wardrobes",
  "Refrigerator",
  "Washing Machine",
  "Chimney",
  "RO",
  "Microwave",
  "Curtains",
  "TV",
  "Geyser",
  "Mixer",
  "Other",
] as const;

/**
 * CFF group 7. Replaces the old free-text configuration field.
 *
 * Project-kind listings advertise a RANGE ("2–4 BHK"), which no single
 * entry here can express — those use `properties.configurations` (text[])
 * instead, drawn from this same list. Units use the singular column.
 */
export const CONFIGURATIONS = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "5 BHK",
  "2+1",
  "3+1",
  "4+1",
  "3+2",
  "Duplex",
  "Triplex",
  "Studio",
] as const;

export type Configuration = (typeof CONFIGURATIONS)[number];

export function isConfiguration(value: string): value is Configuration {
  return (CONFIGURATIONS as readonly string[]).includes(value);
}
