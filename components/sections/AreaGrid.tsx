import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { AreaWithCount } from "@/lib/db/areas";

/**
 * "Explore by location" — the client's most-asked-for missing feature
 * (R-46). A buyer who does not yet know a project name knows a locality,
 * and this is the only entry point on the site that starts from one.
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

export function AreaGrid({ areas }: { areas: AreaWithCount[] }) {
  if (areas.length === 0) return null;

  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 px-5 md:mb-12 md:px-12">
        <div>
          <h2 className="text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
            Explore by Location
          </h2>
          <p className="mt-3 max-w-lg text-pretty text-body font-sans text-ink-muted">
            {areas.length} area{areas.length === 1 ? "" : "s"} across the region,
            each with everything we currently hold there.
          </p>
        </div>
        <div>
          <Button href="/areas">View All Areas</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 px-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6 md:px-12">
        {/* Six is the reference portal's shape and the point at which the row
            still reads as a set rather than a directory; /areas has the rest. */}
        {areas.slice(0, 6).map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>
    </section>
  );
}
