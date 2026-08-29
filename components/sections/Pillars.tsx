import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PILLARS as PILLARS_DATA } from "@/lib/data";

/**
 * Three-pillar section: image, serif title, short body, separated by
 * hairline columns.
 *
 * The columns used to be staggered (each one dropped by a different top
 * margin) and the photography was forced to grayscale. Both were editorial
 * signatures pulling against the redesign: the stagger cost a screen of
 * height for no information, and desaturated property photography is the
 * one thing a buyer will not accept from a brokerage.
 */
export function Pillars() {
  return (
    <section className="bg-cream px-5 py-16 md:px-12 md:py-24">
      <SectionHeading
        align="center"
        eyebrow="Our Approach"
        title={PILLARS_DATA.heading}
      />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
        {PILLARS_DATA.items.map((pillar, i) => (
          <div
            key={pillar.title.join(" ")}
            className={`flex flex-col gap-6 md:px-10 ${
              i > 0 ? "md:border-l md:border-border" : ""
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={pillar.image}
                alt={pillar.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-serif text-h3 leading-tight text-heading">
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
