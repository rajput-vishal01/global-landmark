"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useMounted, useOutsideClick } from "@/lib/hooks";

type Option = { value: string; label: string };

/**
 * A Select with a search box and, optionally, an "Add" row for a value that
 * is not on the list yet.
 *
 * Why not just the datalist input it replaces: a datalist filters and accepts
 * a typed value, but says none of that on screen — the broker saw a dropdown
 * and assumed the list was all they could have. This says both out loud.
 *
 * Positioning, the hidden input and the Escape handling are lifted from
 * components/ui/Select.tsx for the reasons documented there (portalled list
 * so a scroll container cannot clip it; the hidden input written imperatively
 * so an auto-submitting form posts the value just chosen).
 */
export function ComboBox({
  name,
  options,
  defaultValue = "",
  id,
  className = "",
  placeholder = "Select",
  searchPlaceholder = "Search...",
  emptyLabel,
  allowCustom = false,
  maxLength = 60,
  onValueChange,
  "aria-label": ariaLabel,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  id?: string;
  className?: string;
  /** Shown on the trigger while nothing is chosen. */
  placeholder?: string;
  searchPlaceholder?: string;
  /** When set, an explicit "none" row with an empty value, e.g. "— Any —". */
  emptyLabel?: string;
  /** Offer "Add <what was typed>" when the search matches nothing exactly. */
  allowCustom?: boolean;
  maxLength?: number;
  onValueChange?: (value: string) => void;
  "aria-label"?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const mounted = useMounted();
  const listId = useId();

  const all: Option[] = emptyLabel ? [{ value: "", label: emptyLabel }, ...options] : options;
  const q = query.trim().toLowerCase();
  const matches = q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all;
  const typed = query.trim().replace(/\s+/g, " ");
  const canAdd =
    allowCustom &&
    typed.length > 1 &&
    !all.some((o) => o.label.toLowerCase() === typed.toLowerCase());
  // The add row sits at the top: when it exists it is what the typing was for.
  const rows: Option[] = canAdd ? [{ value: typed, label: `Add “${typed}”` }, ...matches] : matches;

  const selected = all.find((o) => o.value === value);

  useOutsideClick(
    rootRef,
    useCallback((event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }, [])
  );

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

  function open() {
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  }

  function choose(next: string | undefined) {
    if (next !== undefined) {
      setValue(next);
      if (hiddenRef.current) hiddenRef.current.value = next;
      onValueChange?.(next);
    }
    setIsOpen(false);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }

  function onSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      // Swallow it, or a ComboBox inside a dialog closes the dialog too.
      e.nativeEvent.stopImmediatePropagation();
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (rows.length ? (prev + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (rows.length ? (prev - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter") {
      // Inside a form, Enter here must not submit it.
      e.preventDefault();
      choose(rows[activeIndex]?.value);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input ref={hiddenRef} type="hidden" name={name} value={value} readOnly />
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={onTriggerKeyDown}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-border bg-transparent py-2.5 text-left font-sans text-body text-ink transition-colors focus:border-gold focus:outline-none"
      >
        {/* A custom value is not in `options`, so it falls through to `value`
            itself — the control must show what was typed, not "Select". */}
        <span className={`truncate ${value ? "" : "text-ink-muted"}`}>
          {selected?.label || value || placeholder}
        </span>
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

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && rect && (
              <m.div
                ref={panelRef}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2, ease: EASE }}
                style={{
                  position: "fixed",
                  left: rect.left,
                  top: rect.bottom + 4,
                  width: rect.width,
                }}
                className="z-[70] border border-border bg-white shadow-[0_18px_44px_-18px_rgba(20,20,20,0.3)]"
              >
                <input
                  // autoFocus, not a ref + effect: the panel mounts a tick
                  // after isOpen flips (it waits on the measured rect), so an
                  // effect keyed on isOpen finds no input to focus yet.
                  autoFocus
                  type="text"
                  value={query}
                  maxLength={maxLength}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder={allowCustom ? `${searchPlaceholder} or type a new one` : searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="w-full border-b border-border bg-transparent px-4 py-2.5 font-sans text-meta text-ink placeholder:text-ink-muted/70 focus:outline-none"
                />
                <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto">
                  {rows.length === 0 ? (
                    <li className="px-4 py-3 font-sans text-meta text-ink-muted">
                      {allowCustom ? "Type at least two letters to add it." : "Nothing matches."}
                    </li>
                  ) : (
                    rows.map((row, i) => {
                      const isSelected = row.value === value && !(canAdd && i === 0);
                      return (
                        <li key={`${row.value}-${i}`} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => choose(row.value)}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left font-sans text-meta transition-colors duration-150 ${
                              i === activeIndex ? "bg-cream" : "bg-white"
                            } ${canAdd && i === 0 ? "font-medium text-gold-deep" : isSelected ? "text-gold-deep" : "text-ink"}`}
                          >
                            {row.label}
                            {isSelected && <span aria-hidden className="h-px w-4 bg-gold" />}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
