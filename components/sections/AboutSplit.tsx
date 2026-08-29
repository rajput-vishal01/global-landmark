import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ABOUT_SPLIT } from "@/lib/data";

/**
 * The image half used to drift vertically on scroll (ParallaxImage, now
 * deleted — this was its only caller). Phase A made it a still image.
 */
export function AboutSplit() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <div className="relative min-h-[55vh] overflow-hidden md:min-h-[85vh]">
        <Image
          src={ABOUT_SPLIT.image}
          alt={ABOUT_SPLIT.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-center gap-7 px-5 py-16 md:px-16 md:py-24">
        <h2 className="max-w-md text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          {ABOUT_SPLIT.heading}
        </h2>
        <p className="max-w-md text-pretty text-body font-sans text-ink-muted">
          {ABOUT_SPLIT.body}
        </p>
        <div className="mt-2">
          <Button href="/about">{ABOUT_SPLIT.ctaLabel}</Button>
        </div>
      </div>
    </section>
  );
}
