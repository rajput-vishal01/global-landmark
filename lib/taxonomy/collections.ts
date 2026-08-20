/**
 * The "cardholder" axis the client asked for (R-04): Kothi, Plot, Projects,
 * Flats, Land, Commercial.
 *
 * This is orthogonal to the sale/purchase/lease/invest intent axis in
 * lib/categories.ts — a listing has both. It is DERIVED from property type
 * (plus `kind` for Projects), never stored, so no column and no re-tagging
 * of existing listings: change the map and every listing re-sorts itself.
 */

import { PROPERTY_TYPES, type PropertyType } from "./property";

export const COLLECTIONS = [
  { value: "kothi", label: "Kothi", blurb: "Villas, kothis and independent houses" },
  { value: "plot", label: "Plot", blurb: "Residential plots across the Tricity" },
  { value: "projects", label: "Projects", blurb: "Societies and townships" },
  { value: "flats", label: "Flats", blurb: "Apartments, builder floors and penthouses" },
  { value: "land", label: "Land", blurb: "Agricultural, industrial and R-zone land" },
  { value: "commercial", label: "Commercial", blurb: "Shops, offices, SCO and showrooms" },
] as const;

export type CollectionValue = (typeof COLLECTIONS)[number]["value"];

export function isCollection(value: string): value is CollectionValue {
  return COLLECTIONS.some((c) => c.value === value);
}

export function collectionLabel(value: CollectionValue): string {
  return COLLECTIONS.find((c) => c.value === value)?.label ?? value;
}

/**
 * Every one of the 23 physical types maps to exactly one collection —
 * asserted in scripts/check-taxonomy.mjs, so adding a type without placing
 * it here fails the check rather than silently vanishing from every
 * collection page.
 *
 * "Commercial Plot" sits under Commercial rather than Plot: the client's
 * "Plot" cardholder means residential plots, which is what a Tricity buyer
 * browsing Plots is looking for.
 */
const TYPE_TO_COLLECTION: Record<PropertyType, CollectionValue> = {
  "Independent House": "kothi",
  Villa: "kothi",
  "Farm House": "kothi",

  "Residential Plot": "plot",

  "Flat/Apartment": "flats",
  "Builder Floor": "flats",
  Penthouse: "flats",
  "Studio Apartment": "flats",

  "R Zone Land": "land",
  "Industrial Plot": "land",

  SCO: "commercial",
  Booth: "commercial",
  Shop: "commercial",
  "Office Space": "commercial",
  Showroom: "commercial",
  Warehouse: "commercial",
  "Industrial Shed": "commercial",
  "Commercial Plot": "commercial",
  Hotel: "commercial",
  Hospital: "commercial",
  "School Site": "commercial",
  "Institutional Plot": "commercial",
  "Mixed Use Property": "commercial",
};

/**
 * A whole society/township is a Project whatever its unit type — that is
 * the distinction the client draws, so `kind` wins over the type map.
 * Falls back to null (not a guess) when the type is unset or unknown, so
 * an untyped listing is simply absent from collection pages.
 */
export function collectionOf(
  propertyType: string | null | undefined,
  kind: string
): CollectionValue | null {
  if (kind === "project") return "projects";
  if (!propertyType) return null;
  return TYPE_TO_COLLECTION[propertyType as PropertyType] ?? null;
}

/** Property types belonging to a collection — used to filter server-side. */
export function typesInCollection(collection: CollectionValue): PropertyType[] {
  if (collection === "projects") return [];
  return PROPERTY_TYPES.filter((t) => TYPE_TO_COLLECTION[t] === collection);
}
