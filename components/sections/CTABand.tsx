import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";

export function CTABand() {
  return (
    <section data-unveil className="overflow-hidden bg-dark px-5 py-24 text-center md:px-12 md:py-36">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-7">
        <h2 data-reveal className="text-balance font-serif text-h2 uppercase tracking-[0.05em] text-cream">
          List With Global Landmark
        </h2>
        <p data-reveal className="max-w-md text-pretty text-body font-sans text-cream/70">
          A private valuation and a considered presentation, held to the
          same standard as every residence we represent.
        </p>
        <div data-reveal className="mt-3">
          <Magnetic strength={0.25}>
            <Button href="/contact" variant="corner" tone="dark">
              Request a Valuation
            </Button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
