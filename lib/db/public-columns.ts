import type { AdminProperty, Project, Builder, PropertyImage, PropertyMedium, Tower } from "./schema";

/**
 * THE PUBLIC PROJECTION — the single place that decides what a visitor may see.
 *
 * Drizzle's `db.query.x.findMany()` returns EVERY column by default, and a
 * nested `with: { project: true }` returns every column of the joined row
 * too. Once internal data lives on these tables that default is a leak, so
 * every public query spreads these allowlists — including inside `with:`.
 *
 * Types are derived FROM the allowlists rather than written alongside them
 * (`Pick<AdminProperty, keyof typeof PUBLIC_PROPERTY_COLUMNS>`), so the
 * shape a query returns and the type a component accepts cannot drift apart.
 * Adding a column to the allowlist widens the type automatically; forgetting
 * to add one makes the component fail to compile rather than render nothing.
 *
 * Deliberately absent from PUBLIC_PROPERTY_COLUMNS, and why:
 *   refCode, listingStatus, publicationState, addedBy, sourceName, listedAt
 *     — the client said these are internal (R-07)
 *   unitNumber           — CONFIRM; treated as internal until they answer
 *   demandPrice, perSqftRate, isNegotiable
 *     — price is resolved through `publicPrice()` below, never raw
 *   latitude, longitude, showMapPublicly
 *     — the old map pin, no longer read anywhere. The admin now pastes a
 *       Google Maps link (mapsUrl, below), and pasting it IS the decision
 *       to publish it, so it needs no gate. Never add the raw coordinates
 *       here: rows that never published a pin still hold them.
 *   documentationFlags   — internal by default (R-24)
 *   banksOnPanel/loanFlags are public; the circle-rate comparison is not,
 *     and lives on property_internal, a table no public query imports.
 */

export const PUBLIC_PROPERTY_COLUMNS = {
  id: true,
  slug: true,
  title: true,
  kind: true,
  category: true,
  description: true,
  projectId: true,
  towerId: true,

  location: true,
  country: true,
  city: true,
  locality: true,
  sector: true,
  block: true,
  society: true,
  floorNumber: true,
  totalFloors: true,
  mapsUrl: true,

  propertyType: true,
  dealAttributes: true,
  configuration: true,
  configurations: true,
  beds: true,
  baths: true,
  balconies: true,
  roomFlags: true,
  facing: true,
  possessionStatus: true,
  propertyAge: true,

  areaValue: true,
  areaUnit: true,
  plotArea: true,
  plotAreaUnit: true,
  builtUpArea: true,
  builtUpAreaUnit: true,
  superArea: true,
  superAreaUnit: true,
  carpetArea: true,
  carpetAreaUnit: true,
  areaSqft: true,
  frontFeet: true,
  depthFeet: true,
  plcAttributes: true,

  roadWidth: true,
  entranceWidth: true,
  ceilingHeight: true,
  isCorner: true,
  isParkFacing: true,

  furnishing: true,
  furnishingInventory: true,
  amenities: true,
  parkingTypes: true,
  parkingSlots: true,

  legalFlags: true,
  reraNumber: true,
  loanFlags: true,
  banksOnPanel: true,

  // NOTE: demandPrice is deliberately absent. Selecting it and gating at
  // render time does not work — the value still lands in the RSC payload
  // for every listing, published price or not, and the leak check caught
  // exactly that. The price is resolved in SQL instead; see PUBLIC_PRICE_EXTRA
  // in lib/db/queries.ts, which returns null unless showPricePublicly is set.
  extras: true,
  updatedAt: true,
} as const;

/** Builder contact details are internal; the name and profile are not. */
export const PUBLIC_BUILDER_COLUMNS = {
  id: true,
  name: true,
  slug: true,
  belongsTo: true,
  about: true,
  website: true,
  logoUrl: true,
} as const;

/** priceAppreciation is a projection we do not publish. */
export const PUBLIC_PROJECT_COLUMNS = {
  id: true,
  name: true,
  slug: true,
  description: true,
  builderName: true,
  builderId: true,
  reraNumber: true,
  possessionStatus: true,
  launchDate: true,
  possessionDate: true,
  totalTowers: true,
  totalUnits: true,
  numberOfFloors: true,
  greenAreaValue: true,
  greenAreaUnit: true,
  amenities: true,
  country: true,
  city: true,
  locality: true,
  sector: true,
  coverImage: true,
} as const;

export const PUBLIC_TOWER_COLUMNS = {
  id: true,
  projectId: true,
  name: true,
  totalFloors: true,
  unitsPerFloor: true,
  totalUnits: true,
} as const;

/** storageKey is our delete handle, of no use to a visitor. */
export const PUBLIC_IMAGE_COLUMNS = {
  id: true,
  url: true,
  alt: true,
  mediaKind: true,
  sortOrder: true,
} as const;

export const PUBLIC_MEDIA_COLUMNS = {
  id: true,
  kind: true,
  url: true,
  label: true,
  sortOrder: true,
} as const;

/**
 * The public price, resolved server-side: null whenever the listing is not
 * flagged for public pricing, so "Price on request" is what renders and the
 * real figure never leaves the database.
 */
export type PublicPriced = { publicPrice: number | null };

export type PublicProperty = Pick<AdminProperty, keyof typeof PUBLIC_PROPERTY_COLUMNS> &
  PublicPriced;
export type PublicProject = Pick<Project, keyof typeof PUBLIC_PROJECT_COLUMNS>;
export type PublicBuilder = Pick<Builder, keyof typeof PUBLIC_BUILDER_COLUMNS>;
export type PublicTower = Pick<Tower, keyof typeof PUBLIC_TOWER_COLUMNS>;
export type PublicImage = Pick<PropertyImage, keyof typeof PUBLIC_IMAGE_COLUMNS>;
export type PublicMedium = Pick<PropertyMedium, keyof typeof PUBLIC_MEDIA_COLUMNS>;

/** What every public listing surface receives. */
export type PublicPropertyWithMedia = PublicProperty & {
  images: PublicImage[];
  project: PublicProject | null;
};

