import type { ReactNode } from "react";

/**
 * A state, drawn as a bar of colour with its word beside it.
 *
 * The bar is what makes a column of these scannable: at a glance the eye reads
 * a row of coloured edges, and only reads the words on the row it stopped at.
 * Tinting the whole pill loses that — every chip becomes the same soft
 * rectangle and the column reads as texture.
 *
 * The tones are steps of the gold ramp plus ink, not a red/amber/green set.
 * Gold is the brand's one accent, so the ramp carries the ordering and the
 * word carries the meaning. `alert` is the exception and uses `error`, which
 * the palette already defines for genuinely wrong states.
 */

export type ChipTone = "neutral" | "quiet" | "live" | "strong" | "alert";

const TONES: Record<ChipTone, string> = {
  neutral: "border-l-muted bg-raise text-soft",
  quiet: "border-l-gold-highlight bg-gold-highlight/25 text-gold-deep",
  live: "border-l-gold bg-gold/12 text-gold-deep",
  strong: "border-l-ink bg-ink/8 text-ink",
  alert: "border-l-error bg-error/10 text-error",
};

export function Chip({
  tone = "neutral",
  title,
  children,
}: {
  tone?: ChipTone;
  /** Expands on the state when the one word cannot. */
  title?: string;
  children: ReactNode;
}) {
  return (
    /* Square on the bar side, round on the other: the bar has to meet the
       chip's edge flush or it reads as a stray tick rather than a spine. */
    <span
      title={title}
      className={`inline-flex max-w-full items-center whitespace-nowrap rounded-l-[3px] rounded-r-md border-l-[3px] py-0.5 pl-[7px] pr-2 text-[11.5px] font-semibold ${TONES[tone]}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
