import Image from "next/image";
import Link from "next/link";
import type { LocationCard } from "@/lib/db/queries";
import { propertiesHref } from "@/lib/properties-url";

/**
 * "Browse by Location" — the landing page's entry into the portfolio.
 *
 * It replaced the collection bento (Kothi / Plot / Flats ...): buyers here
 * start from a micro-market, not a property type, and the type filters are
 * still one click away on /properties. Purely presentational — counts and
 * covers come in as props, this component never fetches.
 *
 * Bento, not six equal squares: the first two tiles run double width so the
 * grid has a front row, and six into four columns closes without a ragged
 * edge.
 */
export function LocationGrid({ cards }: { cards: LocationCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, i) => {
        const feature = i < 2;
        return (
          <Link
            key={card.label}
            href={propertiesHref(
              {},
              { city: card.city, locality: card.locality },
              "listings"
            )}
            className={`group relative flex flex-col justify-end overflow-hidden bg-navy p-5 transition-colors duration-300 hover:bg-navy-deep md:p-6 ${
              feature ? "h-52 lg:col-span-2 lg:h-80" : "h-52 lg:h-64"
            }`}
          >
            {/* A real listing photo from that market. A market with nothing
                public in it has no cover and keeps the solid navy — the
                honest rendering, since there is nothing to show. */}
            {card.coverUrl && (
              <Image
                src={card.coverUrl}
                alt=""
                fill
                sizes={
                  feature
                    ? "(min-width: 1024px) 50vw, 50vw"
                    : "(min-width: 1024px) 25vw, 50vw"
                }
                className="img-zoom"
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5 transition-opacity duration-500 group-hover:opacity-90"
            />

            {/* Count as a pill top-left, an arrow top-right that fills on
                hover: the tile reads as a door, not a picture. */}
            <span className="text-eyebrow absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-sans font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur-sm">
              {card.count} {card.count === 1 ? "listing" : "listings"}
            </span>
            <span
              aria-hidden
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 text-white transition-colors duration-300 group-hover:border-cta group-hover:bg-cta group-hover:text-cta-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </span>

            <h3
              className={`relative font-serif text-cream ${feature ? "text-h2" : "text-h3"}`}
            >
              {card.label}
            </h3>
            <span aria-hidden className="relative mt-3 block h-px w-10 bg-gold transition-all duration-500 group-hover:w-20" />
          </Link>
        );
      })}
    </div>
  );
}
