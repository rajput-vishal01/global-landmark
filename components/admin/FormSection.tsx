"use client";

import { useId, useState } from "react";

/**
 * One collapsible group of the CFF form, with a filled/total count in the
 * header so a broker can see at a glance what a listing is still missing
 * without opening all twenty sections.
 *
 * Built on native <details>/<summary>: it is open/closed state the browser
 * already owns, keyboard-operable and screen-reader-announced for free, and
 * it keeps working before hydration — which matters on a phone at a site
 * visit on a bad connection. No animation: this is the admin (see
 * docs/ANIMATION_GUIDELINES.md — the motion system is for the public site).
 *
 * `filled` is passed in rather than derived here, because only the parent
 * knows which of its inputs are controlled and which are uncontrolled
 * defaults.
 */
export function FormSection({
  title,
  hint,
  filled,
  total,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  /** How many of this section's fields currently carry a value. */
  filled?: number;
  total?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  const showCount = typeof filled === "number" && typeof total === "number";
  const complete = showCount && filled === total && total > 0;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className="border border-border bg-white"
    >
      <summary
        // The marker is replaced by our own chevron below.
        className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden"
        aria-controls={id}
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink">
            {title}
          </span>
          {hint && (
            <span className="font-sans text-meta text-ink-muted">{hint}</span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-3">
          {showCount && (
            <span
              className={`font-sans text-meta tabular-nums ${
                complete ? "text-gold-deep" : "text-ink-muted"
              }`}
            >
              {filled}/{total}
            </span>
          )}
          <span
            aria-hidden
            className={`text-ink-muted transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </span>
      </summary>

      <div id={id} className="flex flex-col gap-6 border-t border-border px-5 py-6">
        {children}
      </div>
    </details>
  );
}

/**
 * Counts how many values in a group are actually set, for the header count.
 * Empty strings, empty arrays, null and undefined are all "not filled";
 * `false` and `0` are legitimate answers and count as filled.
 */
export function countFilled(values: unknown[]): number {
  return values.filter((v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
}
