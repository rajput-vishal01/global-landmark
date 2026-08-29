import Link from "next/link";
import { COLLECTIONS, type CollectionValue } from "@/lib/attributes";
import { propertiesHref, type PropertiesFilterParams } from "@/lib/properties-url";

/**
 * R-04's six "cardholders" — Kothi, Plot, Projects, Flats, Land, Commercial —
 * as a browsable grid at the top of /properties. Purely presentational:
 * counts and the current filter set come in as props, this component never
 * fetches. Clicking a card sets `?group=` (composed with every other active
 * filter) and jumps to the filtered grid below.
 */
export function CollectionGrid({
  counts,
  current,
}: {
  counts: { value: CollectionValue; count: number }[];
  current: PropertiesFilterParams;
}) {
  const countFor = (value: CollectionValue) =>
    counts.find((c) => c.value === value)?.count ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {COLLECTIONS.map((collection) => {
        const count = countFor(collection.value);
        return (
          <div key={collection.value}>
            <Link
              href={propertiesHref(current, { group: collection.value }, "listings")}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-dark-deep p-4 transition-transform duration-500 ease-out hover:-translate-y-1"
            >
              {/* ponytail: solid navy/gold-toned placeholder standing in for a
                  representative photo per collection. Wiring a real cover
                  needs a new per-collection cover query in lib/db/queries.ts,
                  which is owned by parallel work this round (out of scope
                  here — that file is explicitly hands-off). Swap this block
                  for an <Image src={collection.coverUrl}> once that lands. */}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-500 group-hover:opacity-90"
              />
              <span aria-hidden className="absolute inset-x-4 top-4 h-px bg-gold/40" />
              <span className="text-eyebrow relative font-sans font-medium uppercase tracking-[0.2em] text-gold-highlight">
                {count} {count === 1 ? "listing" : "listings"}
              </span>
              <h3 className="relative font-serif text-h4 text-cream">
                {collection.label}
              </h3>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
