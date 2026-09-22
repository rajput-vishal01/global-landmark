import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
 *
 * The gutters are deliberately tighter than the rest of the page: the cards
 * carry their own frame now, so the whitespace between them no longer has
 * to do the separating.
 */
export function FeaturedListings({
  properties,
}: {
  properties: PublicPropertyWithMedia[];
}) {
  return (
    <section id="listings" className="bg-cream px-5 py-16 md:px-12 md:py-24">
      <SectionHeading
        eyebrow="Featured"
        title="Our Listings"
        action={
          <Button href="/properties" variant="outline">
            View All Listings
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <ListingCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
