import Image from "next/image";
import { listTextTestimonials, type PublicTextTestimonial } from "@/lib/db/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Written testimonials as a continuously drifting wall.
 *
 * Separate from components/sections/Testimonials.tsx, which is the VIDEO
 * block: the two look nothing alike and the client asked for both.
 *
 * ponytail: the loop is one CSS keyframe on a duplicated list, not a JS
 * carousel — no state, no timers, no client bundle, and the global
 * prefers-reduced-motion rule in globals.css already parks it. Hover and
 * keyboard focus pause it so a quote can actually be read.
 *
 * The track is rendered twice and translated -50%, which is what makes the
 * wrap seamless; the second copy is aria-hidden so a screen reader is not
 * read the same six quotes twice.
 */

/** Initials, so a card has a face-shaped anchor without inventing a photo. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Stars() {
  return (
    <div aria-hidden className="flex gap-1 text-gold">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z" />
        </svg>
      ))}
    </div>
  );
}

function QuoteCard({ item }: { item: PublicTextTestimonial }) {
  return (
    <li className="relative flex w-[19rem] shrink-0 flex-col gap-5 overflow-hidden border border-border bg-white p-7 transition-colors duration-300 hover:border-gold md:w-[23rem] md:p-8">
      {/* Watermark glyph, the way the reference card carries it: large,
          behind the text, never competing with it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-1 font-serif text-[7rem] leading-none text-gold/10"
      >
        &rdquo;
      </span>

      <Stars />

      <blockquote className="relative text-pretty font-sans text-body leading-relaxed text-ink">
        &ldquo;{item.quote}&rdquo;
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-3 border-t border-border pt-5">
        {item.avatarUrl ? (
          <Image
            src={item.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-sans text-meta font-semibold text-cream"
          >
            {initials(item.author)}
          </span>
        )}
        <span className="flex flex-col">
          <span className="font-sans text-meta font-semibold text-ink">
            {item.author}
          </span>
          {item.context && (
            <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.14em] text-ink-muted">
              {item.context}
            </span>
          )}
        </span>
      </figcaption>
    </li>
  );
}

export async function TextTestimonials() {
  const quotes = await listTextTestimonials();
  if (quotes.length === 0) return null;

  return (
    <section className="overflow-hidden bg-surface py-16 md:py-24">
      <div className="px-5 md:px-12">
        <SectionHeading
          align="center"
          eyebrow="Wall of Trust"
          title="What our clients say"
        />
      </div>

      {/* The mask fades both ends into the section background so cards
          enter and leave the loop instead of being cut by a hard edge. */}
      <div
        className="wall-track [mask-image:linear-gradient(to_right,transparent,black_6rem,black_calc(100%-6rem),transparent)]"
      >
        <div className="animate-wall flex w-max gap-5 md:gap-6">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="flex shrink-0 gap-5 md:gap-6"
            >
              {quotes.map((item) => (
                <QuoteCard key={`${copy}-${item.id}`} item={item} />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
