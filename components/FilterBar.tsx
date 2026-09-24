"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { BOXED_SELECT } from "@/components/form-classes";
import {
  COLLECTIONS,
  CONFIGURATIONS,
  withEmptyOption as withAll,
} from "@/lib/attributes";
import { mergePropertyTypes } from "@/lib/taxonomy/property";
import { CATEGORIES } from "@/lib/categories";
import type { PropertiesFilterParams } from "@/lib/properties-url";

const LABEL =
  "text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted";

/**
 * The listings search console (redesigned Sep 2026).
 *
 * One white card, lifted over the page header's edge:
 *   row 1 — keyword search;
 *   row 2 — city, type, configuration and collection;
 *   row 3 — every applied filter as a removable chip.
 *
 * The client cut it to these (Sep 2026): the category switch (sale /
 * purchase / lease / invest) and the possession, furnishing, locality and
 * sector filters are gone from the page. The URL still accepts them, so an
 * old link keeps working, and one arriving that way shows as a chip that
 * can be removed.
 *
 * Every control writes to the URL and clears `page` — narrowing the set
 * while sitting on page 3 would otherwise land the visitor on an empty grid.
 */
export function FilterBar({
  current,
  cityCounts,
  types = [],
}: {
  current: PropertiesFilterParams;
  cityCounts: { city: string; count: number }[];
  /** Types stored on live listings, so a custom one filters like a built-in. */
  types?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = current.city ?? "";
  // Phones only: the dropdowns fold behind one button so the first listing
  // is not four screens down. From lg they are always shown.
  const narrowing = [current.city, current.type, current.configuration, current.group].filter(
    Boolean
  ).length;
  const [showFilters, setShowFilters] = useState(false);

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/properties${params.size ? `?${params}` : ""}#listings`, {
      scroll: false,
    });
  }

  // Only the narrowing filters — sort and view are presentation, and a chip
  // offering to "clear" the sort order would be nonsense.
  const chips = (
    [
      ["category", current.category, CATEGORIES.find((c) => c.value === current.category)?.label],
      ["group", current.group, COLLECTIONS.find((c) => c.value === current.group)?.label],
      ["type", current.type, current.type],
      ["configuration", current.configuration, current.configuration],
      ["city", current.city, current.city],
      ["locality", current.locality, current.locality],
      ["sector", current.sector, current.sector],
      ["possession", current.possession, current.possession],
      ["furnishing", current.furnishing, current.furnishing],
      ["q", current.q, current.q ? `“${current.q}”` : undefined],
    ] as [string, string | undefined, string | undefined][]
  ).filter((chip): chip is [string, string, string] => Boolean(chip[1] && chip[2]));

  return (
    <div className="border border-border bg-white shadow-[0_30px_60px_-36px_rgba(40,30,15,0.5)]">
      {/* Row 1: what, and which kind of deal. */}
      <div className="flex flex-col gap-4 border-b border-border p-4 md:p-5 lg:flex-row lg:items-center">
        {/* action/GET is the before-hydration path: the browser submits
            ?q= to this same page natively. Once hydrated, onSubmit takes over
            so the other filters in the URL are kept. */}
        <form
          role="search"
          action="/properties"
          method="get"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            apply({ q: String(value ?? "").trim().slice(0, 100) });
          }}
          className="flex flex-1 items-stretch border border-border transition-colors focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20"
        >
          <label htmlFor="listings-q" className="sr-only">
            Search listings
          </label>
          <span aria-hidden className="flex items-center pl-4 text-ink-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            // Keyed on the applied term so clearing its chip empties the box.
            key={current.q ?? ""}
            id="listings-q"
            name="q"
            type="search"
            defaultValue={current.q ?? ""}
            placeholder="Search by project, sector or locality"
            className="min-w-0 flex-1 bg-transparent px-3 py-3 font-sans text-body text-ink placeholder:text-ink-muted/70 focus:outline-none"
          />
          <button
            type="submit"
            className="text-eyebrow cursor-pointer bg-cta px-6 font-sans font-bold uppercase tracking-[0.16em] text-cta-ink transition-colors hover:bg-cta-hover"
          >
            Search
          </button>
        </form>


        <button
          type="button"
          onClick={() => setShowFilters((open) => !open)}
          aria-expanded={showFilters}
          aria-controls="listing-filters"
          className={`text-eyebrow inline-flex cursor-pointer items-center justify-center gap-2 border px-5 py-3 font-sans font-semibold uppercase tracking-[0.14em] transition-colors lg:hidden ${
            showFilters || narrowing > 0
              ? "border-gold bg-gold/10 text-gold-deep"
              : "border-border text-ink"
          }`}
        >
          {showFilters ? "Hide filters" : "Filters"}
          {narrowing > 0 ? ` (${narrowing})` : ""}
        </button>
      </div>

      {/* Row 2: the four filters people use, plus the door to the rest. */}
      <div
        id="listing-filters"
        className={`${showFilters ? "grid" : "hidden"} grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:p-5 lg:grid lg:grid-cols-4 lg:items-end`}
      >
        <Field label="City">
          <Select
            key={`city-${city}`}
            name="city-filter"
            aria-label="City"
            defaultValue={city}
            className={BOXED_SELECT}
            options={[
              { value: "", label: "All cities" },
              ...cityCounts.map((c) => ({ value: c.city, label: `${c.city} (${c.count})` })),
            ]}
            // A locality or sector from the previous city is meaningless
            // under the new one — the same rule the admin form enforces.
            onValueChange={(v) => apply({ city: v, locality: "", sector: "" })}
          />
        </Field>

        <Field label="Type">
          <Select
            key={`type-${current.type ?? ""}`}
            name="type-filter"
            aria-label="Property type"
            defaultValue={current.type ?? ""}
            className={BOXED_SELECT}
            options={withAll("All types", mergePropertyTypes(types))}
            onValueChange={(v) => apply({ type: v })}
          />
        </Field>

        <Field label="Configuration">
          <Select
            key={`configuration-${current.configuration ?? ""}`}
            name="configuration-filter"
            aria-label="Configuration"
            defaultValue={current.configuration ?? ""}
            className={BOXED_SELECT}
            options={withAll("Any configuration", CONFIGURATIONS)}
            onValueChange={(v) => apply({ configuration: v })}
          />
        </Field>

        <Field label="Collection">
          <Select
            key={`group-${current.group ?? ""}`}
            name="group-filter"
            aria-label="Collection"
            defaultValue={current.group ?? ""}
            className={BOXED_SELECT}
            options={[
              { value: "", label: "All collections" },
              ...COLLECTIONS.map((c) => ({ value: c.value, label: c.label })),
            ]}
            onValueChange={(v) => apply({ group: v })}
          />
        </Field>

      </div>

      {/* What is actually applied, and one click to undo any of it. */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 md:px-5">
          <span className={`${LABEL} mr-1`}>Applied</span>
          {chips.map(([key, , label]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                apply(key === "city" ? { city: "", locality: "", sector: "" } : { [key]: "" })
              }
              className="text-meta inline-flex cursor-pointer items-center gap-2 rounded-full border border-gold/50 bg-gold/10 py-1 pl-3 pr-2 font-sans font-medium text-ink transition-colors hover:border-gold"
            >
              {label}
              <span
                aria-hidden
                className="flex h-4 w-4 items-center justify-center rounded-full bg-ink/10 text-[10px] leading-none"
              >
                ×
              </span>
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <Link
            href="/properties#listings"
            className="text-eyebrow ml-1 font-sans font-semibold uppercase tracking-[0.15em] text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-gold"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      {children}
    </div>
  );
}
