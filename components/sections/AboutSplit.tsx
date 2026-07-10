import { Button } from "@/components/ui/Button";
import { ParallaxImage } from "@/components/ui/ParallaxImage";

export function AboutSplit() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <ParallaxImage
        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop"
        alt="A landmark residence framed by mature trees"
        sizes="(min-width: 768px) 50vw, 100vw"
        className="min-h-[55vh] md:min-h-[85vh]"
      />

      <div className="flex flex-col justify-center gap-7 px-5 py-16 md:px-16 md:py-24">
        <h2 data-reveal className="max-w-md text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          Built on landmark sales
        </h2>
        <p data-reveal className="max-w-md text-pretty text-body font-sans text-ink-muted">
          For two decades, Global Landmark has represented the residences
          other brokerages call career-defining. Our clients stay private.
          Our results do not.
        </p>
        <p data-reveal className="max-w-md text-pretty text-body font-sans text-ink-muted">
          A single team handles every engagement end to end, from valuation
          and positioning to the quiet negotiation that closes it.
        </p>
        <div data-reveal className="mt-2">
          <Button href="/about">About the Group</Button>
        </div>
      </div>
    </section>
  );
}
