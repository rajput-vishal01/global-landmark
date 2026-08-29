import Image from "next/image";
import { ARCH_REVEAL } from "@/lib/data";

/**
 * Full-bleed statement image with a caption over its lower edge.
 *
 * This was the site's "signature scroll moment": the image began scaled to
 * 62% under an arch-shaped mask and was scrubbed to full-bleed as you
 * scrolled through it. Phase A retired it — it was the most expensive
 * effect on the page (a scrubbed clip-path over a near-fullscreen layer)
 * and the clearest example of the thing the client was reacting to. With
 * no hooks left this is a server component, so it ships no JS at all.
 */
export function ArchReveal() {
  return (
    <section className="overflow-hidden bg-cream pt-20 md:pt-28">
      <div className="relative h-[70vh] w-full overflow-hidden md:h-[90vh]">
        <Image
          src={ARCH_REVEAL.image}
          alt={ARCH_REVEAL.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
        />
        <p className="absolute bottom-8 left-1/2 w-full max-w-3xl -translate-x-1/2 px-6 text-center font-serif text-h3 text-cream">
          {ARCH_REVEAL.caption}
        </p>
      </div>
    </section>
  );
}
