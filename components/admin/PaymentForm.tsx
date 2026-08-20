"use client";

import { useActionState } from "react";
import { FIELD, LABEL } from "@/components/form-classes";
import { addPayment, type PaymentFormState } from "@/app/admin/(panel)/crm/deal-actions";

const initialState: PaymentFormState = {};

/** Inline add-payment row under a deal's payments list (R-31 — partial receipts add up). */
export function PaymentForm({ dealId }: { dealId: number }) {
  const [state, formAction, isPending] = useActionState(addPayment, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 border border-border bg-white p-4 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <input type="hidden" name="dealId" value={dealId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="paidAt" className={LABEL}>
          Date
        </label>
        <input id="paidAt" name="paidAt" type="date" required className={`${FIELD} sm:w-40`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className={LABEL}>
          Amount (rupees)
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
        className="shrink-0 cursor-pointer whitespace-nowrap border border-ink/25 px-5 py-2.5 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold disabled:cursor-wait disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Add payment"}
      </button>

      {state.error && (
        <span role="alert" className="w-full text-meta font-sans text-error">
          {state.error}
        </span>
      )}
    </form>
  );
}
