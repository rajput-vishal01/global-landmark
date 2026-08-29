import Link from "next/link";
import { type ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "underline" | "outline" | "primary";
  tone?: "light" | "dark";
  /**
   * Stretch to the container. The property-detail enquiry rail is five
   * stacked full-width controls; without this it had to hand-roll the
   * yellow fill, which is how a second, slightly-different primary button
   * ends up in the codebase.
   */
  fullWidth?: boolean;
  /**
   * Set for destinations that leave the site (WhatsApp, tel:). `next/link`
   * is skipped for these — it prefetches and client-navigates, neither of
   * which means anything for an external scheme — and `rel` is forced
   * alongside `target="_blank"` so the opened page can never reach back
   * through `window.opener`.
   */
  external?: boolean;
  newTab?: boolean;
};

/**
 * One loud action per screen: `primary` is the yellow fill, and yellow is
 * always carried on dark text (`cta-ink`) rather than white. `outline` and
 * `underline` are the quiet ones — `underline` stays the default so the
 * text links scattered through the site keep their existing weight.
 *
 * The old `corner` variant — gold L-brackets growing into a full frame on
 * hover — went with the portal redesign. It was the most decorative
 * affordance on the site and it competed with the yellow fill for "this is
 * the thing to click"; both of its callers (the deal band and the closing
 * CTA) are exactly where the primary action now lives.
 */
export function Button({
  href,
  children,
  variant = "underline",
  tone = "light",
  fullWidth = false,
  external = false,
  newTab = false,
}: ButtonProps) {
  const width = fullWidth ? "w-full" : "";

  /**
   * One wrapper so every variant gets external handling identically — a
   * plain <a> for off-site destinations, `next/link` otherwise. `rel` is
   * derived from `newTab` rather than accepted as a prop, so a caller
   * cannot open a new tab and forget `noopener`.
   *
   * A plain function returning elements, NOT a component: declaring a
   * component inside render gives it a new identity every pass, which
   * remounts it and throws away any state below it.
   */
  const shell = (className: string) =>
    external ? (
      <a
        href={href}
        className={className}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    ) : (
      <Link href={href} className={className}>
        {children}
      </Link>
    );

  if (variant === "primary") {
    return shell(
      `text-eyebrow inline-flex items-center justify-center bg-cta px-8 py-4 font-sans font-semibold uppercase tracking-[0.18em] text-cta-ink transition-colors duration-300 hover:bg-cta-hover ${width}`
    );
  }

  if (variant === "outline") {
    const toneClasses =
      tone === "dark"
        ? "border-cream/30 text-cream hover:border-cta"
        : "border-ink/25 text-ink hover:border-gold";
    return shell(
      `text-eyebrow inline-flex items-center justify-center border px-7 py-3.5 font-sans font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${toneClasses} ${width}`
    );
  }

  const textTone = tone === "dark" ? "text-cream" : "text-ink";
  return (
    <Link
      href={href}
      className={`group text-eyebrow inline-flex w-fit items-center font-sans font-medium uppercase tracking-[0.18em] ${textTone}`}
    >
      <span className="relative pb-1">
        {children}
        <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-100 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-0" />
        <span className="absolute bottom-0 right-0 h-px w-full origin-right scale-x-0 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </span>
    </Link>
  );
}
