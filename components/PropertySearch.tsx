"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useOutsideClick } from "@/lib/hooks";
import { Select } from "@/components/ui/Select";
import { POSSESSION_STATUSES, PROPERTY_TYPES, withEmptyOption } from "@/lib/attributes";
import { CITY_NAMES } from "@/lib/locations";

type Result = {
  type?: "property" | "project";
  slug: string;
  title: string;
  location: string;
  category: string;
  image: string | null;
};

// The dropdowns reuse the shared taxonomies rather than copying them, so a
// new city or property type shows up here the moment it lands in
// lib/taxonomy. "Status" is possession (Ready to Move / Under Construction
// / ...) — the listing-lifecycle statuses are internal and never public.
const CITY_OPTIONS = withEmptyOption("Any city", CITY_NAMES);
const TYPE_OPTIONS = withEmptyOption("Any type", PROPERTY_TYPES);
const STATUS_OPTIONS = withEmptyOption("Any status", POSSESSION_STATUSES);

/**
 * Debounced portfolio search against /api/search. Combobox keyboard
 * pattern: arrows move, Enter opens, Escape closes.
 *
 * With `withFilters` it also renders the hero search bar the client asked
 * for — City / Property Type / Status beside the keyword box — submitting
 * to /properties as a plain GET form, so it degrades to a working search
 * with JS disabled instead of relying on router navigation.
 */
export function PropertySearch({
  tone = "light",
  placeholder = "Search the portfolio",
  className = "",
  openUpward = false,
  withFilters = false,
}: {
  tone?: "light" | "dark";
  placeholder?: string;
  className?: string;
  /** Open results above the input — needed inside overflow-clipped heroes. */
  openUpward?: boolean;
  /** Wrap the input in the City/Type/Status filter bar with a submit button. */
  withFilters?: boolean;
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
      go(results[activeIndex]);
    }
  }

  function go(result: Result) {
    setIsOpen(false);
    setQuery("");
    router.push(result.type === "project" ? `/projects/${result.slug}` : `/properties/${result.slug}`);
  }

  // A GET form posts every field, empty ones included, which would leave
  // "?city=&type=&possession=" on a page that rebuilds its own filter links
  // from the parsed values. Drop the empties when JS is around; without it
  // the native submit still lands on the right listing, just a uglier URL.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    new FormData(e.currentTarget).forEach((value, key) => {
      if (typeof value === "string" && value) params.set(key, value);
    });
    setIsOpen(false);
    router.push(`/properties${params.size ? `?${params}` : ""}`);
  }

  // The filter bar is a white panel, so its input keeps the light tone even
  // when the hero behind it is dark.
  const isDark = tone === "dark" && !withFilters;
  const inputTone = isDark
    ? "border-cream/30 text-cream placeholder:text-cream/50 focus:border-gold"
    : "border-border text-ink placeholder:text-ink-muted/60 focus:border-gold";

  const keywordField = (
    <div ref={rootRef} className={`relative ${withFilters ? "" : className}`}>
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
        {/* `name` is set only in the filter-bar form, so the keyword joins
            city/type/status in the submitted query and actually filters the
            grid. The menu variant is a jump-straight-to-the-property
            dropdown with no form around it, where a name would do nothing. */}
        <input
          id={`${listId}-keyword`}
          name={withFilters ? "q" : undefined}
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
                    onClick={() => go(result)}
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

  if (!withFilters) return keywordField;

  return (
    <form
      action="/properties"
      method="get"
      aria-label="Search the portfolio"
      onSubmit={onSubmit}
      className={`overflow-hidden bg-surface shadow-[0_24px_60px_-28px_rgba(20,20,20,0.55)] ${className}`}
    >
      {/* One flush horizontal bar, not a card of labelled fields.
          Deliberate: on a property portal this bar is the primary action of
          the whole page, and stacking labels above four boxes made it read
          as a form to fill in rather than a thing to use. Each control keeps
          an accessible label via aria-label instead, and the dividers do the
          visual separating that the labels used to.

          Stacks on phones (four full-width rows plus the button), becomes
          the single row at lg. */}
      <div className="flex flex-col md:flex-row md:items-stretch">
        <div className="flex-1 border-b border-border px-4 py-1 md:border-b-0 md:border-r">
          {keywordField}
        </div>
        <div className="border-b border-border px-4 py-2.5 md:w-36 md:border-b-0 md:border-r lg:w-44">
          <Select
            id={`${listId}-city`}
            name="city"
            aria-label="City"
            options={CITY_OPTIONS}
          />
        </div>
        <div className="border-b border-border px-4 py-2.5 md:w-40 md:border-b-0 md:border-r lg:w-52">
          <Select
            id={`${listId}-type`}
            name="type"
            aria-label="Property type"
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="border-b border-border px-4 py-2.5 md:w-40 md:border-b-0 md:border-r lg:w-48">
          <Select
            id={`${listId}-status`}
            name="possession"
            aria-label="Property status"
            options={STATUS_OPTIONS}
          />
        </div>
        <button
          type="submit"
          className="text-eyebrow cursor-pointer bg-cta px-10 py-4 font-sans font-semibold uppercase tracking-[0.2em] text-cta-ink transition-colors duration-200 hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:py-0"
        >
          Search
        </button>
      </div>
    </form>
  );
}
