import type { ReactNode } from "react";
import { cardChrome } from "./styles";

/**
 * The table every desk list is drawn in, and the box it scrolls inside.
 *
 * Both halves exist so no screen hand-rolls `<table className="...">` again. A
 * desk table is a dozen measurements that all have to agree across pages: a
 * row 10px taller on one list than the next reads as two different products,
 * and that is exactly what per-page class strings drift into.
 */

/**
 * The scroll box.
 *
 * `overflow-x-auto` rather than a responsive card stack: these lists are wide
 * on purpose and people compare rows down a column. Reflowing each row into a
 * card destroys the one thing the table is for.
 */
export function TableWrap({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${cardChrome} overflow-x-auto ${className}`}>{children}</div>
  );
}

/* Applied through descendant selectors because this component styles a table
   whose markup it does not own, and written out literally rather than built by
   string concatenation: Tailwind only generates a class it can see whole in the
   source, so a computed "[&_td]:h-[30px]" produces a name no stylesheet
   contains — the table comes out unstyled and nothing says why.

   Heading rules are scoped to `thead`, not to every descendant `th`, so a
   `<th scope="row">` naming its row is left undressed for the caller to style
   as a body cell. `text-left` sits on the table itself rather than on a heading
   rule, so a `text-right` utility on a numeric heading still wins. */
const cells = [
  "[&_thead_th]:h-[30px] [&_thead_th]:whitespace-nowrap [&_thead_th]:border-b [&_thead_th]:border-line [&_thead_th]:bg-raise [&_thead_th]:px-3 [&_thead_th]:py-0 [&_thead_th]:text-[10.5px] [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:leading-[30px] [&_thead_th]:tracking-[0.08em] [&_thead_th]:text-muted",
  "[&_tbody_td]:px-3 [&_tbody_td]:py-2 [&_tbody_td]:align-middle [&_tbody_td]:text-[13px]",
  "[&_tbody_tr]:border-b [&_tbody_tr]:border-line-soft",
  "[&_tbody_tr:hover]:bg-[color-mix(in_srgb,var(--color-gold)_6%,var(--color-surface))]",
  "[&_tbody_tr:last-child]:border-b-0",
].join(" ");

export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={`w-full border-collapse text-left text-[13px] ${cells} ${className}`}>
      {children}
    </table>
  );
}

/**
 * What a cell holding a number wears.
 *
 * Right-aligned so digits line up by place value, and tabular so they stay
 * lined up when the figures above and below have different digits in them.
 */
export const numericCell = "text-right tabular-nums";
