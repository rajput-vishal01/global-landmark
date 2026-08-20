/**
 * Feature checklists — amenities, parking, PLC, legal, documentation, loan.
 *
 * All of these are stored as `text[]` validated against the lists below.
 * Values outside a list are dropped on write, except where a list is marked
 * free-add (amenities, banks) where the admin's own text is kept.
 */

/**
 * CFF group 15, all 31 entries.
 *
 * The pre-CFF list combined "Security / CCTV" into one entry and carried a
 * few items the CFF splits out elsewhere — "Park Facing" and "Corner" are
 * PLC attributes, "Covered Parking" is a parking type. Existing listings
 * keep those strings (amenities are free-add, so nothing is lost); moving
 * them to their proper field is an admin tidy-up, not a migration.
 */
export const AMENITIES = [
  "Club House",
  "Swimming Pool",
  "Gym",
  "Lift",
  "Power Backup",
  "Security",
  "CCTV",
  "Gated Community",
  "Children's Play Area",
  "Park",
  "Jogging Track",
  "Sports Facilities",
  "Community Hall",
  "EV Charging",
  "Smart Home",
  "Wi-Fi",
  "Visitor Parking",
  "Theatre",
  "Sauna",
  "Steam",
  "Pickleball Court",
  "Tennis",
  "Cricket",
  "Squash",
  "Badminton",
  "Basketball",
  "Salon",
  "Day Care (Kids)",
  "Pet Play Area",
  "Intercom",
  "Other",
] as const;

/**
 * Grouped for the public detail page so 31 checkboxes don't render as one
 * undifferentiated wall. Every AMENITIES entry appears in exactly one group
 * — asserted in scripts/check-taxonomy.mjs.
 */
export const AMENITY_GROUPS: { label: string; items: readonly string[] }[] = [
  {
    label: "Recreation",
    items: ["Club House", "Swimming Pool", "Theatre", "Sauna", "Steam", "Salon", "Community Hall"],
  },
  {
    label: "Sport",
    items: [
      "Gym",
      "Jogging Track",
      "Sports Facilities",
      "Pickleball Court",
      "Tennis",
      "Cricket",
      "Squash",
      "Badminton",
      "Basketball",
    ],
  },
  {
    label: "Safety",
    items: ["Security", "CCTV", "Gated Community", "Intercom", "Power Backup"],
  },
  {
    label: "Convenience",
    items: [
      "Lift",
      "Visitor Parking",
      "EV Charging",
      "Smart Home",
      "Wi-Fi",
      "Park",
      "Children's Play Area",
      "Day Care (Kids)",
      "Pet Play Area",
      "Other",
    ],
  },
];

/** CFF group 16. Slot count is a separate integer column. */
export const PARKING_TYPES = [
  "Covered Parking",
  "Open Parking",
  "Basement Parking",
  "Stilt Parking",
  "Two-Wheeler Parking",
  "Visitor Parking",
] as const;

/**
 * CFF group 5, the preferential-location-charge attributes. These are what
 * a buyer pays a premium for, so they are public and appear on the card.
 */
export const PLC_ATTRIBUTES = [
  "Park Facing",
  "Corner Property",
  "Green Belt Facing",
  "Main Road Facing",
  "Highway Facing",
  "Lake View",
  "Hill View",
  "Golf Course Facing",
  "Garden Facing",
  "Floor PLC",
] as const;

/**
 * CFF group 14. Public — RERA registration is expected in Indian property
 * advertising and the rest are trust signals.
 */
export const LEGAL_FLAGS = [
  "RERA Registered",
  "CLU Approved",
  "Registry Available",
  "Freehold",
] as const;

/**
 * Also CFF group 14, but internal only: whether a property is mortgaged is
 * a negotiating position, not a selling point. Kept out of LEGAL_FLAGS so
 * it can never be rendered by the public legal strip by accident.
 */
export const INTERNAL_LEGAL_FLAGS = ["Mortgaged"] as const;

/**
 * CFF group 17. Internal by default — CONFIRM whether a trimmed public
 * version ("Registry available", "OC received") should render as a trust
 * signal, which is why this is one list with a public subset rather than
 * two lists that could drift.
 */
export const DOCUMENTATION_FLAGS = [
  "Registry Available",
  "Mutation Complete",
  "Sale Deed Available",
  "Occupancy Certificate",
  "Completion Certificate",
  "Approved Layout Plan",
  "Electricity Connection",
  "Water Connection",
  "Property Tax Paid",
  "NOC Available",
  "13 Sala",
  "Bharmukt",
  "GPA (if required)",
  "Naksha",
  "LOI/EOI",
  "Other",
] as const;

/** CFF group 13. Banks on panel are free-add text[]; the note is internal. */
export const LOAN_FLAGS = ["Home Loan Available", "Bank Approved", "Other"] as const;
