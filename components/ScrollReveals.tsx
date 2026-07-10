"use client";

import { useGSAP, gsap, ScrollTrigger, EASE_HEAVY } from "@/lib/gsap";

/**
 * Global scroll engine. Sections opt in with data attributes:
 *   data-reveal      — fade-up on viewport entry (batched, staggered)
 *   data-reveal-img  — inner <img> settles from scale 1.12 to 1
 *   data-unveil      — section scrubs from inset/rounded to full-bleed
 *   data-drift="8"   — scrubbed vertical drift (desktop only)
 * Elements are only hidden by JS at init, so content stays visible if
 * scripts never run. Reduced-motion users get static content.
 */
export function ScrollReveals() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        noPref: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 768px)",
      },
      (context) => {
        const { noPref, desktop } = context.conditions as {
          noPref: boolean;
          desktop: boolean;
        };
        if (!noPref) return;

        const revealEls = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        if (revealEls.length) {
          gsap.set(revealEls, { autoAlpha: 0, y: 32 });
          ScrollTrigger.batch(revealEls, {
            start: "top 88%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                duration: 1,
                ease: EASE_HEAVY,
                stagger: 0.09,
              }),
          });
        }

        gsap.utils.toArray<HTMLElement>("[data-reveal-img]").forEach((wrap) => {
          const img = wrap.querySelector("img");
          if (!img) return;
          gsap.fromTo(
            img,
            { scale: 1.12 },
            {
              scale: 1,
              duration: 1.6,
              ease: EASE_HEAVY,
              scrollTrigger: { trigger: wrap, start: "top 88%", once: true },
            }
          );
        });

        // Scrubbed unveil: section grows from an inset rounded card to
        // full-bleed as it enters (same family as the arch reveal).
        gsap.utils.toArray<HTMLElement>("[data-unveil]").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 0.92, borderRadius: "2.5rem" },
            {
              scale: 1,
              borderRadius: "0rem",
              ease: "none",
              transformOrigin: "center top",
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                end: "top 25%",
                scrub: 1,
              },
            }
          );
        });

        // Columns drifting at different speeds while scrolling through.
        if (desktop) {
          gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
            const amount = Number(el.dataset.drift ?? 6);
            gsap.fromTo(
              el,
              { yPercent: amount },
              {
                yPercent: -amount,
                ease: "none",
                scrollTrigger: {
                  trigger: el.parentElement ?? el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              }
            );
          });
        }
      }
    );
  }, []);

  return null;
}
