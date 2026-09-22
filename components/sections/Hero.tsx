"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PropertySearch } from "@/components/PropertySearch";
import { useGSAP, gsap, EASE_HEAVY } from "@/lib/gsap";
import { HERO } from "@/lib/data";

const SLIDES = HERO.slides;

const ROTATE_MS = 6000;

// Non-active slides mount only after the LCP image has had the bandwidth to
// itself — well before the first 6s rotation.
const WARM_DELAY_MS = 2500;

const CROSSFADE =
  "object-cover transition-opacity duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]";

/**
 * Editorial hero (Sep 2026 redesign): the headline and the search anchored
 * bottom-left over the photograph, with slide markers on the right. It
 * was centred portal-style before; the search bar is still the single
 * obvious thing to do, it is just where the eye lands after the headline.
 *
 * This replaced an inset "cinematic" frame that put the headline bottom-left
 * with the search tucked underneath. The client compared us against a
 * conventional property portal and asked for that read instead, and they
 * were right about the substance: on a portal the search bar IS the hero,
 * and putting it in a corner under a wordmark makes people scroll looking
 * for the thing they arrived to do.
 *
 * The four intent categories survive the redesign as the eyebrow row under
 * the headline. The reference puts a static label in that slot; ours earns
 * the space by both switching the backdrop and linking into the portfolio,
 * so the feature is kept rather than dropped for symmetry.
 */
export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [warm, setWarm] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setWarm(true), WARM_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  // Auto-advance only. The intent categories that used to sit under the
  // headline (and switched the backdrop on hover) were removed at the
  // client's request, so nothing competes with the timer any more and the
  // pause-on-hover it needed went with them.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setActive((prev) => (prev + 1) % SLIDES.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, []);

  // Load-in only. Nothing here is scroll-driven — the scroll engine went in
  // the Phase A motion cull and must not creep back.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: EASE_HEAVY } })
          .fromTo(
            ".hero-img",
            { scale: 1.08, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 1.2 },
            0
          )
          // fromTo, not from: a `from` tween that is interrupted before it
          // plays — a killed context on a fast re-render, a throttled
          // background tab — leaves its target parked at the FROM values,
          // which here means an invisible headline and an invisible search
          // bar over a photograph. Naming the end state explicitly means the
          // worst case is an un-animated hero rather than an empty one.
          .fromTo(
            ".hero-heading",
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.9 },
            0.35
          )
          .fromTo(
            ".hero-cats",
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.7 },
            0.6
          )
          .fromTo(
            ".hero-search",
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.8 },
            0.75
          );
      });
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      // No overflow-hidden here: the search bar's dropdowns are absolutely
      // positioned children of this section and open past its edge, so
      // clipping the section cut every list off. The image layer clips.
      className="relative flex min-h-[94dvh] w-full items-end bg-dark-deep"
    >
      <div className="hero-img absolute inset-0 overflow-hidden">
        {SLIDES.map(
          (slide, i) =>
            (i === 0 || warm) && (
              <Image
                key={slide.category}
                src={slide.img}
                alt={i === active ? slide.alt : ""}
                fill
                priority={i === 0}
                sizes="100vw"
                className={`${CROSSFADE} ${i === active ? "opacity-100" : "opacity-0"}`}
              />
            )
        )}
      </div>

      {/* Two fades instead of one flat wash: dark behind the text on the
          left, dark along the bottom for the search, and the photograph
          left clear on the right, where nothing sits on it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"
      />

      <div className="relative z-10 w-full px-5 pb-12 pt-32 md:px-12 md:pb-16">
        <div className="max-w-4xl">
          <p className="hero-cats text-eyebrow flex items-center gap-3 font-sans font-semibold uppercase tracking-[0.28em] text-cta">
            <span aria-hidden className="h-px w-10 bg-cta" />
            {HERO.sub}
          </p>
          <h1 className="hero-heading mt-6 text-balance font-serif text-[clamp(3rem,7vw+1rem,7.5rem)] leading-[0.95] text-cream">
            {HERO.headline.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="font-serif italic text-gold-highlight">{line}</em> : line}
              </span>
            ))}
          </h1>
        </div>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <PropertySearch
            withFilters
            placeholder={HERO.searchPlaceholder}
            className="hero-search w-full max-w-4xl"
            openUpward
          />

          {/* Slide markers: which photograph this is, and a way to pick one.
              The timer keeps running; a click just moves it along. */}
          <div className="hero-cats flex shrink-0 items-end gap-5" aria-label="Choose a photograph">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.category}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photograph ${i + 1}: ${slide.alt}`}
                aria-pressed={i === active}
                className="group flex cursor-pointer flex-col items-start gap-2"
              >
                <span
                  className={`font-sans text-meta font-semibold tabular-nums transition-colors ${
                    i === active ? "text-cream" : "text-cream/45 group-hover:text-cream/80"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className={`h-px transition-all duration-500 ${
                    i === active ? "w-12 bg-cta" : "w-6 bg-cream/40 group-hover:bg-cream/70"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
