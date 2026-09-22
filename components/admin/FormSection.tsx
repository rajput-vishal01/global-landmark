"use client";

import { useId, useState } from "react";
import { cardChrome, deskField } from "@/components/admin/desk";
import { Req } from "@/components/ui/RequiredMark";

/**
 * The field chrome every admin form wears, in one place.
 *
 * These replace `FIELD` / `LABEL` from components/form-classes.tsx, which is
 * shared with the PUBLIC contact and sell forms and therefore cannot be
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

/** Who can see what a section holds — said once, in its header. */
export type SectionVisibility = "public" | "internal";

/**
 * One group of an admin form: a card with a numbered header, a plain line
 * of what belongs in it, and — on the property form — whether what it holds
 * is shown on the public site or stays in the admin. That last tag is the
 * point: a broker should never have to guess whether a field is published.
 *
 * Built on native <details>/<summary>: open/closed state the browser
 * already owns, keyboard-operable and announced for free, and working before
 * hydration. An `id` makes it a jump target — opening it from the form's
 * section list fires `toggle`, which syncs the state below.
 */
export function FormSection({
  id,
  index,
  title,
  hint,
  visibility,
  defaultOpen = false,
  required = false,
  children,
}: {
  id?: string;
  /** Step number, shown before the title. */
  index?: number;
  title: string;
  hint?: string;
  visibility?: SectionVisibility;
  /** Marks the section itself as mandatory, for a field with no label of its own (Photos). */
  required?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <details
      id={id}
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      className={`${cardChrome} scroll-mt-6 overflow-hidden`}
    >
      <summary
        // The marker is replaced by our own chevron below.
        className="flex cursor-pointer list-none items-start gap-3.5 px-5 py-4 transition-colors hover:bg-raise/60 [&::-webkit-details-marker]:hidden"
        aria-controls={bodyId}
      >
        {typeof index === "number" && (
          <span
            aria-hidden
            className={`mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11.5px] font-semibold tabular-nums transition-colors ${
              open ? "border-gold bg-gold/10 text-gold-deep" : "border-line text-muted"
            }`}
          >
            {index}
          </span>
        )}

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-[14.5px] font-semibold text-ink">
              {title}
              {required && <Req />}
            </span>
            {visibility && <VisibilityTag visibility={visibility} />}
          </span>
          {hint && <span className="text-[12px] leading-snug text-muted">{hint}</span>}
        </span>

        <span className="mt-1 flex shrink-0 items-center gap-3">
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>

      <div id={bodyId} className="flex flex-col gap-6 border-t border-line-soft px-5 pb-6 pt-5">
        {children}
      </div>
    </details>
  );
}

function VisibilityTag({ visibility }: { visibility: SectionVisibility }) {
  const isPublic = visibility === "public";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.08em] ${
        isPublic ? "bg-gold/12 text-gold-deep" : "bg-ink/[0.06] text-soft"
      }`}
    >
      <svg aria-hidden width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {isPublic ? (
          <>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </>
        )}
      </svg>
      {isPublic ? "On the website" : "Admin only"}
    </span>
  );
}
