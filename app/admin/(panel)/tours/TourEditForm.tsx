"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/Select";
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
  const [state, formAction, isPending] = useActionState(
    updateTourRequest,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={id} />
      <div className="w-36">
        <Select name="status" options={STATUS_OPTIONS} defaultValue={status} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer whitespace-nowrap border border-ink/25 px-3 py-2 text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink transition-colors hover:border-gold disabled:cursor-wait disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      {state.error && (
        <span role="alert" className="text-meta font-sans text-error">
          {state.error}
        </span>
      )}
    </form>
  );
}
