import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { ActiveDeal } from "@/lib/db/queries";
import { categoryLabel } from "@/lib/categories";
import { optimizedImage } from "@/lib/images";

function formatThrough(endsAt: string): string {
  return new Date(`${endsAt}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

/** Landing-page band for the currently live Deal of the Week. */
export function DealOfWeek({ deal }: { deal: ActiveDeal | null }) {
  if (!deal) return null;
  const { property } = deal;
  const cover = property.images[0];

  return (
    <section className="overflow-hidden bg-dark px-5 py-20 md:px-12 md:py-28">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <div className="flex flex-col items-start gap-6">
          <span data-reveal className="flex items-center gap-4">
            <span aria-hidden className="block h-px w-10 bg-gold" />
            <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.3em] text-gold-highlight">
              Deal of the Week
            </span>
          </span>
          <h2 data-reveal className="text-balance font-serif text-h2 uppercase tracking-[0.04em] text-cream">
            {property.title}
          </h2>
          <p data-reveal className="text-meta font-sans uppercase tracking-[0.15em] text-cream/60">
            {categoryLabel(property.category)} · {property.location}
          </p>
          <p data-reveal className="max-w-md text-pretty text-body font-sans text-cream/75">
            {property.description.split(/\n+/)[0]}
          </p>
          <p data-reveal className="text-meta font-sans text-cream/50">
            Held for private discussion through {formatThrough(deal.endsAt)}.
          </p>
          <div data-reveal className="mt-2">
            <Button href={`/properties/${property.slug}`} variant="corner" tone="dark">
              View the Residence
            </Button>
          </div>
        </div>

        {cover && (
          <div data-reveal-img className="relative aspect-[3/2] overflow-hidden bg-ink/20 md:aspect-[4/3]">
            <Image
              src={optimizedImage(cover.url, 1200)}
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
