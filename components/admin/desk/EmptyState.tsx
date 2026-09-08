import type { ReactNode } from "react";
import { cardChrome, deskFace } from "./styles";

/**
 * Nothing to show, said where the thing would have been.
 *
 * The sentence is required rather than optional, because an empty list that
 * only says "No results" leaves the reader to guess whether they broke
 * something or the desk is genuinely empty. One line saying what to do next is
 * the whole difference between the two.
 */
export function EmptyState({
  title,
  note,
  action,
}: {
  /** Four words at most. What is missing, not an apology for it. */
  title: string;
  /** One sentence: what to do about it, or why it is empty. */
  note: string;
  /** A button or link that does the thing the sentence just described. */
  action?: ReactNode;
}) {
  return (
    <div className={`${cardChrome} px-5 py-9 text-center text-soft`}>
      <b className={`${deskFace} mb-1.5 block text-[17px] font-bold text-ink`}>{title}</b>
      <span className="mx-auto block max-w-md text-[13px]">{note}</span>
      {action ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
