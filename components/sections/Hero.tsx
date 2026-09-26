"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PropertySearch } from "@/components/PropertySearch";
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

  // The load-in is CSS (.hero-img / .hero-heading / .hero-cats / .hero-search
  // in globals.css): it runs on first paint, before any of this hydrates.

  return (
    <section
      // No overflow-hidden here: the search bar's dropdowns are absolutely
      // positioned children of this section and open past its bottom edge,
      // so clipping the section cut every city / type / status list off
      // mid-list. The clip belongs on the image layer, which is the only
      // thing that actually needs it. overflow-x-clip clips sideways only:
      // the intro zoom (scale 1.08) would otherwise make phones scroll
      // horizontally while it plays, and the dropdowns still open downward.
      className="relative flex min-h-[92dvh] w-full items-center justify-center overflow-x-clip bg-dark-deep"
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
