import type { ReactNode } from "react";

/**
 * The icon set for `services.icon`.
 *
 * A FIXED map, keyed by a short string the admin picks from a dropdown —
 * never a URL and never stored markup. `icon` is admin-typed text in the
 * database, and rendering arbitrary SVG from a text column would hand
 * anyone with write access a script tag. An unrecognised key falls back to
 * SERVICE_ICON_FALLBACK rather than rendering nothing, so a renamed key
 * degrades to a plain mark instead of a hole in the grid.
 *
 * Drawn by hand on the same 24-grid and hairline stroke as the footer's
 * social icons — this repo ships no icon library on purpose.
 */

export const SERVICE_ICON_KEYS = [
  "buy-sell",
  "legal",
  "investment",
  "vastu",
  "loan",
  "interior",
] as const;

export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];

/** Dropdown labels for the admin form. */
export const SERVICE_ICON_LABELS: Record<ServiceIconKey, string> = {
  "buy-sell": "Buying or selling (exchange arrows)",
  legal: "Legal advice (scales)",
  investment: "Investment (bar chart)",
  vastu: "Vastu (compass)",
  loan: "Home loan (rupee coin)",
  interior: "Interiors (sofa)",
};

const svg = (children: ReactNode) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export const SERVICE_ICONS: Record<string, ReactNode> = {
  "buy-sell": svg(
    <>
      <path d="M3.5 8.5H17M13.5 5 17 8.5 13.5 12" />
      <path d="M20.5 15.5H7M10.5 12 7 15.5l3.5 3.5" />
    </>
  ),
  legal: svg(
    <>
      <path d="M12 4.5V20M8 20h8M4 8h16" />
      <path d="M4 8 1.9 13h4.2L4 8Z" />
      <path d="M20 8l-2.1 5h4.2L20 8Z" />
    </>
  ),
  investment: svg(
    <>
      <path d="M3.5 20.5h17" />
      <path d="M6 20.5V13h3.5v7.5M12 20.5V9h3.5v11.5M18 20.5V5" />
    </>
  ),
  vastu: svg(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  loan: svg(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 8h5M9.5 10.5h5" />
      <path d="M13 8c1.3 0 2.1 1 2.1 2.2s-.9 2.3-2.4 2.3H9.5l4.2 3.8" />
    </>
  ),
  interior: svg(
    <>
      <path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
      <rect x="3" y="11" width="18" height="6" rx="2" />
      <path d="M6 17v2.5M18 17v2.5" />
    </>
  ),
};

export const SERVICE_ICON_FALLBACK: ReactNode = svg(
  <path d="M12 3.5 20.5 12 12 20.5 3.5 12Z" />
);
