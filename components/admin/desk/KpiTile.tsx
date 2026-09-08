import type { ReactNode } from "react";
import { cardChrome, deskFace } from "./styles";

/**
 * The three or four numbers a desk is actually run on, above the list they
 * came out of.
 *
 * Label above value, not below: read top to bottom the tile says what the
 * number is before it says the number, which is the order somebody scanning a
 * row of four of them needs.
 */
export function KpiTile({
  label,
  value,
  note,
  highlight = false,
}: {
  /** Two or three words. What the figure counts. */
  label: string;
  /** Already formatted. This component does no arithmetic and no rounding. */
  value: string;
  /** What it is out of, or what it is measured over. */
  note?: string;
  /** For the one figure on the row that is the reason anybody is looking. */
  highlight?: boolean;
}) {
  return (
    <div className={`${cardChrome} min-w-0 px-4 py-3.5`}>
      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p
        className={`${deskFace} mt-1.5 text-2xl font-bold leading-[1.1] tabular-nums ${
          highlight ? "text-gold-deep" : "text-ink"
        }`}
      >
        {value}
      </p>
      {note ? <p className="mt-1 truncate text-[11.5px] text-muted">{note}</p> : null}
    </div>
  );
}

/**
 * The row they sit in.
 *
 * auto-fit rather than a fixed column count: the number of tiles differs per
 * page, so `grid-cols-4` leaves a hole on every screen showing three. Below
 * 150px a tile cannot hold its own label, which is where the row breaks
 * instead of squeezing.
 */
export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
      {children}
    </div>
  );
}
