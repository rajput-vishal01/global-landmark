/**
 * The measurements the admin desk is built to, in one place.
 *
 * Class strings rather than an `@layer components` rule: that layer loses to
 * utilities, so a `.card` written there could never be overridden per
 * instance. A string imported into a className sits in the same layer as
 * everything around it and behaves the way a reader expects.
 *
 * Ported from the g7x desk. Colours are NOT part of the port — everything
 * here resolves through the Global Landmark tokens in globals.css.
 */

/**
 * The two-layer card shadow: a 1px contact edge so the card sits on the page,
 * and a wide soft one so it floats off it. One shadow alone reads as either a
 * border or a smudge.
 */
const cardShadow =
  "shadow-[0_1px_2px_color-mix(in_srgb,var(--color-ink)_5%,transparent),0_4px_14px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]";

/** Radius and ground shared by every card-shaped thing: card, KPI, table wrap. */
export const cardChrome = `rounded-[10px] bg-surface ${cardShadow}`;

/** The admin display face, for the few places a title or figure carries weight. */
export const deskFace = "font-[family-name:var(--font-desk,sans-serif)]";

/** A 2px ring OUTSIDE the control, so it never eats into the control's own box. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

/** Inputs, selects, textareas. */
export const deskField =
  "min-w-0 rounded-lg border border-line bg-surface px-2.5 py-[7px] text-[13px] text-ink placeholder:text-muted focus:border-gold focus:outline-2 focus:outline-offset-0 focus:outline-gold";

/** The default button. */
export const deskButton = `inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-soft transition-colors hover:border-muted hover:text-ink ${focusRing}`;

/* The box without the colours, so the variants below cannot drift apart on
   padding or radius the way hand-written copies of them do. */
const buttonBox =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors";

/**
 * The one filled action a screen is allowed.
 *
 * Ink on cream, NOT gold. g7x fills this with its accent; here that would put
 * #c9992e behind white text at about 2.5:1, and BRAND_GUIDELINES reserves gold
 * for rules, hover, focus and emphasis — never a fill. Gold still marks this
 * button, on the hover border.
 *
 * A separate string rather than deskButton plus a `bg-ink` override: Tailwind
 * settles two utilities of equal specificity by emission order, not by the
 * order they appear in a className, so the override would win or lose
 * unpredictably and nothing at the call site would say why.
 */
export const deskButtonPrimary = `${buttonBox} border border-ink bg-ink text-cream hover:border-gold hover:bg-ink/90 ${focusRing}`;

/**
 * Destructive. Outline rather than filled on purpose — a delete belongs beside
 * a row or inside a menu, not competing with the save above it.
 */
export const deskButtonDanger = `${buttonBox} border border-line bg-surface text-error hover:border-error hover:bg-raise ${focusRing}`;

/** The same button where it sits inside a row rather than above one. */
export const deskButtonSmall = `inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-[5px] text-xs font-medium text-soft transition-colors hover:border-muted hover:text-ink ${focusRing}`;

/** A button that is really a link: no box, no padding, just the word. */
export const deskLinkButton = `cursor-pointer text-xs font-semibold text-gold-deep transition-colors hover:text-ink ${focusRing}`;

/** In-table links. Underlined on hover only, so a column of them is not a fence. */
export const deskRowLink =
  "font-medium text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-gold";
