/** Shared form styles (public contact form + admin panel forms). */
export const LABEL =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink";

/**
 * `appearance-none rounded-none` normalises native selects and date inputs,
 * which otherwise arrive with the OS's own chrome and rounded corners — at
 * odds with the square hairline aesthetic everywhere else. `w-full` was
 * previously only on PropertyForm's private copy of this string; folding it
 * in here is what let that copy go away.
 */
export const FIELD =
  "w-full appearance-none rounded-none border-b border-border bg-transparent py-2 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none";

/**
 * Boxed fields for the public forms that stand on their own page (Sell,
 * Contact). The underline FIELD above reads as a page of loose lines on a
 * long form; a visitor filling in several fields needs to see where each
 * one starts and ends. Admin forms keep their own desk styles.
 */
export const BOXED_FIELD =
  "w-full rounded-none border border-border bg-white px-4 py-3 font-sans text-body text-ink placeholder:text-ink-muted/60 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20";

/** The custom Select, boxed to match BOXED_FIELD: its own trigger underline is dropped. */
export const BOXED_SELECT =
  "border border-border bg-white px-4 transition-colors focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20 [&>button]:border-b-0 [&>button]:py-3";
