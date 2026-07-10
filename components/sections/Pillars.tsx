import Image from "next/image";

const PILLARS = [
  {
    title: ["Thoughtful", "Curation"],
    body: "We represent few properties by intention. Every residence in the portfolio is walked, studied, and accepted on its architecture, its setting, and its provenance before it carries our name.",
    image:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=900&auto=format&fit=crop",
    alt: "A composed interior with considered furnishing",
    offset: "",
  },
  {
    title: ["Quiet", "Discretion"],
    body: "Landmark transactions move privately. Off-market introductions, unlisted showings, and negotiations handled by a single senior team from the first conversation to the closing table.",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=900&auto=format&fit=crop",
    alt: "A private residence interior in evening light",
    offset: "md:mt-24",
  },
  {
    title: ["Enduring", "Craft"],
    body: "We hold presentation to the standard of the architecture itself. Photography, film, and print produced for each residence individually, never from a template.",
    image:
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=900&auto=format&fit=crop",
    alt: "Detailed architectural facade in warm light",
    offset: "md:mt-12",
  },
];

/**
 * Three-pillar editorial section: staggered grayscale imagery over serif
 * titles and short body copy, separated by hairline columns.
 */
export function Pillars() {
  return (
    <section className="bg-cream px-5 py-20 md:px-12 md:py-28">
      <div data-reveal className="mb-14 flex items-center gap-6 md:mb-20">
        <span aria-hidden className="hidden h-px flex-1 bg-border md:block" />
        <h2 className="text-center font-sans text-h4 font-light uppercase tracking-[0.18em] text-ink">
          From First Viewing to Final Signature
        </h2>
        <span aria-hidden className="hidden h-px flex-1 bg-border md:block" />
      </div>

      <div className="grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-0">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.title.join(" ")}
            data-reveal
            data-drift={[4, -6, 8][i]}
            className={`flex flex-col gap-8 md:px-10 ${i > 0 ? "md:border-l md:border-border" : ""} ${pillar.offset}`}
          >
            <div data-reveal-img className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={pillar.image}
                alt={pillar.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover grayscale"
              />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-serif text-h3 leading-tight text-ink">
                {pillar.title[0]}
                <br />
                {pillar.title[1]}
              </h3>
              <p className="text-pretty text-body font-sans text-ink-muted">
                {pillar.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
