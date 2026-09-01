import { DEVELOPERS } from "@/lib/data";

/**
 * Auto-scrolling strip of the developers whose projects we broker. Duplicated row for a seamless loop; the
 * global reduced-motion rule freezes it for users who prefer that.
 *
 * The label is now on the page rather than only in the aria-label — a row
 * of drifting mastheads with nothing naming it is a puzzle, and the strip
 * is short enough that a line above it costs nothing.
 */
const row = (keyPrefix: string) =>
  DEVELOPERS.map((name) => (
    <span
      key={`${keyPrefix}${name}`}
      className="whitespace-nowrap font-serif text-h4 uppercase tracking-[0.12em] text-ink-muted"
    >
      {name}
    </span>
  ));

export function DeveloperMarquee() {
  return (
    <section
      aria-label="Developers we work with"
      className="overflow-hidden border-y border-border bg-surface py-10 md:py-12"
    >
      <p className="text-eyebrow mb-6 px-5 text-center font-sans font-semibold uppercase tracking-[0.24em] text-gold-deep md:px-12">
        Developers We Work With
      </p>
      <div className="animate-marquee flex w-max items-center gap-20 pr-20">
        {row("")}
        <span aria-hidden className="contents">
          {row("dup-")}
        </span>
      </div>
    </section>
  );
}
