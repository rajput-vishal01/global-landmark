"use client";

import { useActionForm } from "@/lib/use-action-form";
import { cardChrome, deskButtonPrimary } from "@/components/admin/desk";
import { deskFieldFull, deskHint, deskLabel } from "@/components/admin/FormSection";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { LEAD_STATUSES } from "@/lib/taxonomy/leads";
import { createLead, type LeadFormState } from "./actions";

const STATUS_OPTIONS = LEAD_STATUSES.map((s) => ({
  value: s,
  label: s[0].toUpperCase() + s.slice(1),
}));

const initialState: LeadFormState = {};

/**
 * A lead the office types in — the walk-in, the phone call, the referral
 * that never touched the website. Same table and same inbox as the public
 * forms write to, so it filters, converts and exports like any other.
 */
export function LeadCreateForm() {
  const { state, isPending, formProps } = useActionForm(createLead, initialState);

  return (
    <form {...formProps} className={`${cardChrome} flex flex-col gap-5 p-5`}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-name" className={deskLabel}>
            Name
            <Req />
          </label>
          <input
            id="lead-name"
            name="name"
            type="text"
            required
            maxLength={255}
            placeholder="Who called"
            className={deskFieldFull}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-phone" className={deskLabel}>
            Phone
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            maxLength={40}
            placeholder="98765 43210"
            className={`${deskFieldFull} tel`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-email" className={deskLabel}>
            Email
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            maxLength={255}
            placeholder="Optional"
            className={deskFieldFull}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-source" className={deskLabel}>
            Source
          </label>
          <input
            id="lead-source"
            name="source"
            type="text"
            maxLength={100}
            placeholder="Walk-in, referral, hoarding..."
            className={deskFieldFull}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-interest" className={deskLabel}>
          Looking for
        </label>
        <input
          id="lead-interest"
          name="interest"
          type="text"
          maxLength={500}
          placeholder="3 BHK in Zirakpur under 90 lakh"
          className={deskFieldFull}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-message" className={deskLabel}>
          Notes
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={3}
          maxLength={4000}
          placeholder="What they said on the call."
          className={deskFieldFull}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-status" className={deskLabel}>
            Status
          </label>
          {/* The custom listbox, not a native select: the OS draws that popup
              and no desk styling can reach inside it. */}
          <Select id="lead-status" name="status" options={STATUS_OPTIONS} defaultValue="new" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-assignedTo" className={deskLabel}>
            Owner
          </label>
          <input
            id="lead-assignedTo"
            name="assignedTo"
            type="text"
            maxLength={200}
            placeholder="Unassigned"
            className={deskFieldFull}
          />
        </div>
      </div>

      <p className={deskHint}>A phone number or an email is needed — one of the two.</p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={`${deskButtonPrimary} disabled:cursor-wait disabled:opacity-50`}
        >
          {isPending ? "Saving..." : "Add lead"}
        </button>
        {state.error && (
          <span role="alert" className="text-[12px] text-error">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
