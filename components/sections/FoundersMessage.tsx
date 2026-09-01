import { FOUNDERS_MESSAGE } from "@/lib/data";

/**
 * The founders' signed message.
 *
 * Deliberately not another card grid or stat band: this is one voice
 * addressing the reader directly, so it is set as a single measured column
 * on the navy — the one treatment on the site that reads as a statement
 * rather than as merchandising — and closed with a signature.
 */
export function FoundersMessage() {
  return (
    <section className="bg-navy px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto flex max-w-3xl flex-col">
        <span aria-hidden className="mb-8 block h-px w-16 bg-gold" />

        <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.22em] text-cta">
          {FOUNDERS_MESSAGE.eyebrow}
        </p>

        <h2 className="mt-4 text-balance font-serif text-h2 text-cream">
          {FOUNDERS_MESSAGE.heading}
        </h2>

        {/* The standfirst carries the argument; it earns the larger size. */}
        <p className="mt-5 text-pretty font-serif text-h4 leading-snug text-cta">
          {FOUNDERS_MESSAGE.standfirst}
        </p>

        <div className="mt-8 flex flex-col gap-5">
          {FOUNDERS_MESSAGE.body.map((paragraph) => (
            <p
              key={paragraph}
              className="text-pretty text-body font-sans leading-relaxed text-cream/75"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <h3 className="mt-14 text-balance font-serif text-h3 text-cream">
          {FOUNDERS_MESSAGE.closingHeading}
        </h3>

        <div className="mt-6 flex flex-col gap-5">
          {FOUNDERS_MESSAGE.closingBody.map((paragraph) => (
            <p
              key={paragraph}
              className="text-pretty text-body font-sans leading-relaxed text-cream/75"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <p className="mt-10 text-pretty font-serif text-h4 leading-snug text-cream">
          {FOUNDERS_MESSAGE.signOff}
        </p>

        <footer className="mt-10 border-t border-cream/15 pt-6">
          <p className="font-serif text-h4 text-cta">{FOUNDERS_MESSAGE.signature}</p>
          <p className="mt-1 text-meta font-sans text-cream/60">
            {FOUNDERS_MESSAGE.signatureRole}
          </p>
        </footer>
      </div>
    </section>
  );
}
