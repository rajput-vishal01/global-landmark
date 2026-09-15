"use client";

import { useActionForm } from "@/lib/use-action-form";
import { LABEL } from "@/components/form-classes";
import { cardChrome, deskButton, deskField } from "@/components/admin/desk";
import { Req } from "@/components/ui/RequiredMark";
import { addPayment, type PaymentFormState } from "@/app/admin/(panel)/crm/deal-actions";

const initialState: PaymentFormState = {};

/** Desk field chrome plus the full width the inline payment fields want. */
const FIELD = `${deskField} w-full`;

/** Inline add-payment row under a deal's payments list (R-31 — partial receipts add up). */
export function PaymentForm({ dealId }: { dealId: number }) {
  // Stays on the deal page to log the next instalment, so it clears on success.
  const { state, isPending, formProps } = useActionForm(addPayment, initialState, {
    resetOnSuccess: true,
  });

  return (
    <form
      {...formProps}
      className={`${cardChrome} flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end`}
    >
      <input type="hidden" name="dealId" value={dealId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="paidAt" className={LABEL}>
          Date
          <Req />
        </label>
        <input id="paidAt" name="paidAt" type="date" required className={`${FIELD} sm:w-40`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className={LABEL}>
          Amount (rupees)
          <Req />
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          className={`${FIELD} sm:w-36`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="mode" className={LABEL}>
          Mode
        </label>
        <input
          id="mode"
          name="mode"
          type="text"
          maxLength={60}
          placeholder="Bank transfer"
          className={`${FIELD} sm:w-40`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="note" className={LABEL}>
          Note
        </label>
        <input id="note" name="note" type="text" maxLength={500} className={FIELD} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`${deskButton} shrink-0 whitespace-nowrap disabled:cursor-wait disabled:opacity-50`}
      >
        {isPending ? "Saving..." : "Add payment"}
      </button>

      {state.error && (
        <span role="alert" className="w-full text-[13px] text-error">
          {state.error}
        </span>
      )}
    </form>
  );
}
