"use client";

import Link from "next/link";
import { PUBLICATION_STATES } from "@/lib/taxonomy/status";
import { mergePropertyTypes } from "@/lib/taxonomy/property";
import { CITY_NAMES } from "@/lib/locations";
import { Select } from "@/components/ui/Select";
import { Card, deskField, deskLinkButton } from "@/components/admin/desk";
import { useAutoSubmit } from "@/components/admin/use-auto-submit";

/**
 * Admin search + filter bar (R-34). Sibling of the public
 * `components/PropertiesFilters.tsx`, deliberately a separate file: the
 * public one is a client component that pushes routes on every change, this
 * one is a plain `<form method="get">` with a submit.
 *
 * URL as state, and nothing else. It survives a refresh and the back button,
 * a filtered view is a link a broker can send to a colleague, and there is no
 * client state to desync from the rows the server actually rendered.
 *
 * `page` is deliberately NOT a field here. Submitting drops it from the query
 * string, so changing a filter always lands on page 1 rather than page 4 of a
 * result set that no longer has four pages.
 */

export type PropertyFilterValues = {
  q: string;
  publication: string;
  type: string;
  city: string;
  sort: string;
};

/**
 * `min-h-11` is 44px on a phone — the tap target the panel is held to, because
 * it is used one-handed at a site visit. It drops away from `sm` so the bar
 * sits at desk density on a laptop like every other field in the panel.
 */
const CONTROL = `${deskField} w-full min-h-11 sm:min-h-0`;

/**
 * One filter, its label, and the "any" row at the top of its list.
 *
 * `Select` rather than a native `<select>`: the OS draws a native dropdown's
 * list itself and no stylesheet reaches it, so it arrived in system chrome
 * next to every other desk control. Same `name`, same option `value`s,
 * submitted through the hidden input Select owns — the query string is
 * unchanged. Its own chrome is left alone, the way every other admin form
 * uses it.
 *
 * The label is a real `<label htmlFor>`: `Select` renders a `<button
 * role="combobox">`, which is a labelable element, so the association holds
 * and the control still announces its own name.
 */
function FilterSelect({
  name,
  label,
  anyLabel,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  anyLabel: string;
  options: readonly string[] | { value: string; label: string }[];
  value: string;
  onChange: () => void;
}) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  // Same shape the native <select> had: the "any" row first, and omitted
  // entirely where there is no "any" (sort always has a value).
  const withAny = anyLabel ? [{ value: "", label: anyLabel }, ...items] : items;
  const id = `filter-${name}`;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="desk-eyebrow">
        {label}
      </label>
      <Select id={id} name={name} options={withAny} defaultValue={value} onValueChange={onChange} />
    </div>
  );
}

export function PropertyFilters({
  values,
  sortOptions,
  isFiltered,
  types = [],
}: {
  values: PropertyFilterValues;
  sortOptions: { value: string; label: string }[];
  isFiltered: boolean;
  /** Types stored on any listing, drafts included, so a custom one is filterable. */
  types?: string[];
}) {
  const { formRef, submitNow, submitSoon } = useAutoSubmit();

  return (
    <Card>
      <form ref={formRef} method="get" action="/admin/properties" className="flex flex-col gap-3">
        <div className="flex flex-col">
          <label htmlFor="filter-q" className="desk-eyebrow">
            Search
          </label>
          <input
            id="filter-q"
            type="search"
            name="q"
            defaultValue={values.q}
            placeholder="Ref code, title, locality or project"
            className={CONTROL}
            onChange={submitSoon}
          />
        </div>

        {/* One column at 360px, two from 640px, four from 1024px. */}
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            name="publication"
            label="Publication"
            anyLabel="Any state"
            options={PUBLICATION_STATES.map((s) => ({
              value: s,
              label: s[0].toUpperCase() + s.slice(1),
            }))}
            value={values.publication}
            onChange={submitNow}
          />
          <FilterSelect
            name="type"
            label="Property type"
            anyLabel="Any type"
            options={mergePropertyTypes(types)}
            value={values.type}
            onChange={submitNow}
          />
          <FilterSelect
            name="city"
            label="City"
            anyLabel="Any city"
            options={CITY_NAMES}
            value={values.city}
            onChange={submitNow}
          />
          <FilterSelect
            name="sort"
            label="Sort"
            anyLabel=""
            options={sortOptions}
            value={values.sort}
            onChange={submitNow}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* No Apply button: the form submits itself on every change. This
              stays so Enter in the search box still submits, and so the
              filters work before the JavaScript loads. */}
          <button type="submit" className="sr-only">
            Apply filters
          </button>
          {isFiltered && (
            <Link href="/admin/properties" className={deskLinkButton}>
              Clear filters
            </Link>
          )}
        </div>
      </form>
    </Card>
  );
}
