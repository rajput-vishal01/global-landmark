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
  /**
   * Draw the bottom hairline. Off when the toolbar sits directly under
   * the filter panel, whose own border would otherwise double with it.
   */
  rule = true,
}: {
  sort: PropertySort;
  view: PropertyView;
  current: PropertiesFilterParams;
  rule?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-10 gap-y-5 ${
        rule ? "mb-10 border-b border-border pb-5" : "mb-6"
      }`}
    >
      <nav aria-label="Sort listings" className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
          Sort
        </span>
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
              className={`text-eyebrow relative pb-1 font-sans font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
                isActive ? "text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {option.label}
              <span
                aria-hidden
                className={`absolute bottom-0 left-0 h-px w-full origin-left bg-gold transition-transform duration-500 ease-out ${
                  isActive ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Layout" className="flex items-center gap-2">
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
              className={`text-eyebrow flex items-center gap-2 border px-3 py-1.5 font-sans font-medium uppercase tracking-[0.15em] transition-colors ${
                isActive
                  ? "border-ink bg-ink text-cream"
                  : "border-border text-ink-muted hover:border-gold hover:text-ink"
              }`}
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                {VIEW_ICONS[option.value]}
              </svg>
              {option.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
