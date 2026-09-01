import type { ReactNode } from "react";
import {
  Handshake,
  Scale,
  TrendingUp,
  Landmark,
  Compass,
  Sofa,
  Diamond,
} from "lucide-react";

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
 * Keys match what scripts/seed.mjs writes. They diverged once (the map was
 * keyed by service name, the seed by icon name) and every live row silently
 * fell through to the diamond fallback — hence one list, used by both.
 */

export const SERVICE_ICON_KEYS = [
  "home",
  "shield",
  "chart",
  "bank",
  "compass",
  "brush",
] as const;

export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];

/** Dropdown labels for the admin form. */
export const SERVICE_ICON_LABELS: Record<ServiceIconKey, string> = {
  home: "Buying or selling (handshake)",
  shield: "Legal advice (scales)",
  chart: "Investment (trend line)",
  bank: "Home loan (bank)",
  compass: "Vastu (compass)",
  brush: "Interiors (sofa)",
};

const ICON_PROPS = { size: 28, strokeWidth: 1.25, "aria-hidden": true } as const;

export const SERVICE_ICONS: Record<string, ReactNode> = {
  home: <Handshake {...ICON_PROPS} />,
  shield: <Scale {...ICON_PROPS} />,
  chart: <TrendingUp {...ICON_PROPS} />,
  bank: <Landmark {...ICON_PROPS} />,
  compass: <Compass {...ICON_PROPS} />,
  brush: <Sofa {...ICON_PROPS} />,
};

export const SERVICE_ICON_FALLBACK: ReactNode = <Diamond {...ICON_PROPS} />;
