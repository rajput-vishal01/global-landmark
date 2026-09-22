/**
 * Physical property taxonomy — the CFF's own lists, verbatim.
 *
 * Every list here is the single source shared by the admin form, the server
 * action's validation and the public renderer. Adding an option needs no
 * migration: these values are stored as text, validated against the list on
 * write, and unknown values are dropped rather than saved.
 */

/**
 * CFF group 2. The client trimmed the CFF's 23 types to the five they deal
 * in (Sep 2026); builder floors, studios, farm houses, every commercial,
 * industrial and institutional type, and R-zone land were dropped. Listings
 * saved under a dropped type keep the stored text, but no filter or form
 * offers it any more.
 *
 * The CFF also lists "Lease", "Pre-Leased Property" and "Investment
 * Property" here, but those describe the deal, not the structure — a
 * pre-leased shop is still a Shop — so they are not types. "Lease" itself
 * is the existing `lease` category in lib/categories.ts.
 */
export const PROPERTY_TYPES = [
  "Residential Plot",
  "Independent House",
  "Villa",
  "Flat/Apartment",
  "Penthouse",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

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
