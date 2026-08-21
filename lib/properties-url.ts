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
    | "page",
    string | undefined
  >
>;

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
