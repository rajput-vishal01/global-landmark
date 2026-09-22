import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ABOUT_SPLIT } from "@/lib/data";

/**
 * The group, in one band (Sep 2026 redesign): a framed photograph beside
 * the claim, the same gold offset frame the About page uses, so the two
 * read as one voice. It was a flush half-and-half split before.
 */
export function AboutSplit() {
  return (
    <section className="bg-surface px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 md:grid-cols-12 md:gap-16">
        <div className="relative md:col-span-6">
          <span
            aria-hidden
            className="absolute -bottom-4 -right-4 left-4 top-4 border border-gold/50 md:-bottom-6 md:-right-6 md:left-6 md:top-6"
          />
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-[5/4]">
            <Image
              src={ABOUT_SPLIT.image}
              alt={ABOUT_SPLIT.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-6 md:pl-6">
          <SectionHeading
            flush
            eyebrow="The Group"
            title={ABOUT_SPLIT.heading}
            sub={ABOUT_SPLIT.body}
          />
          <div className="mt-8">
            <Button href="/about" variant="outline">
              {ABOUT_SPLIT.ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
