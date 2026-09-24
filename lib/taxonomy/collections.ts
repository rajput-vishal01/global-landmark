/**
 * The "cardholder" axis the client asked for (R-04): Kothi, Plot, Projects,
 * Flats, Commercial. Commercial came back in Sep 2026 with the commercial
 * property types, so a shop has somewhere to sort itself into.
 *
 * This is orthogonal to the sale/purchase/lease/invest intent axis in
 * lib/categories.ts — a listing has both. It is DERIVED from property type
 * (plus `kind` for Projects), never stored, so no column and no re-tagging
 * of existing listings: change the map and every listing re-sorts itself.
 */

import { PROPERTY_TYPES, type PropertyType } from "./property";

export const COLLECTIONS = [
  { value: "kothi", label: "Kothi", blurb: "Villas, kothis and independent houses" },
  { value: "plot", label: "Plot", blurb: "Plots and land across the Tricity" },
  { value: "projects", label: "Projects", blurb: "Societies and townships" },
  { value: "flats", label: "Flats", blurb: "Apartments, builder floors and penthouses" },
  { value: "commercial", label: "Commercial", blurb: "Shops, showrooms, SCOs and offices" },
] as const;

export type CollectionValue = (typeof COLLECTIONS)[number]["value"];

export function isCollection(value: string): value is CollectionValue {
  return COLLECTIONS.some((c) => c.value === value);
}

export function collectionLabel(value: CollectionValue): string {
  return COLLECTIONS.find((c) => c.value === value)?.label ?? value;
}

/**
 * Every physical type maps to exactly one collection — asserted in
 * scripts/check-taxonomy.mjs, so adding a type without placing it here
 * fails the check rather than silently vanishing from every collection page.
 * A type typed in by hand belongs to no collection, which is why collectionOf
 * falls back to null rather than guessing.
 */
const TYPE_TO_COLLECTION: Record<PropertyType, CollectionValue> = {
  "Independent House": "kothi",
  Villa: "kothi",

  "Residential Plot": "plot",
  "Commercial Plot": "plot",
  "Agricultural Land": "plot",

  "Flat/Apartment": "flats",
  Penthouse: "flats",
  "Builder Floor": "flats",
  "Studio / SOHO": "flats",

  Shop: "commercial",
  Showroom: "commercial",
  "SCO (Shop-cum-Office)": "commercial",
  "Office Space": "commercial",
  "Commercial Site": "commercial",
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
