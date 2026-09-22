import { PROPERTY_TYPES, type PropertyType } from "./property";

/**
 * The CFF's own twenty field groups, and the one lookup that decides which
 * of them a given property type actually asks for (R-12).
 *
 * There is exactly ONE place a property type is looked up — `PROPERTY_SHAPE`
 * — which is what the requirement asks for. It maps to shapes rather than
 * per-type section lists, because the shapes are what the client's rules
 * are actually about: a plot has no rooms, a tower unit has a floor and a
 * unit number.
 *
 * Adding a property type without giving it a shape fails
 * scripts/check-taxonomy.mjs rather than silently showing every section.
 */

export const SECTIONS = [
  { key: "basic", cff: 1, label: "Basic details" },
  { key: "type", cff: 2, label: "Property type" },
  { key: "location", cff: 3, label: "Location" },
  { key: "builder", cff: 4, label: "Builder details" },
  { key: "area", cff: 5, label: "Area" },
  { key: "price", cff: 6, label: "Price details" },
  { key: "configuration", cff: 7, label: "Configuration" },
  { key: "ownership", cff: 8, label: "Ownership" },
  { key: "furnishing", cff: 9, label: "Furnishing" },
  { key: "facing", cff: 10, label: "Facing" },
  { key: "possession", cff: 11, label: "Possession status" },
  { key: "age", cff: 12, label: "Property age" },
  { key: "loan", cff: 13, label: "Loan" },
  { key: "legal", cff: 14, label: "Legal" },
  { key: "amenities", cff: 15, label: "Amenities" },
  { key: "parking", cff: 16, label: "Parking" },
  { key: "documentation", cff: 17, label: "Documentation" },
  { key: "brokerage", cff: 18, label: "Brokerage" },
  { key: "media", cff: 19, label: "Photos & media" },
  { key: "specifications", cff: 20, label: "Property specifications" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

const ALL_SECTION_KEYS: SectionKey[] = SECTIONS.map((s) => s.key);

export type Shape = "plot" | "house" | "tower_unit";

/** Fields a shape must have before it may be published. */
export type FieldKey = "plotArea";

const PROPERTY_SHAPE: Record<PropertyType, Shape> = {
  // Land with no building on it — no rooms, no furnishing, no parking.
  "Residential Plot": "plot",

  // A whole building on its own footprint: rooms yes, unit number no.
  "Independent House": "house",
  Villa: "house",

  // One unit inside a tower — floor and unit number are what identify it.
  "Flat/Apartment": "tower_unit",
  Penthouse: "tower_unit",
};

/**
 * Sections omitted per shape, and the fields publishing requires.
 *
 * Stated as omissions rather than inclusions on purpose: a section added to
 * SECTIONS later shows up everywhere by default, which is the safe direction
 * to fail — a field a broker does not need is an annoyance, a field they
 * cannot reach is missing data.
 */
const SHAPE_RULES: Record<Shape, { omit: SectionKey[]; required: FieldKey[] }> = {
  plot: {
    // No rooms to configure, nothing to furnish, no allotted parking bay.
    omit: ["configuration", "furnishing", "parking"],
    required: ["plotArea"],
  },
  house: {
    // Stands on its own plot, so it has no unit number within a tower.
    omit: [],
    required: [],
  },
  tower_unit: {
    // Floor and unit number used to be required here; the client removed
    // both from the form (Sep 2026), so a flat publishes on its photos.
    omit: [],
    required: [],
  },
};

export function shapeOf(propertyType: string | null | undefined): Shape | null {
  if (!propertyType) return null;
  return PROPERTY_SHAPE[propertyType as PropertyType] ?? null;
}

/**
 * Which sections to render for a property type.
 *
 * An unknown or unset type returns EVERY section. Hiding a field because a
 * type was not recognised loses data silently; showing one too many does not.
 */
export function sectionsFor(propertyType: string | null | undefined): SectionKey[] {
  const shape = shapeOf(propertyType);
  if (!shape) return [...ALL_SECTION_KEYS];
  const omit = new Set<SectionKey>(SHAPE_RULES[shape].omit);
  return ALL_SECTION_KEYS.filter((key) => !omit.has(key));
}

/** Fields that must be filled before this type may leave draft. */
/**
 * Plain-English names for the publish-gate fields. Beside the rules so the
 * form markers, the helper panel and the server's error message all name a
 * field the same way — the server used to reply "listings need floorNumber,
 * unitNumber", which is a column name, not something a broker can find.
 */
export const FIELD_LABELS: Record<FieldKey, string> = {
  plotArea: "Plot area",
};

export function requiredFieldsFor(
  propertyType: string | null | undefined
): FieldKey[] {
  const shape = shapeOf(propertyType);
  if (!shape) return [];
  return [...SHAPE_RULES[shape].required];
}

/** Every type maps to a shape — asserted in scripts/check-taxonomy.mjs. */
export function unmappedPropertyTypes(): string[] {
  return PROPERTY_TYPES.filter((t) => !(t in PROPERTY_SHAPE));
}
