import Image from "next/image";
import Link from "next/link";
import { COLLECTIONS, type CollectionValue } from "@/lib/attributes";
import { propertiesHref, type PropertiesFilterParams } from "@/lib/properties-url";

/**
 * R-04's six "cardholders" — Kothi, Plot, Projects, Flats, Land, Commercial —
 * as a browsable grid at the top of /properties. Purely presentational:
 * counts and the current filter set come in as props, this component never
 * fetches. Clicking a card sets `?group=` (composed with every other active
 * filter) and jumps to the filtered grid below.
 *
 * Laid out as a bento rather than six identical squares: the first two
 * tiles run double width and taller, the remaining four fill the row under
 * them. Six into four columns is what makes the shape close cleanly — it
 * gives the grid a front row without leaving a ragged edge, and the
 * emphasis costs nothing since every tile links to the same kind of thing.
 */
export function CollectionGrid({
  counts,
  current,
}: {
  counts: { value: CollectionValue; count: number; coverUrl?: string | null }[];
  current: PropertiesFilterParams;
}) {
  const entryFor = (value: CollectionValue) =>
    counts.find((c) => c.value === value);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {COLLECTIONS.map((collection, i) => {
        const entry = entryFor(collection.value);
        const count = entry?.count ?? 0;
        const coverUrl = entry?.coverUrl ?? null;
        const feature = i < 2;
        return (
          <Link
            key={collection.value}
            href={propertiesHref(current, { group: collection.value }, "listings")}
            className={`group relative flex flex-col justify-end overflow-hidden bg-navy p-4 transition-colors duration-300 hover:bg-navy-deep ${
              feature ? "h-44 lg:col-span-2 lg:h-64" : "h-44 lg:h-48"
            }`}
          >
            {/* A real listing photo from inside the collection, so the tile
                shows what it is offering rather than a coloured block. A
                collection with nothing public in it has no cover and keeps
                the solid navy — the honest rendering, since there is
                nothing behind the tile to show. */}
            {coverUrl && (
              <Image
                src={coverUrl}
                alt=""
                fill
                sizes={feature ? "(min-width: 1024px) 50vw, 50vw" : "(min-width: 1024px) 25vw, 50vw"}
                className="img-zoom"
              />
            )}
            {/* Heavier than a card scrim: the label and count sit directly
                on the photograph with no plate behind them. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
            />
            <span aria-hidden className="absolute inset-x-4 top-4 h-px bg-gold/40" />

            {/* The count is the reason this grid exists — it is the only
                thing on the page that says how deep the portfolio actually
                runs — so it is set in the CTA yellow rather than left as
                dim caption text under the label. */}
            <span className="text-eyebrow relative font-sans font-semibold uppercase tracking-[0.18em] text-cta">
              {count} {count === 1 ? "listing" : "listings"}
            </span>
            <h3
              className={`relative font-serif text-cream ${feature ? "text-h3" : "text-h4"}`}
            >
              {collection.label}
            </h3>
          </Link>
        );
      })}
    </div>
  );
}
