"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Magnetic } from "@/components/ui/Magnetic";
import { useGSAP, gsap, ScrollTrigger, SplitText, EASE_HEAVY } from "@/lib/gsap";

const HERO_IMG =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2400&auto=format&fit=crop";

/**
 * Inset cinematic hero: blurred darkened copy of the image at the edges,
 * sharp image inset within. Load-in: frame settles, gold rule draws,
 * headline rises character-by-character behind a mask, then sub + CTA.
 * While scrolling away, the inner image drifts (subtle parallax).
 */
export function Hero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Intro must never touch .hero-frame — the exit scrub below owns its
        // scale/alpha, and two tweens on one prop desync on scroll-back.
        gsap
          .timeline({ defaults: { ease: EASE_HEAVY } })
          .from(".hero-img", { scale: 1.12, autoAlpha: 0, duration: 2 }, 0)
          .from(".hero-rule", { scaleX: 0, duration: 1, transformOrigin: "left" }, 0.45)
          .from(".hero-sub", { autoAlpha: 0, y: 14, duration: 0.8 }, 1.1)
          .from(".hero-explore", { autoAlpha: 0, duration: 0.8 }, 1.3);

        // Masked char rise; autoSplit re-splits when the display font loads.
        SplitText.create(".hero-heading", {
          type: "chars",
          mask: "chars",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 110,
              duration: 1.1,
              ease: EASE_HEAVY,
              stagger: 0.035,
              delay: 0.55,
            }),
        });

        // Pin the hero while the next section slides over it; the frame
        // recedes (scales down, dims) as it is covered.
        ScrollTrigger.create({
          trigger: scope.current,
          start: "top top",
          end: "+=90%",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(".hero-frame", {
          scale: 0.94,
          autoAlpha: 0.45,
          ease: "none",
          transformOrigin: "center top",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "+=90%",
            scrub: true,
          },
        });
      });
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-dark-deep"
    >
      <Image
        aria-hidden
        src={HERO_IMG}
        alt=""
        fill
        sizes="100vw"
        className="scale-110 object-cover blur-2xl brightness-[0.4]"
      />

      <div className="hero-frame relative mx-4 mb-6 mt-20 flex-1 overflow-hidden md:mx-14 md:mb-9 md:mt-24">
        <div className="hero-img absolute inset-0">
          <Image
            src={HERO_IMG}
            alt="A landmark hillside residence with an infinity pool at golden hour"
            fill
            priority
            sizes="100vw"
            className="scale-105 object-cover"
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/65 via-black/20 to-transparent"
        />

        <span className="hero-rule absolute left-6 top-8 block h-px w-44 bg-gold md:left-14 md:top-12 md:w-60" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-8 px-6 pb-10 md:flex-row md:items-end md:justify-between md:px-14 md:pb-14">
          <div className="max-w-3xl">
            <h1 className="hero-heading text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
              Landmark Living
            </h1>
            <p className="hero-sub text-pretty mt-4 max-w-md text-body font-sans font-light text-cream/85">
              The standard in global luxury real estate, with over $2.4B in
              landmark sales.
            </p>
          </div>

          <Magnetic className="hero-explore">
            <Link
              href="/properties"
              className="group flex w-fit items-center gap-4 bg-white/10 px-8 py-4 backdrop-blur-sm transition-colors duration-500 hover:bg-white/20"
            >
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.25em] text-cream">
                Explore
              </span>
              <svg
                width="32"
                height="10"
                viewBox="0 0 36 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-cream transition-transform duration-500 group-hover:translate-x-1.5"
              >
                <path d="M0 5h34M30 1l4 4-4 4" />
              </svg>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
