"use client";

import { useRef } from "react";
import { useGSAP, gsap, SplitText } from "@/lib/gsap";

/**
 * Pinned manifesto: the section holds while a large serif statement fills
 * in word by word, scrubbed to scroll. Static, fully visible text for
 * reduced-motion users and when JS never runs.
 */
export function Manifesto() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        SplitText.create(".manifesto-text", {
          type: "words",
          autoSplit: true,
          onSplit: (self) =>
            gsap.fromTo(
              self.words,
              { opacity: 0.14 },
              {
                opacity: 1,
                stagger: 0.06,
                ease: "none",
                scrollTrigger: {
                  trigger: scope.current,
                  start: "top top",
                  end: "+=130%",
                  pin: true,
                  scrub: 0.6,
                },
              }
            ),
        });
      });
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      className="flex min-h-[100dvh] items-center bg-dark-deep px-5 py-24 md:px-12"
    >
      <div className="mx-auto max-w-4xl">
        <span aria-hidden className="mb-10 block h-px w-16 bg-gold" />
        <p className="manifesto-text font-serif text-[clamp(1.75rem,3.4vw,3.25rem)] leading-[1.35] text-cream">
          We do not list properties. We present landmarks. One residence at
          a time, prepared without compromise, shown to the few for whom it
          was built, and negotiated in complete confidence.
        </p>
      </div>
    </section>
  );
}
