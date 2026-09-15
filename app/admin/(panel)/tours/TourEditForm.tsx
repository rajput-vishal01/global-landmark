"use client";

import { useActionForm } from "@/lib/use-action-form";
import { Select } from "@/components/ui/Select";
import { deskButtonSmall } from "@/components/admin/desk";
import { deskErrorText } from "@/components/admin/FormSection";
import { TOUR_STATUSES } from "@/lib/taxonomy/tours";
import { updateTourRequest, type TourFormState } from "./actions";

const STATUS_OPTIONS = TOUR_STATUSES.map((s) => ({
  value: s,
  label: s[0].toUpperCase() + s.slice(1),
}));

const initialState: TourFormState = {};

/**
 * Per-row status editor, the same shape as LeadEditForm: a plain form with
 * one explicit Save rather than an auto-submitting select, so arrow-keying
 * through the options does not fire a mutation per keystroke.
 */
export function TourEditForm({ id, status }: { id: number; status: string }) {
  const { state, isPending, formProps } = useActionForm(
    updateTourRequest,
    initialState
  );

  return (
    <form {...formProps} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={id} />
      <div className="w-36">
        {/* The custom listbox, not a native <select>: the OS draws that popup
            and no desk styling can reach inside it. */}
        <Select name="status" options={STATUS_OPTIONS} defaultValue={status} />
      </div>
      {/* deskButtonSmall, not deskButtonPrimary: this Save sits inside a table
          row, and the desk allows one filled action per screen (ADMIN_DESK §3). */}
      <button
        type="submit"
        disabled={isPending}
        className={`${deskButtonSmall} whitespace-nowrap disabled:cursor-wait disabled:opacity-50`}
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      {state.error && (
        <span role="alert" className={deskErrorText}>
          {state.error}
        </span>
      )}
    </form>
  );
}
