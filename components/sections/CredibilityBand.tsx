import { StatCounter } from "@/components/ui/StatCounter";

/**
 * Centered "featured" stats moment: small underlined kicker, serif caps
 * headline with the figure set in a lighter tone, supporting line, then
 * three large serif counters.
 */
export function CredibilityBand() {
  return (
    <section className="relative z-10 rounded-t-[2.5rem] bg-cream px-5 py-24 md:rounded-t-[4rem] md:py-32">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <span
          data-reveal
          className="text-eyebrow border-b border-ink/30 pb-1 font-sans font-medium uppercase tracking-[0.3em] text-ink-muted"
        >
          Featured
        </span>
        <h2
          data-reveal
          className="text-balance font-serif text-h2 uppercase tracking-[0.03em] text-ink"
        >
          Over <span className="text-ink-muted/60">$2.4 Billion</span> in
          landmark sales
        </h2>
        <p data-reveal className="max-w-lg text-pretty text-body font-sans text-ink-muted">
          Global Landmark represents considered residences across twelve
          markets, trusted by the most private buyers and sellers in the
          world.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3 md:mt-20">
        <div data-reveal>
          <StatCounter value={2.4} prefix="$" suffix="B+" label="Worth of Real Estate Sold" />
        </div>
        <div data-reveal>
          <StatCounter value={340} suffix="+" label="Landmark Properties" />
        </div>
        <div data-reveal>
          <StatCounter value={21} label="Years in Practice" />
        </div>
      </div>
    </section>
  );
}
