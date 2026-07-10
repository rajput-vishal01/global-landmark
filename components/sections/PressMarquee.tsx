const PRESS = [
  "Forbes",
  "The Wall Street Journal",
  "Architectural Digest",
  "Bloomberg",
  "Robb Report",
  "Mansion Global",
];

/**
 * Auto-scrolling press strip. Duplicated row for a seamless loop; the
 * global reduced-motion rule freezes it for users who prefer that.
 */
export function PressMarquee() {
  const row = PRESS.map((name) => (
    <span
      key={name}
      className="whitespace-nowrap font-serif text-h4 uppercase tracking-[0.12em] text-ink-muted/70"
    >
      {name}
    </span>
  ));

  return (
    <section aria-label="As featured in" className="overflow-hidden border-y border-border bg-cream py-10">
      <div className="animate-marquee flex w-max items-center gap-20 pr-20">
        {row}
        <span aria-hidden className="contents">
          {PRESS.map((name) => (
            <span
              key={`dup-${name}`}
              className="whitespace-nowrap font-serif text-h4 uppercase tracking-[0.12em] text-ink-muted/70"
            >
              {name}
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}
