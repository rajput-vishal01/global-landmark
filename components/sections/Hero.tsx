"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Magnetic } from "@/components/ui/Magnetic";
import { PropertySearch } from "@/components/PropertySearch";
import { useGSAP, gsap, ScrollTrigger, SplitText, EASE_HEAVY } from "@/lib/gsap";
import { HERO } from "@/lib/data";

const SLIDES = HERO.slides;

const ROTATE_MS = 6000;

/**
 * Inset cinematic hero: blurred darkened copy of the image at the edges,
 * sharp image inset within. Load-in: frame settles, gold rule draws,
 * headline rises character-by-character behind a mask, then sub + CTA.
 * The imagery rotates through the four engagement categories; the strip
 * above the headline switches it directly and links into the portfolio.
 */
export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance; manual selection resets by re-running the effect.
  useEffect(() => {
    if (isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setActive((prev) => (prev + 1) % SLIDES.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [isPaused, active]);

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
          .from(".hero-cats", { autoAlpha: 0, y: 14, duration: 0.8 }, 0.9)
          .from(".hero-sub", { autoAlpha: 0, y: 14, duration: 0.8 }, 1.1)
          .from(".hero-search", { autoAlpha: 0, y: 14, duration: 0.8 }, 1.25)
          .from(".hero-explore", { autoAlpha: 0, duration: 0.8 }, 1.4);

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
      {/* Blurred backdrop tracks the active slide — same URLs as the inset
          images, so the browser serves them from cache. */}
      {SLIDES.map((slide, i) => (
        <Image
          key={`bg-${slide.category}`}
          aria-hidden
          src={slide.img}
          alt=""
          fill
          sizes="100vw"
          className={`scale-110 object-cover blur-2xl brightness-[0.4] transition-opacity duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="hero-frame relative mx-4 mb-6 mt-20 flex-1 overflow-hidden md:mx-14 md:mb-9 md:mt-24">
        <div className="hero-img absolute inset-0">
          {SLIDES.map((slide, i) => (
            <Image
              key={slide.category}
              src={slide.img}
              alt={i === active ? slide.alt : ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`scale-105 object-cover transition-opacity duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {/* Legibility scrim: soft global darken + stronger lift at the base */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/30" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/65 via-black/20 to-transparent"
        />

        <span className="hero-rule absolute left-6 top-8 block h-px w-44 bg-gold md:left-14 md:top-12 md:w-60" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 px-5 pb-8 md:flex-row md:items-end md:justify-between md:gap-8 md:px-14 md:pb-14">
          <div className="max-w-3xl">
            <nav
              aria-label="Browse the portfolio by intent"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="hero-cats mb-5 flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              {SLIDES.map((slide, i) => (
                <Link
                  key={slide.category}
                  href={`/properties?category=${slide.category}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={`text-eyebrow group relative pb-1 font-sans font-medium uppercase tracking-[0.25em] transition-colors duration-500 ${
                    i === active ? "text-cream" : "text-cream/45 hover:text-cream/80"
                  }`}
                >
                  {slide.label}
                  <span
                    aria-hidden
                    className={`absolute bottom-0 left-0 h-px w-full origin-left bg-gold transition-transform duration-700 ease-out ${
                      i === active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <h1 className="hero-heading text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
              {HERO.headline.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </h1>
            <p className="hero-sub text-pretty mt-4 max-w-md text-body font-sans font-light text-cream/85">
              {HERO.sub}
            </p>
            <PropertySearch
              tone="dark"
              placeholder={HERO.searchPlaceholder}
              className="hero-search mt-6 max-w-md"
              openUpward
            />
          </div>

          <Magnetic className="hero-explore">
            <Link
              href="/properties"
              className="group flex w-fit items-center gap-4 bg-white/10 px-8 py-4 backdrop-blur-sm transition-colors duration-500 hover:bg-white/20"
            >
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.25em] text-cream">
                {HERO.exploreLabel}
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
