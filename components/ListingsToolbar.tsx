import Link from "next/link";
import {
  PROPERTY_SORTS,
  PROPERTY_VIEWS,
  propertiesHref,
  sortParam,
  viewParam,
  type PropertiesFilterParams,
  type PropertySort,
  type PropertyView,
} from "@/lib/properties-url";

/**
 * Sort + list/grid toggle for /properties (Phase D).
 *
 * Server-rendered links, exactly like ConfigTabs and Pagination: the URL is
 * the state, so a sorted list view is shareable, survives the back button,
 * and composes with every filter already in `current` without a line of
 * client JS. Both controls reset `page` — page 3 of a price-ascending list
 * is a different set of rows than page 3 of a newest-first one.
 */

const VIEW_ICONS: Record<PropertyView, React.ReactNode> = {
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
  list: <path d="M3 5h4v4H3zM3 15h4v4H3zM11 7h10M11 17h10" />,
};

export function ListingsToolbar({
  sort,
  view,
  current,
  summary,
}: {
  sort: PropertySort;
  view: PropertyView;
  current: PropertiesFilterParams;
  /** "Showing 1-12 of 40", set on the left of the bar. */
  summary?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-border pb-5">
      {/* An h2, styled as body text: the listing cards' h3 titles sit under
          it. Without it the page went straight from its h1 to the cards. */}
      <h2 className="font-sans text-body text-ink">
        {summary ?? " "}
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        {/* Sort as one segmented group: four options read at a glance, and
            the active one is filled rather than merely underlined. */}
        <nav aria-label="Sort listings" className="flex items-center gap-2">
          <span className="text-eyebrow hidden font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted sm:inline">
            Sort
          </span>
          <div className="flex overflow-x-auto border border-border bg-white p-1 no-scrollbar">
            {PROPERTY_SORTS.map((option) => {
              const isActive = option.value === sort;
              return (
                <Link
                  key={option.value}
                  href={propertiesHref(
                    current,
                    { sort: sortParam(option.value), page: undefined },
                    "listings"
                  )}
                  aria-current={isActive ? "true" : undefined}
                  className={`text-eyebrow whitespace-nowrap px-3 py-1.5 font-sans font-semibold uppercase tracking-[0.12em] transition-colors duration-300 ${
                    isActive ? "bg-navy text-cream" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <nav aria-label="Layout" className="flex border border-border bg-white p-1">
          {PROPERTY_VIEWS.map((option) => {
            const isActive = option.value === view;
            return (
              <Link
                key={option.value}
                href={propertiesHref(
                  current,
                  { view: viewParam(option.value), page: undefined },
                  "listings"
                )}
                aria-current={isActive ? "true" : undefined}
                aria-label={`${option.label} view`}
                className={`flex h-8 w-9 items-center justify-center transition-colors ${
                  isActive ? "bg-navy text-cream" : "text-ink-muted hover:text-ink"
                }`}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  {VIEW_ICONS[option.value]}
                </svg>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
