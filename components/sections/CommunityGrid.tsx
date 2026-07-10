import Image from "next/image";

const COMMUNITIES = [
  {
    name: "Harbor Point",
    detail: "Waterfront · Est. 2019",
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "The Ridgeline",
    detail: "Hillside · Est. 2021",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Meridian Quarter",
    detail: "Downtown · Est. 2017",
    image:
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Sable Cove",
    detail: "Private Island · Est. 2023",
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=900&auto=format&fit=crop",
  },
];

/**
 * "Close Inspection" material grid reskinned as a community index —
 * 4-column grid, white overlay slides up on hover to reveal detail.
 */
export function CommunityGrid() {
  return (
    <section id="the-collection" className="scroll-mt-24 px-5 py-16 md:px-10 md:py-24">
      <div data-reveal className="mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="text-h3 font-serif font-light text-ink">The Collection</h2>
        <span className="text-meta font-sans text-ink-muted">
          Four communities, each with its own character
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {COMMUNITIES.map((community) => (
          <div
            key={community.name}
            data-reveal
            className="group relative aspect-[4/5] overflow-hidden"
          >
            <Image
              src={community.image}
              alt={community.name}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="img-editorial object-cover transition-transform duration-[2000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col gap-1 bg-cream/95 px-5 py-5 transition-transform duration-500 ease-out group-hover:translate-y-0">
              <span className="text-meta font-sans font-semibold uppercase tracking-[0.1em] text-ink">
                {community.name}
              </span>
              <span className="text-eyebrow font-sans uppercase tracking-[0.1em] text-ink-muted">
                {community.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
