"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/Select";
import { LABEL } from "@/components/form-classes";
import { cardChrome, deskButtonPrimary, deskField } from "@/components/admin/desk";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";
import { updateDeal, type DealFormState } from "@/app/admin/(panel)/crm/deal-actions";

const STAGE_OPTIONS = DEAL_STAGES.map((s) => ({ value: s, label: s }));
const initialState: DealFormState = {};

/** Desk field chrome plus the full width every field in this form wants. */
const FIELD = `${deskField} w-full`;

export type EditableDeal = {
  id: number;
  stage: string;
  dealValue: number | null;
  brokeragePercent: string;
  brokerageAmountOverride: number | null;
  sharedWithName: string | null;
  sharedAmount: number | null;
  assignedTo: string | null;
};

/** Deal detail's editable fields (R-31) — client and property are fixed at creation, not here. */
export function DealEditForm({ deal }: { deal: EditableDeal }) {
  const [state, formAction, isPending] = useActionState(updateDeal, initialState);

  return (
    <form action={formAction} className={`${cardChrome} flex flex-col gap-6 p-5`}>
      <input type="hidden" name="id" value={deal.id} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="stage" className={LABEL}>
            Stage
          </label>
          <Select id="stage" name="stage" options={STAGE_OPTIONS} defaultValue={deal.stage} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="dealValue" className={LABEL}>
            Deal value <span className="normal-case text-muted">(rupees)</span>
          </label>
          <input
            id="dealValue"
            name="dealValue"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={deal.dealValue ?? ""}
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="brokeragePercent" className={LABEL}>
            Brokerage % <span className="normal-case text-muted">(e.g. 2 or 2.5)</span>
          </label>
          <input
            id="brokeragePercent"
            name="brokeragePercent"
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            defaultValue={deal.brokeragePercent}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="brokerageAmountOverride" className={LABEL}>
            Override amount{" "}
            <span className="normal-case text-muted">(rupees — wins over % if set)</span>
          </label>
          <input
            id="brokerageAmountOverride"
            name="brokerageAmountOverride"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={deal.brokerageAmountOverride ?? ""}
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="sharedWithName" className={LABEL}>
            Shared with <span className="normal-case text-muted">(name, if any)</span>
          </label>
          <input
            id="sharedWithName"
            name="sharedWithName"
            type="text"
            maxLength={200}
            defaultValue={deal.sharedWithName ?? ""}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="sharedAmount" className={LABEL}>
            Shared amount <span className="normal-case text-muted">(rupees)</span>
          </label>
          <input
            id="sharedAmount"
            name="sharedAmount"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={deal.sharedAmount ?? ""}
            className={FIELD}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="assignedTo" className={LABEL}>
          Assigned to
        </label>
        <input
          id="assignedTo"
          name="assignedTo"
          type="text"
          maxLength={200}
          defaultValue={deal.assignedTo ?? ""}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isPending}
          className={`${deskButtonPrimary} w-full justify-center disabled:cursor-wait disabled:opacity-60 sm:w-fit`}
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
        {state.error && (
          <p role="alert" className="text-[13px] text-error">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
