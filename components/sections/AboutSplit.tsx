import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ABOUT_SPLIT } from "@/lib/data";

/**
 * The image half used to drift vertically on scroll (ParallaxImage, now
 * deleted — this was its only caller). Phase A made it a still image.
 */
export function AboutSplit() {
  return (
    <section className="grid grid-cols-1 bg-cream md:grid-cols-2">
      <div className="relative min-h-[45vh] overflow-hidden md:min-h-[70vh]">
        <Image
          src={ABOUT_SPLIT.image}
          alt={ABOUT_SPLIT.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-center px-5 py-16 md:px-14 md:py-24">
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
    </section>
  );
}
