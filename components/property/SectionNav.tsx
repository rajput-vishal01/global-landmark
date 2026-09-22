"use client";

import { useEffect, useState } from "react";

/**
 * The property page's sticky jump bar. Plain anchors (they work before
 * hydration and with JS off); the only script is the highlight, which
 * follows whichever section is crossing the upper third of the screen.
 */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -65% 0px" }
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      // Flush under the site header (77px tall at every width) — any gap
      // between the two lets the page scroll through visibly.
      className="sticky top-[76px] z-30 mt-8 border-b border-border bg-surface md:mt-10"
    >
      <ul className="flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] md:gap-9 md:px-12 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={`text-eyebrow block border-b-2 py-4 font-sans font-semibold uppercase tracking-[0.16em] transition-colors ${
                active === item.id
                  ? "border-gold text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
