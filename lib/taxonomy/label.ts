/**
 * The rule for a label the broker types rather than picks — a property type
 * the list does not name yet, a locality the client's list never had.
 *
 * Deliberately plain: letters, digits, spaces and the punctuation these
 * actually use ("Shop-cum-Office", "SCO / Booth", "PR-7 Road", "Sector 20").
 * Anything else is refused rather than cleaned up silently, so a pasted
 * paragraph cannot become a filter option.
 */
const LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} ./&()'-]*$/u;

export function isCustomLabel(value: string, max: number): boolean {
  const trimmed = value.trim();
  return trimmed.length > 1 && trimmed.length <= max && LABEL_RE.test(trimmed);
}

/** A clean custom label, or null. Inner runs of whitespace collapse to one space. */
export function normaliseCustomLabel(raw: string | null | undefined, max: number): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  return isCustomLabel(value, max) ? value.replace(/\s+/g, " ") : null;
}
