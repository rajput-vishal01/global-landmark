"use client";

import { useActionState } from "react";
import {
  approveSubmission,
  declineSubmission,
  type SubmissionActionState,
} from "./actions";

const initialState: SubmissionActionState = {};

const BUTTON =
  "cursor-pointer whitespace-nowrap border px-3 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] transition-colors disabled:cursor-wait disabled:opacity-50";

/**
 * Approve and decline, as two separate one-button forms.
 *
 * Two forms rather than one with two submit buttons: each gets its own
 * pending state, so pressing Approve does not grey out Decline, and neither
 * needs a formAction discriminator the server then has to re-validate.
 *
 * Decline is deliberately quiet — a hairline button, not a red one. It
 * archives rather than deletes, so it is reversible from the property
 * editor, and dressing a reversible action as destructive teaches the
 * broker to hesitate over the wrong thing.
 */
export function SubmissionActions({ id }: { id: number }) {
  const [approveState, approve, approving] = useActionState(approveSubmission, initialState);
  const [declineState, decline, declining] = useActionState(declineSubmission, initialState);
  const error = approveState.error ?? declineState.error;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={approve}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={approving || declining}
            className={`${BUTTON} border-gold bg-gold/10 text-gold-deep hover:bg-gold/20`}
          >
            {approving ? "Publishing..." : "Approve & publish"}
          </button>
        </form>
        <form action={decline}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={approving || declining}
            className={`${BUTTON} border-border text-ink-muted hover:border-ink/30 hover:text-ink`}
          >
            {declining ? "Archiving..." : "Decline"}
          </button>
        </form>
      </div>
      {error && (
        <span role="alert" className="text-meta font-sans text-error">
          {error}
        </span>
      )}
    </div>
  );
}
