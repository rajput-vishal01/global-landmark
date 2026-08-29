import Link from "next/link";
import { LISTING_STATUSES, PUBLICATION_STATES } from "@/lib/taxonomy/status";
import { PROPERTY_TYPES } from "@/lib/attributes";
import { CITY_NAMES } from "@/lib/locations";
import { FIELD } from "@/components/form-classes";

/**
 * Admin search + filter bar (R-34). Sibling of the public
 * `components/PropertiesFilters.tsx`, deliberately a separate file: the
 * public one is a client component that pushes routes on every change, this
 * one is a plain `<form method="get">` with a submit.
 *
 * URL as state, and nothing else. It survives a refresh and the back button,
 * a filtered view is a link a broker can send to a colleague, and there is no
 * client state to desync from the rows the server actually rendered. That
 * also means it works with JS still loading — which is the realistic case on
 * a phone at a site visit, and this panel is used exactly there.
 *
 * `page` is deliberately NOT a field here. Submitting drops it from the query
 * string, so changing a filter always lands on page 1 rather than page 4 of a
 * result set that no longer has four pages.
 */

export type PropertyFilterValues = {
  q: string;
  status: string;
  publication: string;
  type: string;
  city: string;
  sort: string;
};

const LABEL_CLS =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted";

/**
 * `min-h-11` is 44px — the tap target the panel is held to, because it is
 * used one-handed on a phone at a site visit.
 */
const CONTROL = `${FIELD} min-h-11 sm:min-h-0 sm:py-1.5`;

/**
 * Native `<select>` — one option list, "any" first.
 *
 * `FIELD` carries `appearance-none`, which strips the OS dropdown arrow along
 * with the OS chrome it exists to remove, so the chevron is drawn back in.
 * It matches the one on the public `components/ui/Select.tsx` and is
 * `pointer-events-none` so clicks fall through to the select underneath.
 */
function FilterSelect({
  name,
  label,
  anyLabel,
  options,
  value,
}: {
  name: string;
  label: string;
  anyLabel: string;
  options: readonly string[] | { value: string; label: string }[];
  value: string;
}) {
  const items = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL_CLS}>{label}</span>
      <span className="relative block">
        <select name={name} defaultValue={value} className={`${CONTROL} pr-6`}>
          {anyLabel ? <option value="">{anyLabel}</option> : null}
          {items.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          width="11"
          height="7"
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink-muted"
        >
          <path d="M1 1.5l5 5 5-5" />
        </svg>
      </span>
    </label>
  );
}

export function PropertyFilters({
  values,
  sortOptions,
  isFiltered,
}: {
  values: PropertyFilterValues;
  sortOptions: { value: string; label: string }[];
  isFiltered: boolean;
}) {
  return (
    <form
      method="get"
      action="/admin/properties"
      className="flex flex-col gap-3 border border-border bg-white p-3 sm:p-4"
    >
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>Search</span>
        <input
          type="search"
          name="q"
          defaultValue={values.q}
          placeholder="Ref code, title, locality or project"
          className={CONTROL}
        />
      </label>

      {/* One column at 360px, two from 640px, three from 1024px. */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          name="status"
          label="Listing status"
          anyLabel="Any status"
          options={LISTING_STATUSES}
          value={values.status}
        />
        <FilterSelect
          name="publication"
          label="Publication"
          anyLabel="Any state"
          options={PUBLICATION_STATES.map((s) => ({
            value: s,
            label: s[0].toUpperCase() + s.slice(1),
          }))}
          value={values.publication}
        />
        <FilterSelect
          name="type"
          label="Property type"
          anyLabel="Any type"
          options={PROPERTY_TYPES}
          value={values.type}
        />
        <FilterSelect
          name="city"
          label="City"
          anyLabel="Any city"
          options={CITY_NAMES}
          value={values.city}
        />
        <FilterSelect
          name="sort"
          label="Sort"
          anyLabel=""
          options={sortOptions}
          value={values.sort}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          className="bg-ink px-6 py-3 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-cream transition-opacity hover:opacity-90"
        >
          Apply
        </button>
        {isFiltered && (
          <Link
            href="/admin/properties"
            className="text-meta font-sans text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-gold"
          >
            Clear filters
          </Link>
        )}
      </div>
    </form>
  );
}
