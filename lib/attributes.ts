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
  headlineArea,
  toSqft,
  type AreaMeasureKey,
} from "./taxonomy/area";

export {
  PROPERTY_TYPES,
  POSSESSION_STATUSES,
  FURNISHINGS,
  FURNISHING_ITEMS,
  CONFIGURATIONS,
} from "./taxonomy/property";

export {
  AMENITIES,
  AMENITY_GROUPS,
  PARKING_TYPES,
  PLC_ATTRIBUTES,
  LEGAL_FLAGS,
  DOCUMENTATION_FLAGS,
  LOAN_FLAGS,
} from "./taxonomy/features";

export { formatRupees, formatIndianShort } from "./taxonomy/price";

export {
  PUBLICATION_STATES,
  ADDED_BY,
  SELLER_CATEGORIES,
  OWNER_TYPES,
  refCode,
  type ListingStatus,
} from "./taxonomy/status";

export {
  COLLECTIONS,
  collectionOf,
  collectionLabel,
  isCollection,
  typesInCollection,
  type CollectionValue,
} from "./taxonomy/collections";

/** Prepends an empty "any/none" choice to a Select option list. */
export const withEmptyOption = (label: string, values: readonly string[]) => [
  { value: "", label },
  ...values.map((v) => ({ value: v, label: v })),
];
