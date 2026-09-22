import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    <section className="overflow-hidden bg-navy px-5 py-16 md:px-12 md:py-24">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <div className="flex flex-col items-start gap-5">
          <SectionHeading
            flush
            tone="dark"
            eyebrow="Deal of the Week"
            title={property.title}
          />
          <p className="text-meta font-sans uppercase tracking-[0.15em] text-cream/60">
            {categoryLabel(property.category)} · {property.location}
          </p>
          <p className="max-w-md text-pretty text-body font-sans text-cream/75">
            {property.description.split(/\n+/)[0]}
          </p>
          <p className="text-meta font-sans text-cream/50">
            Held for private discussion through {formatThrough(deal.endsAt)}.
          </p>
          <div className="mt-2">
            <Button href={`/properties/${property.slug}`} variant="primary">
              View the Residence
            </Button>
          </div>
        </div>

        {cover && (
          <div className="relative aspect-[3/2] overflow-hidden bg-ink/20 md:aspect-[4/3]">
            <Image
              src={cover.url}
              alt={cover.alt || property.title}
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
