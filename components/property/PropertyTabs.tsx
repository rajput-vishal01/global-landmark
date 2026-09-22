"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type PropertyTab = {
  id: string;
  label: string;
  panel: ReactNode;
};

/**
 * The detail page's in-page tab bar (Phase E).
 *
 * Panels, not scroll-to-anchor. The brief allows either, and panels are the
 * option that does not need a scroll listener: highlighting the right tab
 * while the page scrolls is scroll-driven behaviour, and Phase A removed
 * every one of those. Switching here is a click and nothing else moves.
 *
 * Every panel stays MOUNTED and is hidden with the `hidden` attribute rather
 * than unmounted. Switching to Amenities and back must not wipe half a
 * filled-in tour request, and `hidden` keeps the content out of the
 * accessibility tree and out of find-in-page for free.
 *
 * The strip is `sticky`, which is layout, not animation — it offsets by the
 * fixed header's height so it parks under it instead of behind it, and
 * scrolls sideways on a phone rather than wrapping to two rows.
 */
export function PropertyTabs({ tabs }: { tabs: PropertyTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const stripRef = useRef<HTMLDivElement>(null);

  // A link to "#<tab id>" elsewhere on the page (the side rail’s "Schedule
  // a site visit") opens that tab and brings it into view.
  useEffect(() => {
    function openFromHash() {
      const id = window.location.hash.slice(1);
      if (!tabs.some((t) => t.id === id)) return;
      setActive(id);
      stripRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [tabs]);

  if (tabs.length === 0) return null;

  /** Arrow keys move between tabs — the expected behaviour for a tablist. */
  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const index = tabs.findIndex((t) => t.id === active);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setActive(next.id);
    stripRef.current
      ?.querySelector<HTMLButtonElement>(`#tab-${CSS.escape(next.id)}`)
      ?.focus();
  }

  return (
    <div className="flex flex-col">
      <div
        ref={stripRef}
        role="tablist"
        aria-label="Property details"
        onKeyDown={onKeyDown}
        // The bottom rule is an inset shadow, not a border, and the active
        // tab's underline sits inside the box rather than on top of it with
        // a negative margin. Overflowing by that one pixel is enough to give
        // the strip a vertical scrollbar: `overflow-x: auto` forces
        // `overflow-y` to compute to `auto` as well, per the CSS spec.
        className="sticky top-[4.5rem] z-30 -mx-5 flex gap-7 overflow-x-auto bg-surface px-5 shadow-[inset_0_-1px_0_var(--color-border)] md:top-24 md:mx-0 md:px-0"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`text-eyebrow shrink-0 cursor-pointer whitespace-nowrap border-b-2 py-4 font-sans font-medium uppercase tracking-[0.15em] transition-colors ${
                isActive
                  ? "border-gold text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-12"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
