"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/Select";
import { deskButtonSmall, deskField } from "@/components/admin/desk";
import { deskErrorText } from "@/components/admin/FormSection";
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
        {/* The custom listbox, not a native <select>: the OS draws that popup
            and no desk styling can reach inside it. */}
        <Select name="status" options={STATUS_OPTIONS} defaultValue={status} />
      </div>
      <input
        type="text"
        name="assignedTo"
        defaultValue={assignedTo ?? ""}
        placeholder="Unassigned"
        className={`${deskField} w-32`}
      />
      {/* deskButtonSmall, not deskButtonPrimary: this Save sits inside a table
          row, and the desk allows one filled action per screen (ADMIN_DESK §3).
          Same button as the "Convert to client" action beside it. */}
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
