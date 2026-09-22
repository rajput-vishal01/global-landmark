"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useMounted, useOutsideClick } from "@/lib/hooks";

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
  "aria-label": ariaLabel,
}: {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  id?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  /**
   * Accessible name for a select with no visible <label> — the hero's
   * search bar drops its labels for a flush single-row look, so without
   * this its three dropdowns would announce only their current value.
   */
  "aria-label"?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /**
   * Where to draw the open list, in viewport coordinates.
   *
   * The list is portalled to <body> rather than positioned inside this
   * component. It used to be `absolute top-full`, which broke inside any
   * scroll container: CSS computes `overflow-y: visible` to `auto` when the
   * other axis is not visible, so the admin tables’ `overflow-x-auto`
   * wrapper clipped the list and scrolled it instead of letting it overlay
   * the rows. Every per-row dropdown in the panel sat in one of those.
   */
  const [rect, setRect] = useState<DOMRect | null>(null);

  // document.body does not exist during the server render, and reaching for it
  // there is a hydration error rather than a missing dropdown. useMounted is
  // the repo's existing answer to this — Dialog portals the same way.
  const mounted = useMounted();
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  // The list is no longer a descendant of rootRef, so a click on an option
  // reads as "outside" and would close the control before choose() ran.
  useOutsideClick(
    rootRef,
    useCallback((event: PointerEvent) => {
      if (listRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }, [])
  );

  // Measured after paint, so the trigger has its final box, and re-measured
  // while open: the page scrolling under an open list would otherwise strand
  // it where the trigger used to be.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      const el = rootRef.current;
      if (el) setRect(el.getBoundingClientRect());
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [isOpen]);

  function choose(index: number) {
    if (options[index]) {
      setValue(options[index].value);
      onValueChange?.(options[index].value);
    }
    setIsOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      // An open list swallows Escape, so a Select inside a dialog closes its
      // list, not the dialog.
      if (isOpen) e.nativeEvent.stopImmediatePropagation();
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
        aria-label={ariaLabel}
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

      {/* Portalled to <body>, positioned against the trigger's measured box.
          Inline styles rather than utilities because the numbers come from
          getBoundingClientRect at runtime — a computed Tailwind class name is
          one Tailwind never sees in the source and so never generates.
          `mounted` guards the first server render, which has no document.
          z-[70]: above every modal (FormDialog is z-[60]), or a Select inside
          one opens its list behind the dialog. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && rect && (
              <m.ul
                id={listId}
                role="listbox"
                ref={listRef}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25, ease: EASE }}
                style={{
                  position: "fixed",
                  left: rect.left,
                  top: rect.bottom + 4,
                  width: rect.width,
                }}
                className="z-[70] max-h-64 overflow-y-auto border border-border bg-white shadow-[0_18px_44px_-18px_rgba(20,20,20,0.3)]"
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
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
