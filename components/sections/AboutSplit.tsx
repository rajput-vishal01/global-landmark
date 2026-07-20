import { Button } from "@/components/ui/Button";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { ABOUT_SPLIT } from "@/lib/data";

export function AboutSplit() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <ParallaxImage
        src={ABOUT_SPLIT.image}
        alt={ABOUT_SPLIT.alt}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="min-h-[55vh] md:min-h-[85vh]"
      />

      <div className="flex flex-col justify-center gap-7 px-5 py-16 md:px-16 md:py-24">
        <h2 data-reveal className="max-w-md text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          {ABOUT_SPLIT.heading}
        </h2>
        <p data-reveal className="max-w-md text-pretty text-body font-sans text-ink-muted">
          {ABOUT_SPLIT.body}
        </p>
        <div data-reveal className="mt-2">
          <Button href="/about">{ABOUT_SPLIT.ctaLabel}</Button>
        </div>
      </div>
    </section>
  );
}
