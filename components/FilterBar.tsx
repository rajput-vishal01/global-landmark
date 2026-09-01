"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
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

/**
 * The one place to narrow the listing grid.
 *
 * This replaced four stacked bands — a category rule, a city tab row, a
 * configuration tab row, and a three-select block — each with its own
 * label style and its own full-width divider. Read top to bottom they
 * looked like four separate features rather than one filter; worse, city
 * and configuration were rendered as long wrapping tab rows, so the panel
 * grew taller the more options the taxonomy gained, and nothing told you
 * what was currently applied.
 *
 * Now: category as pills (still crawlable <Link>s, so ?category= pages keep
 * their internal links), everything else as one uniform grid of selects,
 * and a row of removable chips that names every active filter.
 *
 * Every control writes to the URL and clears `page` — narrowing the set
 * while sitting on page 3 would otherwise land the visitor on an empty
 * grid.
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

  const city = current.city ?? "";
  const localities = localitiesIn(city);

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
    <div className="mb-10 border border-border bg-cream">
      {/* Category — the top-level cut, so it reads as pills rather than as
          one more dropdown among seven. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-5 md:px-6">
        <span className="text-eyebrow mr-2 font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Category
        </span>
        {[{ value: undefined, label: "All" }, ...CATEGORIES].map((option) => {
          const isActive = option.value
            ? option.value === current.category
            : !current.category;
          return (
            <Link
              key={option.label}
              href={propertiesHref(
                current,
                { category: option.value, page: undefined },
                "listings"
              )}
              aria-current={isActive ? "page" : undefined}
              className={`text-eyebrow border px-4 py-2 font-sans font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
                isActive
                  ? "border-navy bg-navy text-cream"
                  : "border-border bg-white text-ink-muted hover:border-gold hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {/* One uniform grid: every remaining filter is the same control at the
          same size, so the panel height no longer grows with the taxonomy. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
        <Field label="City">
          <Select
            key={`city-${city}`}
            name="city-filter"
            defaultValue={city}
            options={[
              { value: "", label: "All cities" },
              ...cityCounts.map((c) => ({
                value: c.city,
                label: `${c.city} (${c.count})`,
              })),
            ]}
            // A locality or sector from the previous city is meaningless
            // under the new one — the same rule the admin form enforces.
            onValueChange={(v) => apply({ city: v, locality: "", sector: "" })}
          />
        </Field>

        <Field label="Collection">
          <Select
            key={`group-${current.group ?? ""}`}
            name="group-filter"
            defaultValue={current.group ?? ""}
            options={[
              { value: "", label: "All collections" },
              ...COLLECTIONS.map((c) => ({ value: c.value, label: c.label })),
            ]}
            onValueChange={(v) => apply({ group: v })}
          />
        </Field>

        <Field label="Type">
          <Select
            key={`type-${current.type ?? ""}`}
            name="type-filter"
            defaultValue={current.type ?? ""}
            options={withAll("All types", PROPERTY_TYPES)}
            onValueChange={(v) => apply({ type: v })}
          />
        </Field>

        <Field label="Configuration">
          <Select
            key={`configuration-${current.configuration ?? ""}`}
            name="configuration-filter"
            defaultValue={current.configuration ?? ""}
            options={withAll("Any configuration", CONFIGURATIONS)}
            onValueChange={(v) => apply({ configuration: v })}
          />
        </Field>

        <Field label="Possession">
          <Select
            key={`possession-${current.possession ?? ""}`}
            name="possession-filter"
            defaultValue={current.possession ?? ""}
            options={withAll("Any possession", POSSESSION_STATUSES)}
            onValueChange={(v) => apply({ possession: v })}
          />
        </Field>

        <Field label="Furnishing">
          <Select
            key={`furnishing-${current.furnishing ?? ""}`}
            name="furnishing-filter"
            defaultValue={current.furnishing ?? ""}
            options={withAll("Any furnishing", FURNISHINGS)}
            onValueChange={(v) => apply({ furnishing: v })}
          />
        </Field>

        {/* Locality and sector only mean something under a chosen city, so
            they appear with one rather than sitting there disabled. */}
        {city && localities.length > 0 && (
          <Field label="Locality">
            <Select
              key={`locality-${city}-${current.locality ?? ""}`}
              name="locality-filter"
              defaultValue={current.locality ?? ""}
              options={withAll(
                "Any locality",
                localities.map((l) => l.name)
              )}
              onValueChange={(v) => apply({ locality: v })}
            />
          </Field>
        )}

        {city && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sector-filter"
              className="text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted"
            >
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
              className="border-b border-border bg-transparent py-2.5 font-sans text-body text-ink transition-colors focus:border-gold focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* What is actually applied, and one click to undo any of it. Without
          this the only way to read the active filter set was to decode the
          query string. */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-5 md:px-6">
          <span className="text-eyebrow mr-1 font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Applied
          </span>
          {chips.map(([key, , label]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                apply(
                  key === "city"
                    ? { city: "", locality: "", sector: "" }
                    : { [key]: "" }
                )
              }
              className="text-eyebrow inline-flex cursor-pointer items-center gap-2 border border-border bg-white px-3 py-1.5 font-sans font-medium tracking-[0.1em] text-ink transition-colors hover:border-gold"
            >
              {label}
              <span aria-hidden className="text-ink-muted">
                ×
              </span>
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <Link
            href="/properties#listings"
            className="text-eyebrow ml-1 font-sans font-medium uppercase tracking-[0.15em] text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-gold"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}
