"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP, gsap } from "@/lib/gsap";
import { ARCH_REVEAL } from "@/lib/data";

/**
 * Signature scroll moment (sobharealty-style): a full-width image begins
 * scaled down under an arch mask and is scrubbed to full-bleed as the
 * user scrolls through it.
 */
export function ArchReveal() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // clip-path, not border-radius: radius is a paint property and
        // scrubbing it rasterizes a near-fullscreen layer every frame.
        gsap.fromTo(
          ".arch-img",
          { scale: 0.62, clipPath: "inset(0% 0% 0% 0% round 50vw 50vw 0 0)" },
          {
            scale: 1,
            clipPath: "inset(0% 0% 0% 0% round 0vw 0vw 0 0)",
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: "top 70%",
              end: "top 5%",
              scrub: 1,
            },
          }
        );
      });
    },
    { scope }
  );

  return (
    <section ref={scope} className="overflow-hidden bg-cream pt-20 md:pt-28">
      <div className="arch-img relative h-[70vh] w-full overflow-hidden md:h-[90vh]">
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
