import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { ActiveDeal } from "@/lib/db/queries";
import { categoryLabel } from "@/lib/categories";

function formatThrough(endsAt: string): string {
  return new Date(`${endsAt}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

/**
 * Landing-page band for the currently live Deal of the Week.
 *
 * One of the page's two navy bands, and one of its two yellow actions —
 * the dark ground is what makes a single promoted listing read as an offer
 * rather than as one more card in the grid above it.
 */
export function DealOfWeek({ deal }: { deal: ActiveDeal | null }) {
  if (!deal) return null;
  const { property } = deal;
  const cover = property.images[0];

  return (
    <section className="overflow-hidden bg-navy px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-0">
        {/* The photograph leads, large; the panel overlaps it on a wide
            screen so the offer reads as one object, not two columns. */}
        {cover && (
          <div className="relative aspect-[4/3] overflow-hidden lg:col-span-8 lg:aspect-[16/10]">
            <Image
              src={cover.url}
              alt={cover.alt || property.title}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover"
            />
            <span className="text-eyebrow absolute left-0 top-6 bg-cta px-4 py-2 font-sans font-bold uppercase tracking-[0.2em] text-cta-ink">
              Deal of the Week
            </span>
          </div>
        )}

        <div
          className={`relative flex flex-col items-start gap-5 border border-cream/15 bg-navy-deep/95 p-7 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-sm md:p-10 ${
            cover ? "lg:col-span-5 lg:-ml-[25%]" : "lg:col-span-12"
          }`}
        >
          <span aria-hidden className="block h-px w-12 bg-gold" />
          <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-cta">
            {categoryLabel(property.category)} · {property.location}
          </p>
          <h2 className="text-balance font-serif text-h2 leading-tight text-cream">
            {property.title}
          </h2>
          <p className="text-pretty text-body font-sans leading-relaxed text-cream/75">
            {property.description.split(/\n+/)[0]}
          </p>
          <p className="text-meta flex items-center gap-2 font-sans text-cream/55">
            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Held for private discussion through {formatThrough(deal.endsAt)}.
          </p>
          <div className="mt-2">
            <Button href={`/properties/${property.slug}`} variant="primary">
              View the Residence
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
