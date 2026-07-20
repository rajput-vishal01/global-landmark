import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { CTA_BAND } from "@/lib/data";

export function CTABand() {
  return (
    <section data-unveil className="overflow-hidden bg-dark px-5 py-24 text-center md:px-12 md:py-36">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-7">
        <h2 data-reveal className="text-balance font-serif text-h2 uppercase tracking-[0.05em] text-cream">
          {CTA_BAND.heading}
        </h2>
        <p data-reveal className="max-w-md text-pretty text-body font-sans text-cream/70">
          {CTA_BAND.sub}
        </p>
        <div data-reveal className="mt-3">
          <Magnetic strength={0.25}>
            <Button href="/contact" variant="corner" tone="dark">
              {CTA_BAND.ctaLabel}
            </Button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
