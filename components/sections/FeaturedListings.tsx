"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useGSAP, gsap } from "@/lib/gsap";

const LISTINGS = [
  {
    title: "The Meridian Penthouse",
    location: "Harbor Point",
    price: "$12,500,000",
    beds: 4,
    baths: 5,
    sqft: "6,200",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
    href: "/properties/meridian-penthouse",
  },
  {
    title: "Sail House Sky Residence",
    location: "Meridian Quarter",
    price: "$8,750,000",
    beds: 3,
    baths: 3,
    sqft: "3,900",
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop",
    href: "/properties/sail-house-sky",
  },
  {
    title: "The Ridgeline Estate",
    location: "The Ridgeline",
    price: "$19,800,000",
    beds: 6,
    baths: 8,
    sqft: "11,400",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop",
    href: "/properties/ridgeline-estate",
  },
  {
    title: "Meridian Villa",
    location: "Harbor Point",
    price: "$14,200,000",
    beds: 5,
    baths: 6,
    sqft: "7,400",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1200&auto=format&fit=crop",
    href: "/properties/meridian-villa",
  },
  {
    title: "Sail House Terrace",
    location: "Meridian Quarter",
    price: "$6,400,000",
    beds: 2,
    baths: 3,
    sqft: "2,850",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop",
    href: "/properties/sail-house-terrace",
  },
  {
    title: "The Sable Cove House",
    location: "Sable Cove",
    price: "Price on request",
    beds: 7,
    baths: 9,
    sqft: "14,600",
    image:
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1200&auto=format&fit=crop",
    href: "/properties/sable-cove-house",
  },
];

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
          <Link
            key={listing.href}
            href={listing.href}
            className="group flex flex-col gap-4 md:w-[42vw] md:shrink-0 lg:w-[30vw]"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
              <Image
                src={listing.image}
                alt={listing.title}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 42vw, 100vw"
                className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-h4 text-ink">{listing.title}</h3>
              <p className="text-meta font-sans text-ink-muted">
                {listing.location}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-body font-sans font-medium text-gold-deep">
                  {listing.price}
                </span>
                <span className="text-meta font-sans text-ink-muted">
                  {listing.beds} Bd · {listing.baths} Ba · {listing.sqft} Sq Ft
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
