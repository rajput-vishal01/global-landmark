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
