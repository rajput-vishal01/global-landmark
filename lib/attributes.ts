/**
 * Property attribute taxonomy — barrel.
 *
 * The real lists live in lib/taxonomy/* (they outgrew one file once the CFF
 * field form landed). This file stays as the import surface every existing
 * component already uses, so splitting the lists cost no call-site churn.
 * New code may import from lib/taxonomy/* directly.
 */

export {
  AREA_UNITS,
  AREA_MEASURES,
  formatArea,
  toSqft,
  isAreaUnit,
  type AreaUnit,
  type AreaMeasureKey,
} from "./taxonomy/area";

export {
  PROPERTY_TYPES,
  DEAL_ATTRIBUTES,
  FACINGS,
  POSSESSION_STATUSES,
  PROPERTY_AGES,
  FURNISHINGS,
  FURNISHING_ITEMS,
  CONFIGURATIONS,
  CONFIGURATION_TEMPLATES,
  ROOM_FLAGS,
  isConfiguration,
  type PropertyType,
  type Configuration,
} from "./taxonomy/property";

export {
  AMENITIES,
  AMENITY_GROUPS,
  PARKING_TYPES,
  PLC_ATTRIBUTES,
  LEGAL_FLAGS,
  INTERNAL_LEGAL_FLAGS,
  DOCUMENTATION_FLAGS,
  LOAN_FLAGS,
} from "./taxonomy/features";

export {
  CHARGE_TYPES,
  CHARGE_BASES,
  isChargeBasis,
  formatRupees,
  formatIndianShort,
  allInPrice,
  priceBand,
  PRICE_BANDS,
  type Charge,
  type ChargeType,
  type ChargeBasis,
  type PriceBand,
} from "./taxonomy/price";

export {
  LISTING_STATUSES,  PUBLIC_STATUSES,
  PUBLICATION_STATES,
  ADDED_BY,
  SELLER_CATEGORIES,
  OWNER_TYPES,
  isPubliclyVisible,
  refCode,
  cityCode,
  daysOnMarket,
  type ListingStatus,
  type PublicationState,
} from "./taxonomy/status";

export {
  COLLECTIONS,
  collectionOf,
  collectionLabel,
  isCollection,
  typesInCollection,
  type CollectionValue,
} from "./taxonomy/collections";

/**
 * Amenity checkboxes in the admin. Kept as the old export name because the
 * form imports it; free-typed amenities are still preserved alongside.
 */
export { AMENITIES as SUGGESTED_AMENITIES } from "./taxonomy/features";

/** Prepends an empty "any/none" choice to a Select option list. */
export const withEmptyOption = (label: string, values: readonly string[]) => [
  { value: "", label },
  ...values.map((v) => ({ value: v, label: v })),
];
