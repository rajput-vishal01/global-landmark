"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useId, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useOutsideClick } from "@/lib/hooks";

type SelectOption = { value: string; label: string };

/**
 * Styled replacement for native selects — the browser popup can't be
 * themed, so the whole control is custom. Listbox ARIA + arrow-key nav;
 * value is submitted via a hidden input.
 */
export function Select({
  name,
  options,
  defaultValue,
  id,
  className = "",
  onValueChange,
}: {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  id?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useOutsideClick(
    rootRef,
    useCallback(() => setIsOpen(false), [])
  );

  function choose(index: number) {
    if (options[index]) {
      setValue(options[index].value);
      onValueChange?.(options[index].value);
    }
    setIsOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(activeIndex);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={onKeyDown}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-border bg-transparent py-2.5 text-left font-sans text-body text-ink transition-colors focus:border-gold focus:outline-none"
      >
        <span className="truncate">{selected?.label ?? "Select"}</span>
        <svg
          aria-hidden
          width="11"
          height="7"
          viewBox="0 0 12 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          className={`shrink-0 text-ink-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M1 1.5l5 5 5-5" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.ul
            id={listId}
            role="listbox"
            data-lenis-prevent
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border border-border bg-white shadow-[0_18px_44px_-18px_rgba(20,20,20,0.3)]"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => choose(i)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left font-sans text-meta transition-colors duration-150 ${
                      i === activeIndex ? "bg-cream" : "bg-white"
                    } ${isSelected ? "text-gold-deep" : "text-ink"}`}
                  >
                    {option.label}
                    {isSelected && (
                      <span aria-hidden className="h-px w-4 bg-gold" />
                    )}
                  </button>
                </li>
              );
            })}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
