import { listTextTestimonials } from "@/lib/db/content";

/**
 * Written testimonials — a quote and the person who said it.
 *
 * Separate from components/sections/Testimonials.tsx, which is the VIDEO
 * block: the two look nothing alike and the client asked for both.
 *
 * ponytail: the "carousel" is native CSS scroll-snap, not a JS slider. It
 * swipes on touch, scrolls on trackpad, and is keyboard-scrollable via the
 * focusable region — for a strip of quotes that is the whole feature, and
 * it ships no JavaScript into a page the client asked to make lighter.
 * Add arrow buttons only if the client actually asks for them.
 */
export async function TextTestimonials() {
  const quotes = await listTextTestimonials();
  if (quotes.length === 0) return null;

  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mb-12 flex items-center gap-6 px-5 md:mb-14 md:px-12">
        <span aria-hidden className="hidden h-px flex-1 bg-border md:block" />
        <h2 className="text-center font-sans text-h4 font-light uppercase tracking-[0.18em] text-ink">
          What Our Clients Say
        </h2>
        <span aria-hidden className="hidden h-px flex-1 bg-border md:block" />
      </div>

      {/* tabIndex + role sit on the wrapper, not the <ul>: a scrollable
          region must be reachable by keyboard or the later quotes exist for
          pointer users only — but putting role="region" on the list itself
          would strip its list semantics from a screen reader. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Written client testimonials"
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-gold"
      >
      <ul className="flex snap-x snap-mandatory gap-5 px-5 pb-4 md:gap-6 md:px-12">
        {quotes.map((item) => (
          <li
            key={item.id}
            className="w-[min(100%,26rem)] shrink-0 snap-start border border-border p-8 transition-colors duration-300 hover:border-gold md:p-10"
          >
            <figure className="flex h-full flex-col gap-6">
              <blockquote className="text-balance font-serif text-h4 leading-snug text-ink">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-baseline gap-3">
                <span aria-hidden className="h-px w-8 shrink-0 bg-gold" />
                <span className="text-meta font-sans text-ink">by {item.author}</span>
                {item.context && (
                  <span className="text-meta font-sans text-ink-muted">
                    {item.context}
                  </span>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
