const QUOTES = [
  {
    quote:
      "They sold a house we never listed, to a buyer we never met, at a number we did not think existed.",
    name: "R. Castellane",
    role: "Seller, Harbor Point",
  },
  {
    quote:
      "One person answered every call for eleven months. That alone separates them from every firm we have used.",
    name: "M. Adeyemi",
    role: "Buyer, Meridian Quarter",
  },
  {
    quote:
      "The presentation of our home was better than the campaign our own company would have produced.",
    name: "H. Lindqvist",
    role: "Seller, The Ridgeline",
  },
];

/**
 * Client testimonials: sticky serif intro on the left, quote rows on the
 * right. Static content, no routes behind it.
 */
export function Testimonials() {
  return (
    <section className="grid grid-cols-1 gap-14 bg-cream px-5 py-20 md:grid-cols-[1fr_1.6fr] md:gap-20 md:px-12 md:py-28">
      <div className="md:sticky md:top-32 md:self-start">
        <h2 data-reveal className="max-w-sm text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          In Their Words
        </h2>
        <p data-reveal className="mt-5 max-w-sm text-pretty text-body font-sans text-ink-muted">
          Most of our clients arrive by referral. This is why.
        </p>
      </div>

      <div className="flex flex-col">
        {QUOTES.map((item, i) => (
          <figure
            key={item.name}
            data-reveal
            className={`flex flex-col gap-5 py-9 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <blockquote className="max-w-xl text-balance font-serif text-h4 leading-snug text-ink">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-baseline gap-3">
              <span className="h-px w-8 bg-gold" aria-hidden />
              <span className="text-meta font-sans text-ink">{item.name}</span>
              <span className="text-meta font-sans text-ink-muted">{item.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
