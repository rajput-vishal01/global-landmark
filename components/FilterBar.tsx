"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { BOXED_SELECT } from "@/components/form-classes";
import { localitiesIn } from "@/lib/locations";
import {
  COLLECTIONS,
  CONFIGURATIONS,
  FURNISHINGS,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  withEmptyOption as withAll,
} from "@/lib/attributes";
import { CATEGORIES } from "@/lib/categories";
import { propertiesHref, type PropertiesFilterParams } from "@/lib/properties-url";

const LABEL =
  "text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted";

/**
 * The listings search console (redesigned Sep 2026).
 *
 * One white card, lifted over the page header's edge:
 *   row 1 — keyword search, and category as a segmented switch;
 *   row 2 — the four filters people actually use (city, type, configuration,
 *           collection), with the rest behind "More filters";
 *   row 3 — every applied filter as a removable chip.
 *
 * It replaced a cream panel that showed all eight selects at once, which
 * read as a form to fill in rather than a search. Nothing was dropped: the
 * secondary filters are one click away, and the button counts how many of
 * them are set so a hidden filter is never a surprise.
 *
 * Every control writes to the URL and clears `page` — narrowing the set
 * while sitting on page 3 would otherwise land the visitor on an empty grid.
 */
export function FilterBar({
  current,
  cityCounts,
}: {
  current: PropertiesFilterParams;
  cityCounts: { city: string; count: number }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = current.city ?? "";
  const localities = localitiesIn(city);
  const moreSet = [current.possession, current.furnishing, current.locality, current.sector].filter(
    Boolean
  ).length;
  // Opens by itself when one of its filters is already applied, so a visitor
  // arriving on a filtered link can see what is narrowing the grid.
  const [showMore, setShowMore] = useState(moreSet > 0);
  // Phones only: the dropdowns fold behind one button so the first listing
  // is not four screens down. From lg they are always shown.
  const narrowing = [
    current.city,
    current.type,
    current.configuration,
    current.group,
    current.possession,
    current.furnishing,
    current.locality,
    current.sector,
  ].filter(Boolean).length;
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

        {/* Category as a segmented switch. Still <Link>s, so ?category=
            pages keep their crawlable internal links. */}
        <nav
          aria-label="Category"
          className="flex shrink-0 overflow-x-auto border border-border bg-surface p-1 no-scrollbar"
        >
          {[{ value: undefined, label: "All" }, ...CATEGORIES].map((option) => {
            const isActive = option.value ? option.value === current.category : !current.category;
            return (
              <Link
                key={option.label}
                href={propertiesHref(current, { category: option.value, page: undefined }, "listings")}
                aria-current={isActive ? "page" : undefined}
                className={`text-eyebrow whitespace-nowrap px-4 py-2 font-sans font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ${
                  isActive ? "bg-navy text-cream" : "text-ink-muted hover:text-ink"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>

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
        className={`${showFilters ? "grid" : "hidden"} grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:p-5 lg:grid lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end`}
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
            options={withAll("All types", PROPERTY_TYPES)}
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

        <button
          type="button"
          onClick={() => setShowMore((open) => !open)}
          aria-expanded={showMore}
          aria-controls="more-filters"
          className={`text-eyebrow inline-flex cursor-pointer items-center justify-center gap-2 border px-5 py-3.5 font-sans font-semibold uppercase tracking-[0.14em] transition-colors ${
            showMore || moreSet > 0
              ? "border-gold bg-gold/10 text-gold-deep"
              : "border-border text-ink hover:border-gold"
          }`}
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
          More filters{moreSet > 0 ? ` (${moreSet})` : ""}
        </button>
      </div>

      {showMore && (
        <div
          id="more-filters"
          // Follows the phone fold: hidden with the rest until Filters is open.
          className={`${showFilters ? "grid" : "hidden"} grid-cols-1 gap-4 border-t border-border bg-surface/60 p-4 sm:grid-cols-2 md:p-5 lg:grid lg:grid-cols-4`}
        >
          <Field label="Possession">
            <Select
              key={`possession-${current.possession ?? ""}`}
              name="possession-filter"
              aria-label="Possession"
              defaultValue={current.possession ?? ""}
              className={BOXED_SELECT}
              options={withAll("Any possession", POSSESSION_STATUSES)}
              onValueChange={(v) => apply({ possession: v })}
            />
          </Field>

          <Field label="Furnishing">
            <Select
              key={`furnishing-${current.furnishing ?? ""}`}
              name="furnishing-filter"
              aria-label="Furnishing"
              defaultValue={current.furnishing ?? ""}
              className={BOXED_SELECT}
              options={withAll("Any furnishing", FURNISHINGS)}
              onValueChange={(v) => apply({ furnishing: v })}
            />
          </Field>

          {/* Locality and sector only mean something under a chosen city,
              so they say so rather than offering an empty list. */}
          {city && localities.length > 0 ? (
            <Field label="Locality">
              <Select
                key={`locality-${city}-${current.locality ?? ""}`}
                name="locality-filter"
                aria-label="Locality"
                defaultValue={current.locality ?? ""}
                className={BOXED_SELECT}
                options={withAll(
                  "Any locality",
                  localities.map((l) => l.name)
                )}
                onValueChange={(v) => apply({ locality: v })}
              />
            </Field>
          ) : (
            <Field label="Locality">
              <p className="border border-dashed border-border px-4 py-3 text-meta font-sans text-ink-muted">
                Choose a city first
              </p>
            </Field>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sector-filter" className={LABEL}>
              Sector
            </label>
            {/* ponytail: sector has no taxonomy the way locality does
                (lib/locations.ts models City -> Locality only), so this
                stays free text rather than a fabricated Select. Promote it
                once a "distinct sectors per city" query exists. */}
            <input
              id="sector-filter"
              type="text"
              defaultValue={current.sector ?? ""}
              placeholder="e.g. Sector 20"
              onBlur={(e) => apply({ sector: e.currentTarget.value.trim() })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply({ sector: e.currentTarget.value.trim() });
                }
              }}
              className="w-full border border-border bg-white px-4 py-3 font-sans text-body text-ink placeholder:text-ink-muted/60 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>
      )}

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
