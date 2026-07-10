"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ListingCard } from "@/components/ui/ListingCard";
import { LISTINGS } from "@/lib/listings";
import { useGSAP, gsap } from "@/lib/gsap";

/**
 * Horizontal scroll-hijack on desktop: the section pins and the card track
 * pans left as the user scrolls. Falls back to a vertical grid on mobile
 * and for reduced-motion users.
 */
export function FeaturedListings() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const distance = () =>
            (track.current?.scrollWidth ?? 0) - window.innerWidth;
          gsap.to(track.current, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: wrap.current,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }
      );
    },
    { scope: wrap }
  );

  return (
    <section
      id="listings"
      ref={wrap}
      className="overflow-hidden bg-cream py-16 md:flex md:h-[100dvh] md:flex-col md:justify-center md:py-0"
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 px-5 md:mb-12 md:px-12">
        <h2 data-reveal className="text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          Exclusive Listings
        </h2>
        <div data-reveal>
          <Button href="/properties">View All Listings</Button>
        </div>
      </div>

      <div
        ref={track}
        className="grid grid-cols-1 gap-x-6 gap-y-14 px-5 sm:grid-cols-2 md:flex md:w-max md:flex-nowrap md:gap-8 md:px-12"
      >
        {LISTINGS.map((listing) => (
          <ListingCard
            key={listing.title}
            listing={listing}
            className="md:w-[42vw] md:shrink-0 lg:w-[30vw]"
          />
        ))}
      </div>
    </section>
  );
}
