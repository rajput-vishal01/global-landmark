"use client";

import { useActionState } from "react";
import { deskButtonDanger, deskButtonPrimary } from "@/components/admin/desk";
import { deskErrorText } from "@/components/admin/FormSection";
import {
  approveSubmission,
  declineSubmission,
  unpublishSubmission,
  type SubmissionActionState,
} from "./actions";

const initialState: SubmissionActionState = {};

/** Every button shares the same wait cursor while any action is in flight. */
const PENDING = "disabled:cursor-wait disabled:opacity-50";

/**
 * What you can do to a submission, which depends on where it already is.
 *
 * A published submission stays on this page — it is the screen that says
 * "this listing came from an owner" — but offering it "Approve & publish"
 * again would be a button that does nothing, and "Decline" would archive a
 * live listing under a word that reads like refusing a request. So the set
 * changes with the state:
 *
 *   draft      Approve & publish · Decline
 *   published  Take off the website
 *   archived   Publish
 *
 * Each action is its own one-button form rather than one form with several
 * submits: each gets its own pending state, so pressing one does not grey
 * out the others, and none needs a discriminator the server re-validates.
 *
 * The filled action is ink on cream, never gold — the palette reserves gold
 * for rules, hover and emphasis. Destructive ones are outline, because they
 * change publication and are reversible from this same screen.
 */
export function SubmissionActions({
  id,
  publicationState,
}: {
  id: number;
  publicationState: string;
}) {
  const [approveState, approve, approving] = useActionState(approveSubmission, initialState);
  const [declineState, decline, declining] = useActionState(declineSubmission, initialState);
  const [unpublishState, unpublish, unpublishing] = useActionState(
    unpublishSubmission,
    initialState
  );

  const busy = approving || declining || unpublishing;
  const error = approveState.error ?? declineState.error ?? unpublishState.error;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {publicationState === "published" ? (
          <form action={unpublish}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={busy}
              className={`${deskButtonDanger} whitespace-nowrap ${PENDING}`}
            >
              {unpublishing ? "Removing..." : "Take off the website"}
            </button>
          </form>
        ) : (
          <form action={approve}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={busy}
              className={`${deskButtonPrimary} whitespace-nowrap ${PENDING}`}
            >
              {approving
                ? "Publishing..."
                : publicationState === "archived"
                  ? "Publish"
                  : "Approve & publish"}
            </button>
          </form>
        )}

        {/* Only offered on something still waiting. Declining a live listing
            would archive it under a word that means "we are not taking this
            on" — taking it down is the other button, and says so. */}
        {publicationState === "draft" && (
          <form action={decline}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              disabled={busy}
              className={`${deskButtonDanger} whitespace-nowrap ${PENDING}`}
            >
              {declining ? "Archiving..." : "Decline"}
            </button>
          </form>
        )}
      </div>

      {error && (
        <span role="alert" className={deskErrorText}>
          {error}
        </span>
      )}
    </div>
  );
}
