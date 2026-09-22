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
            className={`group relative flex flex-col justify-end overflow-hidden bg-navy p-4 transition-colors duration-300 hover:bg-navy-deep ${
              feature ? "h-44 lg:col-span-2 lg:h-64" : "h-44 lg:h-48"
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
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
            />
            <span aria-hidden className="absolute inset-x-4 top-4 h-px bg-gold/40" />

            <span className="text-eyebrow relative font-sans font-semibold uppercase tracking-[0.18em] text-cta">
              {card.count} {card.count === 1 ? "listing" : "listings"}
            </span>
            <h3
              className={`relative font-serif text-cream ${feature ? "text-h3" : "text-h4"}`}
            >
              {card.label}
            </h3>
          </Link>
        );
      })}
    </div>
  );
}
