"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatIndianShort } from "@/lib/attributes";
import { readRecentlyViewed, recordView } from "@/lib/recently-viewed";
import { useMounted } from "@/lib/hooks";
import type { EnquiryCartItem } from "@/lib/enquiry-cart-item";

/**
 * "Recently viewed" strip (R-45). Pass `record` on a detail page and the
 * listing both registers itself and is excluded from its own strip; omit it
 * on index pages, which only read.
 *
 * This strip mounts after hydration rather than with the server HTML, which
 * used to make it incompatible with the scroll-reveal engine (that engine
 * only registered nodes present when its GSAP context ran, so anything
 * mounting later stayed hidden). Phase A removed the engine outright, so
 * the hazard is gone — noted only because it explains why this component
 * never carried a reveal attribute.
 */
export function RecentlyViewed({ record }: { record?: EnquiryCartItem }) {
  // useMounted flips false -> true right after hydration (same trick
  // lib/enquiry-cart.ts uses), so the server HTML and first client render
  // agree on an empty list with no setState-in-effect involved: the read
  // below is a plain, side-effect-free render, not a store subscription.
  const mounted = useMounted();
  const items = mounted ? readRecentlyViewed() : [];

  // The one genuine side effect — writing the view to localStorage. It never
  // feeds back into this component's own state: `record` is always filtered
  // out of `shown` below regardless of whether this write has landed yet, so
  // the next mount (not this one) is what picks up the recorded view.
  useEffect(() => {
    if (record) recordView(record);
  }, [record]);

  const shown = items.filter((item) => item.id !== record?.id);
  if (shown.length === 0) return null;

  return (
    <section className="border-t border-border px-5 py-16 md:px-12 md:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span aria-hidden className="mb-4 block h-px w-12 bg-gold" />
          <h2 className="text-balance font-serif text-h3 uppercase tracking-[0.04em] text-ink">
            Recently Viewed
          </h2>
        </div>
        <Link
          href="/properties"
          className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
        >
          Browse all listings
        </Link>
      </div>

      {/* Horizontal rail on phones, grid from md — a strip of 8 thumbnails
          would crush to unreadable widths in a 2-column mobile grid. */}
      <ul className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-6">
        {shown.map((item) => (
          <li key={item.id} className="w-40 shrink-0 snap-start md:w-auto">
            <Link href={`/properties/${item.slug}`} className="group flex flex-col gap-3">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
                {item.thumbnail && (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="(min-width: 768px) 16vw, 160px"
                    className="img-zoom"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="line-clamp-2 font-serif text-body text-ink">{item.title}</p>
                <p className="text-meta font-sans text-ink-muted">{item.location}</p>
                <p className="text-meta font-sans font-medium text-ink">
                  {item.publicPrice != null
                    ? formatIndianShort(item.publicPrice)
                    : "Price on request"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
