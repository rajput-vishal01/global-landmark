/**
 * /properties query-string builder — the one place that knows how to merge
 * an override into the current filter set. Every filter link on the page
 * (category chips, collection cards, configuration tabs) goes through this
 * so a click never silently drops a filter the user already had active.
 *
 * Client components (PropertiesFilters, CityTabs) don't need this — they
 * read `useSearchParams()` live and already preserve everything by cloning
 * it before changing one key. This is for the server-rendered links, which
 * have no live searchParams to clone.
 */

export type PropertiesFilterParams = Partial<
  Record<
    | "category"
    | "group"
    | "type"
    | "possession"
    | "furnishing"
    | "city"
    | "locality"
    | "sector"
    | "configuration"
    | "q"
    | "sort"
    | "view"
    | "page",
    string | undefined
  >
>;

/**
 * Sort and view are URL state like every filter above, so a sorted list view
 * is shareable and survives the back button. Both vocabularies live here
 * rather than in lib/taxonomy/* — they describe how the listing page is
 * presented, not anything about a property.
 *
 * The default of each is left OUT of the URL (see `sortParam`/`viewParam`):
 * `/properties` and `/properties?sort=newest&view=grid` are the same page,
 * and only one of them should be linkable.
 */
export const PROPERTY_SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export type PropertySort = (typeof PROPERTY_SORTS)[number]["value"];

export const DEFAULT_SORT: PropertySort = "newest";

export function isPropertySort(value: string): value is PropertySort {
  return PROPERTY_SORTS.some((s) => s.value === value);
}

export const PROPERTY_VIEWS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
] as const;

export type PropertyView = (typeof PROPERTY_VIEWS)[number]["value"];

export const DEFAULT_VIEW: PropertyView = "grid";

export function isPropertyView(value: string): value is PropertyView {
  return PROPERTY_VIEWS.some((v) => v.value === value);
}

/** Serialises a sort/view choice, dropping the default so it never lands in the URL. */
export const sortParam = (sort: PropertySort) =>
  sort === DEFAULT_SORT ? undefined : sort;

export const viewParam = (view: PropertyView) =>
  view === DEFAULT_VIEW ? undefined : view;

/** Merges `overrides` onto `current`, drops empties, builds the href. */
export function propertiesHref(
  current: PropertiesFilterParams,
  overrides: PropertiesFilterParams,
  hash?: string
): string {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const query = params.size ? `?${params}` : "";
  return `/properties${query}${hash ? `#${hash}` : ""}`;
}
