"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useOutsideClick } from "@/lib/hooks";

type Result = {
  slug: string;
  title: string;
  location: string;
  category: string;
  image: string | null;
};

/**
 * Debounced portfolio search against /api/search. Combobox keyboard
 * pattern: arrows move, Enter opens, Escape closes.
 */
export function PropertySearch({
  tone = "light",
  placeholder = "Search the portfolio",
  className = "",
  openUpward = false,
}: {
  tone?: "light" | "dark";
  placeholder?: string;
  className?: string;
  /** Open results above the input — needed inside overflow-clipped heroes. */
  openUpward?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced fetch; aborts stale requests. State updates happen inside the
  // timer callback, never synchronously in the effect body.
  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        if (q.length < 2) {
          setResults([]);
          setIsOpen(false);
          return;
        }
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          });
          if (!res.ok) return;
          const data = (await res.json()) as { results: Result[] };
          setResults(data.results);
          setActiveIndex(-1);
          setIsOpen(true);
        } catch {
          // aborted or offline — dropdown simply stays closed
        }
      },
      q.length < 2 ? 0 : 250
    );
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useOutsideClick(
    rootRef,
    useCallback(() => setIsOpen(false), [])
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      go(results[activeIndex].slug);
    }
  }

  function go(slug: string) {
    setIsOpen(false);
    setQuery("");
    router.push(`/properties/${slug}`);
  }

  const isDark = tone === "dark";
  const inputTone = isDark
    ? "border-cream/30 text-cream placeholder:text-cream/50 focus:border-gold"
    : "border-border text-ink placeholder:text-ink-muted/60 focus:border-gold";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <svg
          aria-hidden
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 ${
            isDark ? "text-cream/60" : "text-ink-muted"
          }`}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search properties"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full appearance-none rounded-none border-b bg-transparent py-3 pl-7 font-sans text-meta tracking-wide outline-none transition-colors duration-300 [&::-webkit-search-cancel-button]:hidden ${inputTone}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <m.ul
            id={listId}
            role="listbox"
            aria-label="Matching properties"
            initial={{ opacity: 0, y: openUpward ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUpward ? -8 : 8 }}
            transition={{ duration: 0.35, ease: EASE }}
            data-lenis-prevent
            className={`absolute left-0 right-0 z-40 max-h-96 overflow-y-auto border border-border bg-white shadow-[0_24px_60px_-24px_rgba(20,20,20,0.35)] ${
              openUpward ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {results.length === 0 ? (
              <li className="px-5 py-4 text-meta font-sans text-ink-muted">
                Nothing in the portfolio matches that yet.
              </li>
            ) : (
              results.map((result, i) => (
                <li key={result.slug} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    onClick={() => go(result.slug)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full cursor-pointer items-center gap-4 px-4 py-3 text-left transition-colors duration-200 ${
                      i === activeIndex ? "bg-cream" : "bg-white"
                    }`}
                  >
                    <span className="relative block h-12 w-16 shrink-0 overflow-hidden bg-ink/5">
                      {result.image && (
                        <Image
                          src={result.image}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-body text-ink">
                        {result.title}
                      </span>
                      <span className="block truncate text-meta font-sans text-ink-muted">
                        {result.location}
                      </span>
                    </span>
                    <span className="text-eyebrow shrink-0 font-sans font-medium uppercase tracking-[0.18em] text-gold-deep">
                      {result.category}
                    </span>
                  </button>
                </li>
              ))
            )}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
