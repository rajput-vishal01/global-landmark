import type { ReactNode } from "react";
import { cardChrome } from "./styles";

/**
 * The panel everything on a desk sits in.
 *
 * A card here is a shadow and a radius, not a border. The desk stacks a lot of
 * these next to each other, and an outline on every one turns a page into a
 * grid of boxes; a shadow lets the ground show through and keeps the eye on
 * what is written rather than on the frames around it.
 */
export function Card({
  children,
  className = "",
  pad = "p-4",
}: {
  children: ReactNode;
  /** Merged in, so a page can add a span, a layout, or its own overflow rule. */
  className?: string;
  /**
   * Padding, as its own prop rather than something `className` overrides.
   *
   * `<Card className="p-3">` silently does nothing: Tailwind settles two
   * utilities of equal specificity by which one it emits into the stylesheet
   * last, and `p-4` is emitted after `p-3`. Nothing at the call site says so,
   * and the card just keeps its old padding. Two screens hit this
   * independently — a board column and an activity row, both too narrow for
   * 16px — so the knob is explicit and the trap is gone.
   */
  pad?: string;
}) {
  return <div className={`${cardChrome} ${pad} ${className}`}>{children}</div>;
}
