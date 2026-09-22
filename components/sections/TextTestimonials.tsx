import Image from "next/image";
import { listTextTestimonials } from "@/lib/db/content";
import { getGoogleReviews } from "@/lib/google-reviews";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Written testimonials as a continuously drifting wall: the quotes added in
 * the admin, then the office's Google Maps reviews. The client asked for
 * both on one wall.
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
 * read the same quotes twice.
 */

type WallItem = {
  key: string;
  quote: string;
  author: string;
  context: string | null;
  avatarUrl: string | null;
  rating: number;
  /** Google reviews only: the reviewer's profile, which Google requires us to link. */
  authorUrl: string | null;
  fromGoogle: boolean;
};

/** Initials, so a card has a face-shaped anchor without inventing a photo. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Reading pace of the drift; was a fixed 70s for about six cards. */
const SECONDS_PER_CARD = 12;

const STAR_PATH =
  "m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z";

function Stars({ rating }: { rating: number }) {
  return (
    <div role="img" aria-label={`${rating} out of 5 stars`} className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={i < rating ? "text-gold" : "text-border"}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

/** Google's four-colour "G", the attribution Google asks review displays to carry. */
function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Avatar({ item }: { item: WallItem }) {
  if (item.avatarUrl && item.fromGoogle) {
    // Plain <img>: Google profile photos come from googleusercontent hosts
    // that are not worth adding to next/image's allowlist for a 40px face.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.avatarUrl}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  if (item.avatarUrl) {
    return (
      <Image
        src={item.avatarUrl}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-sans text-meta font-semibold text-cream"
    >
      {initials(item.author)}
    </span>
  );
}

// `isCopy`: the aria-hidden second track. Its links must leave the tab order
// too, or keyboard focus lands on something a screen reader cannot see.
function QuoteCard({ item, isCopy }: { item: WallItem; isCopy: boolean }) {
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

      <div className="flex items-center justify-between">
        <Stars rating={item.rating} />
        {item.fromGoogle && <GoogleMark />}
      </div>

      {/* Google reviews can run long; clamped so every card in the loop
          keeps a similar height. The full text is one click away. */}
      <blockquote className="relative line-clamp-6 text-pretty font-sans text-body leading-relaxed text-ink">
        &ldquo;{item.quote}&rdquo;
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-3 border-t border-border pt-5">
        <Avatar item={item} />
        <span className="flex flex-col">
          {item.authorUrl ? (
            <a
              href={item.authorUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              tabIndex={isCopy ? -1 : undefined}
              className="font-sans text-meta font-semibold text-ink underline-offset-4 hover:underline"
            >
              {item.author}
            </a>
          ) : (
            <span className="font-sans text-meta font-semibold text-ink">{item.author}</span>
          )}
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
  const [quotes, google] = await Promise.all([listTextTestimonials(), getGoogleReviews()]);

  const items: WallItem[] = [
    ...quotes.map((q) => ({
      key: `own-${q.id}`,
      quote: q.quote,
      author: q.author,
      context: q.context,
      avatarUrl: q.avatarUrl,
      rating: 5,
      authorUrl: null,
      fromGoogle: false,
    })),
    ...(google?.reviews ?? []).map((r) => ({
      key: `google-${r.id}`,
      quote: r.text,
      author: r.author,
      context: r.relativeTime ? `Google review · ${r.relativeTime}` : "Google review",
      avatarUrl: r.photoUrl,
      rating: r.rating,
      authorUrl: r.authorUrl,
      fromGoogle: true,
    })),
  ];
  if (items.length === 0) return null;

  return (
    <section className="overflow-hidden bg-surface py-16 md:py-24">
      <div className="px-5 md:px-12">
        <SectionHeading
          align="center"
          eyebrow="Wall of Trust"
          title="What our clients say"
        />
        {/* The real average and count, linking to the full list on Google —
            the wall shows a selection, this shows the whole picture. */}
        {google?.rating != null && google.mapsUrl && (
          <a
            href={google.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto -mt-4 mb-10 flex w-fit items-center gap-2.5 border border-border bg-white px-4 py-2 font-sans text-meta text-ink transition-colors hover:border-gold md:-mt-6 md:mb-12"
          >
            <GoogleMark size={16} />
            <span className="font-semibold">{google.rating.toFixed(1)}</span>
            <Stars rating={Math.round(google.rating)} />
            <span className="text-ink-muted">
              {google.total} reviews on Google
            </span>
          </a>
        )}
      </div>

      {/* The mask fades both ends into the section background so cards
          enter and leave the loop instead of being cut by a hard edge. */}
      <div
        className="wall-track [mask-image:linear-gradient(to_right,transparent,black_6rem,black_calc(100%-6rem),transparent)]"
      >
        {/* Duration scales with the card count so adding Google reviews
            does not speed the drift up past reading pace. */}
        <div
          className="animate-wall flex w-max gap-5 md:gap-6"
          style={{ animationDuration: `${items.length * SECONDS_PER_CARD}s` }}
        >
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="flex shrink-0 gap-5 md:gap-6"
            >
              {items.map((item) => (
                <QuoteCard key={`${copy}-${item.key}`} item={item} isCopy={copy === 1} />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
