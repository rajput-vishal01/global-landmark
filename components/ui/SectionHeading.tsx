import type { ReactNode } from "react";

/**
 * The landing page's single heading treatment: a small uppercase eyebrow
 * over a serif title, optionally with a supporting line and an action set
 * opposite the title.
 *
 * It exists because eight sections were each drawing their own version of
 * this — two flanked-rule variants, three eyebrow colours, four different
 * bottom margins, some uppercase and some not — which is most of what made
 * the page read as a stack of unrelated pages rather than one site.
 */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  action,
  align = "left",
  tone = "light",
  flush = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  /** Sits opposite the title on wide screens. Left-aligned headings only. */
  action?: ReactNode;
  align?: "left" | "center";
  /** `dark` is for the navy bands. */
  tone?: "light" | "dark";
  /** Drops the bottom margin when the caller owns its own spacing. */
  flush?: boolean;
}) {
  const centered = align === "center";
  // The CTA yellow is only legible as text on the navy bands. On white the
  // eyebrow drops to deep gold, which is the accent at a readable weight —
  // gold stays a hairline-and-eyebrow colour, never a fill.
  const eyebrowTone = tone === "dark" ? "text-cta" : "text-gold-deep";
  const titleTone = tone === "dark" ? "text-cream" : "text-heading";
  const subTone = tone === "dark" ? "text-cream/70" : "text-ink-muted";

  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-5 ${
        flush ? "" : "mb-10 md:mb-12"
      } ${centered ? "flex-col items-center justify-center text-center" : ""}`}
    >
      <div className={`flex flex-col gap-3 ${centered ? "items-center" : ""}`}>
        {eyebrow && (
          <span
            className={`text-eyebrow font-sans font-semibold uppercase tracking-[0.24em] ${eyebrowTone}`}
          >
            {eyebrow}
          </span>
        )}
        <h2 className={`text-balance font-serif text-h2 ${titleTone}`}>{title}</h2>
        {sub && (
          <p className={`max-w-xl text-pretty text-body font-sans ${subTone}`}>{sub}</p>
        )}
      </div>
      {action}
    </div>
  );
}
