"use client";

import { useState } from "react";
import { useMounted } from "@/lib/hooks";

/**
 * Slim scrolling activity strip along the bottom edge. Entries are
 * randomized placeholder data by design (client request) — they signal an
 * active desk, not real transactions. Generated client-side only.
 */

import { TICKER } from "@/lib/data";

const AGO = ["just now", "2 min ago", "6 min ago", "11 min ago", "19 min ago", "27 min ago"];

const TICKER_DISMISS_KEY = "gld-ticker-dismissed";

function buildItems(): string[] {
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
  return Array.from({ length: 10 }, () => {
    const event = pick(TICKER.events).replace("{p}", pick(TICKER.properties));
    return `${pick(TICKER.names)} ${event} · ${pick(AGO)}`;
  });
}

export function SocialProofTicker() {
  // Hydration-safe client gate; the pre-mount render is null on both sides,
  // so the randomized items never have to match server markup.
  const mounted = useMounted();
  const [items] = useState(buildItems);
  const [isDismissed, setIsDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(sessionStorage.getItem(TICKER_DISMISS_KEY))
  );

  if (!mounted || isDismissed) return null;

  return (
    <aside
      aria-label="Recent activity"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/25 bg-dark-deep/90 text-[0.75rem] leading-none backdrop-blur-md"
    >
      <div className="flex h-8 items-center">
        <span className="hidden h-full shrink-0 items-center gap-2 border-r border-cream/10 px-3 font-sans text-[0.625rem] font-medium uppercase tracking-[0.25em] text-gold-highlight/90 sm:flex">
          <span aria-hidden className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
          </span>
          Activity
        </span>

        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
          <div className="animate-ticker flex w-max items-center hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex items-center">
                {items.map((item, i) => (
                  <span
                    key={`${copy}-${i}`}
                    className="flex items-center whitespace-nowrap px-5 font-sans text-cream/75"
                  >
                    {item}
                    <span aria-hidden className="ml-10 block h-2.5 w-px rotate-12 bg-gold/40" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Dismiss activity ticker"
          onClick={() => {
            sessionStorage.setItem(TICKER_DISMISS_KEY, "1");
            setIsDismissed(true);
          }}
          className="flex h-full shrink-0 cursor-pointer items-center border-l border-cream/10 px-2.5 text-cream/50 transition-colors hover:text-cream"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l16 16M20 4L4 20" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
