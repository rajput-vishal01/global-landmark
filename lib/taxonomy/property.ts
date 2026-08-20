/**
 * Physical property taxonomy — the CFF's own lists, verbatim.
 *
 * Every list here is the single source shared by the admin form, the server
 * action's validation and the public renderer. Adding an option needs no
 * migration: these values are stored as text, validated against the list on
 * write, and unknown values are dropped rather than saved.
 */

/**
 * CFF group 2. All 23 are BUILDING types.
 *
 * The CFF also lists "Lease", "Pre-Leased Property" and "Investment
 * Property" here, but those describe the deal, not the structure — a
 * pre-leased shop is still a Shop. They live in DEAL_ATTRIBUTES below and
 * combine with any physical type, so a listing can be a Shop that is both
 * Pre-Leased and an Investment Property. "Lease" itself is already the
 * existing `lease` category in lib/categories.ts.
 */
export const PROPERTY_TYPES = [
  "Residential Plot",
  "Independent House",
  "Villa",
  "Flat/Apartment",
  "Penthouse",
  "Builder Floor",
  "Studio Apartment",
  "Farm House",
  "SCO",
  "Booth",
  "Shop",
  "Office Space",
  "Showroom",
  "Warehouse",
  "Industrial Plot",
  "Industrial Shed",
  "Commercial Plot",
  "Hotel",
  "Hospital",
  "School Site",
  "Institutional Plot",
  "Mixed Use Property",
  "R Zone Land",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** Deal-shape flags that combine with any physical type (see note above). */
export const DEAL_ATTRIBUTES = ["Pre-Leased Property", "Investment Property"] as const;

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
 * CFF group 11. "New Launch" is not in the CFF list but three live listings
 * already use it, so dropping it would silently blank their possession —
 * kept until the client says otherwise.
 */
export const POSSESSION_STATUSES = [
  "Ready to Move",
  "Under Construction",
  "New Launch",
  "Soft Launch",
  "Possession in 6 Months",
  "Possession in 1 Year",
  "Other",
] as const;

/**
 * CFF group 12.
 * ponytail: stored as a band, as the client wrote it. A construction year
 * would age correctly on its own instead of going stale — CONFIRM before
 * a large import makes the band hard to revisit.
 */
export const PROPERTY_AGES = [
  "New",
  "Less than 1 Year",
  "1–5 Years",
  "5–10 Years",
  "More than 10 Years",
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

/** CFF group 7, the room checklist beyond the BHK label. */
export const ROOM_FLAGS = [
  "Servant Room",
  "Study Room",
  "Store Room",
  "Pooja Room",
  "Terrace",
  "Roof Rights",
] as const;

/**
 * What selecting a configuration tab pre-fills (R-09). Every value stays
 * hand-editable afterwards — this is a starting point, not a constraint.
 * "+1" means a servant room on top of the bedroom count, the local
 * convention; a 3+1 is a 3-bedroom with servant quarters, not 4 bedrooms.
 */
export const CONFIGURATION_TEMPLATES: Record<
  Configuration,
  { beds: number | null; baths: number | null; balconies: number | null; rooms: string[] }
> = {
  "1 BHK": { beds: 1, baths: 1, balconies: 1, rooms: [] },
  "2 BHK": { beds: 2, baths: 2, balconies: 1, rooms: [] },
  "3 BHK": { beds: 3, baths: 3, balconies: 2, rooms: [] },
  "4 BHK": { beds: 4, baths: 4, balconies: 2, rooms: [] },
  "5 BHK": { beds: 5, baths: 5, balconies: 3, rooms: [] },
  "2+1": { beds: 2, baths: 2, balconies: 1, rooms: ["Servant Room"] },
  "3+1": { beds: 3, baths: 3, balconies: 2, rooms: ["Servant Room"] },
  "4+1": { beds: 4, baths: 4, balconies: 2, rooms: ["Servant Room"] },
  "3+2": { beds: 3, baths: 3, balconies: 2, rooms: ["Servant Room", "Study Room"] },
  Duplex: { beds: 3, baths: 3, balconies: 2, rooms: ["Terrace"] },
  Triplex: { beds: 4, baths: 4, balconies: 3, rooms: ["Terrace", "Roof Rights"] },
  Studio: { beds: 1, baths: 1, balconies: 0, rooms: [] },
};

export function isConfiguration(value: string): value is Configuration {
  return (CONFIGURATIONS as readonly string[]).includes(value);
}
