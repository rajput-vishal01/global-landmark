import Image from "next/image";
import Link from "next/link";
import type { AreaWithCount } from "@/lib/db/areas";

/**
 * One locality tile on /areas (R-46). A buyer who does not yet know a
 * project name knows a locality, and the areas index is where that search
 * starts. (The landing page's own location entry point is LocationGrid,
 * which filters /properties directly rather than linking to area pages —
 * the "Explore by Location" band that used to live here was replaced by
 * it and is gone.)
 *
 * The count on each card is counted live per request; nothing about it is
 * stored, so it cannot drift away from what the landing page actually
 * lists. An area with zero listings still shows — a photographed locality
 * with nothing in it today is a page worth keeping in the grid rather than
 * one that blinks out of the homepage whenever the last unit sells.
 */
export function AreaCard({ area }: { area: AreaWithCount }) {
  return (
    <Link
      href={`/areas/${area.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-dark-deep"
    >
      {area.coverImage && (
        <Image
          src={area.coverImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="img-zoom opacity-90"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
      />
      <div className="relative p-5 md:p-6">
        <span aria-hidden className="mb-4 block h-px w-8 bg-gold" />
        <h3 className="font-serif text-h4 text-cream">{area.name}</h3>
        <p className="text-eyebrow mt-2 font-sans font-medium uppercase tracking-[0.2em] text-cream/75">
          {area.propertyCount} {area.propertyCount === 1 ? "Property" : "Properties"}
        </p>
      </div>
    </Link>
  );
}
