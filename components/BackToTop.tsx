"use client";

import { useEffect, useState } from "react";

/** Far enough down that the control never flickers in and out on a short page. */
const SHOW_AFTER_PX = 600;

/**
 * Back-to-top control (Phase G).
 *
 * Bottom-right is crowded: WhatsAppDock's button sits at bottom-12/right-5
 * (bottom-14/right-8 on md) and opens a 288px nudge card *above* itself,
 * and SocialProofTicker runs a 32px strip along the very bottom edge. So
 * this sits to the LEFT of the WhatsApp button on the same row rather than
 * stacked above it — the one free space that collides with neither.
 *
 * This is scroll *state*, not scroll-driven animation: the button appears
 * or it doesn't. Nothing here animates because the page moved.
 */
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll(); // a reload can restore a deep scroll position
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-14 right-[5.5rem] z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-cream/25 bg-navy text-cream shadow-[0_12px_32px_-10px_rgba(16,28,57,0.7)] transition-colors hover:border-cta hover:text-cta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta md:bottom-16 md:right-[6.25rem]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
