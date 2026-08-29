import { Button } from "@/components/ui/Button";
import { ListingCard } from "@/components/ui/ListingCard";
import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";

/**
 * The featured-listings grid.
 *
 * This section used to pin on desktop and pan its card track sideways as
 * you scrolled — a horizontal scroll-hijack. It was the heaviest scroll
 * effect on the site and the one most likely to leave a visitor unsure how
 * to get past it, so Phase A dropped it in favour of the plain grid that
 * was already the mobile and reduced-motion fallback. Now every viewport
 * gets the same predictable layout, and with no hooks left this renders on
 * the server.
 */
export function FeaturedListings({
  properties,
}: {
  properties: PublicPropertyWithMedia[];
}) {
  return (
    <section id="listings" className="bg-cream py-16 md:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 px-5 md:mb-12 md:px-12">
        <h2 className="text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          Exclusive Listings
        </h2>
        <div>
          <Button href="/properties">View All Listings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-14 px-5 sm:grid-cols-2 md:grid-cols-3 md:gap-8 md:px-12">
        {properties.map((property) => (
          <ListingCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
