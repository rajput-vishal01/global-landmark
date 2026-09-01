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
 * Portal-style hero: one full-bleed image, everything centred over it, and
 * the search bar as the single obvious thing to do.
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
          .from(".hero-heading", { autoAlpha: 0, y: 18, duration: 0.9 }, 0.35)
          .from(".hero-cats", { autoAlpha: 0, y: 12, duration: 0.7 }, 0.6)
          .from(".hero-search", { autoAlpha: 0, y: 16, duration: 0.8 }, 0.75);
      });
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      className="relative flex min-h-[92dvh] w-full items-center justify-center overflow-hidden bg-dark-deep"
    >
      <div className="hero-img absolute inset-0">
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

      {/* One even scrim rather than a bottom gradient: the content is centred
          now, so the darkening has to be centred too, or the headline lands
          in the brightest part of the photograph. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/65" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-5 pt-20 text-center md:px-8">
        <h1 className="hero-heading text-balance font-serif text-h1 text-cream">
          {HERO.headline.map((line, i) => (
            <span key={line}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>

        <p className="hero-cats text-eyebrow mt-5 font-sans font-semibold uppercase tracking-[0.24em] text-cta">
          {HERO.sub}
        </p>

        <PropertySearch
          withFilters
          placeholder={HERO.searchPlaceholder}
          className="hero-search mt-9 w-full"
          openUpward
        />
      </div>
    </section>
  );
}
