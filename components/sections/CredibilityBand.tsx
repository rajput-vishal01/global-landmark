import { StatCounter } from "@/components/ui/StatCounter";
import { CREDIBILITY } from "@/lib/data";

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
          {CREDIBILITY.eyebrow}
        </span>
        <h2
          data-reveal
          className="text-balance font-serif text-h2 uppercase tracking-[0.03em] text-ink"
        >
          {CREDIBILITY.headingPre}{" "}
          <span className="text-ink-muted/60">{CREDIBILITY.headingHighlight}</span>{" "}
          {CREDIBILITY.headingPost}
        </h2>
        <p data-reveal className="max-w-lg text-pretty text-body font-sans text-ink-muted">
          {CREDIBILITY.sub}
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3 md:mt-20">
        {CREDIBILITY.stats.map((stat) => (
          <div key={stat.label} data-reveal>
            <StatCounter
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              label={stat.label}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
