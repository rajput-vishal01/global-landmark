"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { localitiesIn } from "@/lib/locations";
import { withEmptyOption } from "@/lib/attributes";

/**
 * R-08 — location filters as tabs. A horizontally scrollable city row
 * (edge fades on mobile) plus dependent locality/sector pickers that appear
 * once a city is chosen, mirroring LocationSection.tsx's admin UX: picking
 * a new city clears whatever locality/sector belonged to the old one.
 *
 * Client component (unlike CollectionGrid/ConfigTabs) because the dependent
 * Select needs live onChange navigation, not just a static href. Reading
 * `useSearchParams()` directly here also means every other active filter
 * (group, category, configuration, ...) survives a city or locality change
 * for free — same trick PropertiesFilters already uses.
 */
export function CityTabs({
  cities,
  city,
  locality,
  sector,
}: {
  cities: { city: string; count: number }[];
  city: string;
  locality: string;
  sector: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/properties${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  function chooseCity(next: string) {
    // A locality/sector from the previous city is meaningless under the
    // new one — the same rule the admin form enforces.
    apply({ city: next, locality: "", sector: "" });
  }

  const localities = localitiesIn(city);

  return (
    <nav aria-label="Filter by city" className="flex flex-col gap-5">
      <div className="relative">
        <div className="flex gap-x-6 overflow-x-auto pb-1">
          <CityTab label="All cities" isActive={!city} onClick={() => chooseCity("")} />
          {cities.map((c) => (
            <CityTab
              key={c.city}
              label={`${c.city} (${c.count})`}
              isActive={c.city === city}
              onClick={() => chooseCity(c.city)}
            />
          ))}
        </div>
        {/* Scroll hint on mobile — the row itself scrolls, these are purely
            decorative and never intercept a tap. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cream to-transparent sm:hidden"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cream to-transparent sm:hidden"
        />
      </div>

      {city && (
        <div className="grid max-w-md grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
              Locality
            </span>
            {localities.length > 0 ? (
              <Select
                key={`locality-${city}`}
                name="locality-filter"
                defaultValue={locality}
                options={withEmptyOption(
                  "Any locality",
                  localities.map((l) => l.name)
                )}
                onValueChange={(v) => apply({ locality: v })}
              />
            ) : (
              <p className="py-2.5 font-sans text-meta text-ink-muted">
                No localities listed for {city} yet
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sector-filter"
              className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep"
            >
              Sector
            </label>
            {/* ponytail: sector has no static taxonomy the way locality does
                (lib/locations.ts models City -> Locality only, not sectors),
                so this stays a free-text field rather than a fabricated
                Select. Promote to a Select once a "distinct sectors per
                city" query exists — lib/db/queries.ts is owned by parallel
                work this round. */}
            <input
              id="sector-filter"
              type="text"
              defaultValue={sector}
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
        </div>
      )}
    </nav>
  );
}

function CityTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`text-eyebrow relative shrink-0 whitespace-nowrap pb-1 font-sans font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
        isActive ? "text-ink" : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
      <span
        aria-hidden
        className={`absolute bottom-0 left-0 h-px w-full origin-left bg-gold transition-transform duration-500 ease-out ${
          isActive ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </button>
  );
}
