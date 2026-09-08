"use client";

import { useId, useState } from "react";
import { cardChrome, deskField } from "@/components/admin/desk";

/**
 * The field chrome every admin form wears, in one place.
 *
 * These replace `FIELD` / `LABEL` from components/form-classes.tsx, which is
 * shared with the PUBLIC contact and newsletter forms and therefore cannot be
 * re-skinned to the desk. Same two names, admin-only values.
 */

/** Inputs, textareas, selects. `w-full` because every admin field fills its column. */
export const deskFieldFull = `${deskField} w-full`;

/** Field labels — the same face as KpiTile's label, so a form reads like the rest of the desk. */
export const deskLabel =
  "text-[11px] font-semibold uppercase tracking-[0.1em] text-muted";

/** Helper text under a field. */
export const deskHint = "text-[11.5px] text-muted";

/** Validation and failure text. */
export const deskErrorText = "text-[12px] text-error";

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
    // `cardChrome` rather than <Card>: a Card's own p-4 would put the padding
    // outside <summary>, shrinking the click target that opens the section.
    // Same shadow, same radius, same ground — the padding just lives on the
    // two halves instead of the box.
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className={`${cardChrome} overflow-hidden`}
    >
      <summary
        // The marker is replaced by our own chevron below.
        className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden"
        aria-controls={id}
      >
        {/* `desk-eyebrow` carries a 10px bottom margin from globals.css, and
            that rule is unlayered so no Tailwind utility can beat it — the
            wrapper cancels it instead, which is also what keeps a section
            with no hint from sitting 10px off-centre. */}
        <span className={`flex min-w-0 flex-col ${hint ? "" : "-mb-2.5"}`}>
          <span className="desk-eyebrow">{title}</span>
          {hint && <span className="-mt-1.5 text-[11.5px] text-muted">{hint}</span>}
        </span>

        <span className="flex shrink-0 items-center gap-3">
          {showCount && (
            <span
              className={`text-[11.5px] tabular-nums ${
                complete ? "text-gold-deep" : "text-muted"
              }`}
            >
              {filled}/{total}
            </span>
          )}
          <span
            aria-hidden
            className={`text-muted transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </span>
      </summary>

      <div id={id} className="flex flex-col gap-6 border-t border-line-soft px-4 pb-5 pt-5">
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
