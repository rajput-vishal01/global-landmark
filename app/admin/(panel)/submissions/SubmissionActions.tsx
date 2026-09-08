"use client";

import { useActionState } from "react";
import { deskButtonDanger, deskButtonPrimary } from "@/components/admin/desk";
import { deskErrorText } from "@/components/admin/FormSection";
import {
  approveSubmission,
  declineSubmission,
  type SubmissionActionState,
} from "./actions";

const initialState: SubmissionActionState = {};

/** Both buttons share the same wait cursor while either action is in flight. */
const PENDING = "disabled:cursor-wait disabled:opacity-50";

/**
 * Approve and decline, as two separate one-button forms.
 *
 * Two forms rather than one with two submit buttons: each gets its own
 * pending state, so pressing Approve does not grey out Decline, and neither
 * needs a formAction discriminator the server then has to re-validate.
 *
 * Approve is the filled action — ink on cream, never gold, which the palette
 * reserves for rules, hover and emphasis. Decline is the outline danger
 * button, so it stays a hairline rather than a red slab: it archives rather
 * than deletes, and is reversible from the property editor afterwards.
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
            className={`${deskButtonPrimary} whitespace-nowrap ${PENDING}`}
          >
            {approving ? "Publishing..." : "Approve & publish"}
          </button>
        </form>
        <form action={decline}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={approving || declining}
            className={`${deskButtonDanger} whitespace-nowrap ${PENDING}`}
          >
            {declining ? "Archiving..." : "Decline"}
          </button>
        </form>
      </div>
      {error && (
        <span role="alert" className={deskErrorText}>
          {error}
        </span>
      )}
    </div>
  );
}
