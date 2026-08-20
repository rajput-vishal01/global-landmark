"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/Select";
import { FIELD } from "@/components/form-classes";
import { LEAD_STATUSES } from "@/lib/taxonomy/leads";
import { updateLead, type LeadFormState } from "./actions";

const STATUS_OPTIONS = LEAD_STATUSES.map((s) => ({
  value: s,
  label: s[0].toUpperCase() + s.slice(1),
}));

const initialState: LeadFormState = {};

/** Per-row status + assignment editor. Plain form, no auto-submit — one
 * explicit Save avoids firing a mutation on every keystroke or arrow-key
 * nudge through the Select. */
export function LeadEditForm({
  id,
  status,
  assignedTo,
}: {
  id: number;
  status: string;
  assignedTo: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateLead, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={id} />
      <div className="w-32">
        <Select name="status" options={STATUS_OPTIONS} defaultValue={status} />
      </div>
      <input
        type="text"
        name="assignedTo"
        defaultValue={assignedTo ?? ""}
        placeholder="Unassigned"
        className={`${FIELD} w-32`}
      />
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
