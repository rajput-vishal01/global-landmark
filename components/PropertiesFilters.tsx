"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import {
  FURNISHINGS,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  withEmptyOption as withAll,
} from "@/lib/attributes";

/**
 * Attribute filters for the listings page. Values live in the URL so
 * filtered views stay shareable; category stays as the chip row above.
 */
export function PropertiesFilters({
  propertyType,
  possession,
  furnishing,
}: {
  propertyType: string;
  possession: string;
  furnishing: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/properties${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3 md:max-w-3xl">
      <div className="flex flex-col gap-1.5">
        <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
          Type
        </span>
        <Select
          key={`type-${propertyType}`}
          name="type-filter"
          defaultValue={propertyType}
          options={withAll("All types", PROPERTY_TYPES)}
          onValueChange={(v) => apply("type", v)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
          Possession
        </span>
        <Select
          key={`possession-${possession}`}
          name="possession-filter"
          defaultValue={possession}
          options={withAll("Any possession", POSSESSION_STATUSES)}
          onValueChange={(v) => apply("possession", v)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
          Furnishing
        </span>
        <Select
          key={`furnishing-${furnishing}`}
          name="furnishing-filter"
          defaultValue={furnishing}
          options={withAll("Any furnishing", FURNISHINGS)}
          onValueChange={(v) => apply("furnishing", v)}
        />
      </div>
    </div>
  );
}
