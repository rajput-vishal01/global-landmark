/**
 * Property attribute taxonomy — the non-CRM subset of the client's field
 * wishlist. Every field is optional on a property; empty values simply
 * don't render.
 */

export const PROPERTY_TYPES = [
  "Flat/Apartment",
  "Builder Floor",
  "Independent House",
  "Villa",
  "Penthouse",
  "Studio Apartment",
  "Farm House",
  "Residential Plot",
  "Commercial Plot",
  "SCO",
  "Shop",
  "Office Space",
  "Showroom",
  "Warehouse",
] as const;

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

export const POSSESSION_STATUSES = [
  "Ready to Move",
  "Under Construction",
  "New Launch",
] as const;

export const FURNISHINGS = [
  "Unfurnished",
  "Semi Furnished",
  "Fully Furnished",
  "Luxury Furnished",
] as const;

export const AREA_UNITS = [
  { value: "sqft", label: "Sq Ft" },
  { value: "sqyd", label: "Sq Yd" },
  { value: "marla", label: "Marla" },
  { value: "kanal", label: "Kanal" },
  { value: "acre", label: "Acre" },
] as const;


function areaUnitLabel(unit: string): string {
  return AREA_UNITS.find((u) => u.value === unit)?.label ?? unit;
}

export function formatArea(value: number, unit: string): string {
  return `${value.toLocaleString("en-IN")} ${areaUnitLabel(unit)}`;
}

/** Offered as checkboxes in the admin; free-typed amenities are also kept. */
/** Prepends an empty "any/none" choice to a Select option list. */
export const withEmptyOption = (label: string, values: readonly string[]) => [
  { value: "", label },
  ...values.map((v) => ({ value: v, label: v })),
];

export const SUGGESTED_AMENITIES = [
  "Gated Community",
  "Lift",
  "Power Backup",
  "Covered Parking",
  "Visitor Parking",
  "Security / CCTV",
  "Club House",
  "Swimming Pool",
  "Gym",
  "Park Facing",
  "Corner",
  "Children's Play Area",
  "Jogging Track",
  "EV Charging",
  "Modular Kitchen",
  "Vastu Compliant",
  "Terrace / Roof Rights",
  "Servant Room",
  "Pooja Room",
  "Study Room",
] as const;
