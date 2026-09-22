import { FOUNDERS_MESSAGE } from "@/lib/data";

/**
 * The founders' signed message, in their own words.
 *
 * Two columns on wide screens: the heading, standfirst and signature hold
 * still on the left (sticky) while the letter reads down the right. As one
 * long centred column it was the "text text text" the client objected to;
 * split this way the reader always knows whose voice it is and what it
 * argues. Stacks to a single column on a phone.
 */
export function FoundersMessage() {
  return (
    <section className="bg-navy px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-32">
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
            <div className="mt-10 border-t border-cream/15 pt-6">
              <p className="font-serif text-h4 text-cta">{FOUNDERS_MESSAGE.signature}</p>
              <p className="mt-1 text-meta font-sans text-cream/60">
                {FOUNDERS_MESSAGE.signatureRole}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:col-span-7">
          <div className="flex flex-col gap-5">
            {FOUNDERS_MESSAGE.body.map((paragraph) => (
              <p
                key={paragraph}
                className="text-pretty text-body font-sans leading-relaxed text-cream/75"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <h3 className="mt-14 text-balance border-t border-cream/15 pt-10 font-serif text-h3 text-cream">
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

          <p className="mt-10 border-l-2 border-gold pl-6 text-pretty font-serif text-h4 leading-snug text-cream">
            {FOUNDERS_MESSAGE.signOff}
          </p>
        </div>
      </div>
    </section>
  );
}
