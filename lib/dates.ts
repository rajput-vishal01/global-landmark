/**
 * Admin date rendering, in one place.
 *
 * These two shapes had been hand-copied into seven files (the leads and
 * tours inboxes, both CRM detail pages, the pipeline table, the properties
 * table and the property form) and had already drifted: some guarded null
 * and rendered an em dash, others would have formatted it as "Invalid
 * Date". A date on an admin screen is read at a glance and compared across
 * screens, so the two formats live here and nowhere else.
 *
 * en-IN throughout, because the panel is run from Panchkula and "3 Sep
 * 2026" is what a broker there expects to read — not the US month-first
 * order. The public /news grid deliberately keeps its own en-US long-form
 * date; that is editorial styling on a public page, not panel chrome.
 */

type DateInput = Date | string | null | undefined;

/** e.g. "3 Sep 2026". Em dash when there is no date — never "Invalid Date". */
export function formatDate(value: DateInput): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** e.g. "3 Sep 2026, 4:30 pm" — for rows where the time of day matters. */
export function formatDateTime(value: DateInput): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
