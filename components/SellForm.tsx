"use client";

import { useActionState } from "react";
import { LABEL, FIELD } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { submitSellInquiry, type SellInquiryState } from "@/app/(site)/sell/actions";

const initialState: SellInquiryState = { status: "idle" };

export function SellForm() {
  const [state, formAction, isPending] = useActionState(submitSellInquiry, initialState);

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-5 self-start border border-border bg-white p-8 md:p-12">
        <span aria-hidden className="block h-px w-12 bg-gold" />
        <h2 className="font-serif text-h3 text-ink">Your submission has been received</h2>
        <p className="max-w-md text-pretty text-body font-sans text-ink-muted">
          A confirmation is on its way. We respond within one business day with next steps for a valuation.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {/* Honeypot — hidden from real users, tempting to bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="sell-name" className={LABEL}>
            Name
            <Req />
          </label>
          <input id="sell-name" name="name" type="text" required autoComplete="name" className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sell-phone" className={LABEL}>
            Phone
            <Req />
          </label>
          <input id="sell-phone" name="phone" type="tel" required autoComplete="tel" className={FIELD} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sell-email" className={LABEL}>
          Email <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <input id="sell-email" name="email" type="email" autoComplete="email" className={FIELD} />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="sell-propertyType" className={LABEL}>
            Property type / configuration
            <Req />
          </label>
          <input
            id="sell-propertyType"
            name="propertyType"
            type="text"
            required
            placeholder="e.g. 3 BHK apartment, independent floor"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sell-locality" className={LABEL}>
            Locality
            <Req />
          </label>
          <input
            id="sell-locality"
            name="locality"
            type="text"
            required
            placeholder="e.g. Sector 20, Panchkula"
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="sell-area" className={LABEL}>
            Approximate area <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input id="sell-area" name="area" type="text" placeholder="e.g. 2400 sq ft" className={FIELD} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sell-expectedPrice" className={LABEL}>
            Expected price <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input
            id="sell-expectedPrice"
            name="expectedPrice"
            type="text"
            placeholder="e.g. ₹1.8 Cr"
            className={FIELD}
          />
        </div>
      </div>

      <label htmlFor="sell-alreadyListed" className="flex items-center gap-3">
        <input id="sell-alreadyListed" name="alreadyListed" type="checkbox" className="h-4 w-4 accent-gold" />
        <span className={LABEL}>Already listed elsewhere</span>
      </label>

      <div className="flex flex-col gap-2">
        <label htmlFor="sell-message" className={LABEL}>
          Message <span className="normal-case text-ink-muted">(optional)</span>
        </label>
        <textarea id="sell-message" name="message" rows={5} className={FIELD} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-meta font-sans text-error">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="group relative inline-flex w-fit cursor-pointer items-center px-10 py-5 text-eyebrow font-sans font-medium uppercase tracking-[0.22em] text-ink transition-transform duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        <span
          aria-hidden
          className="absolute left-0 top-0 h-3 w-3 border-l border-t border-gold transition-all duration-500 ease-out group-hover:h-full group-hover:w-full"
        />
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-gold transition-all duration-500 ease-out group-hover:h-full group-hover:w-full"
        />
        {isPending ? "Sending..." : "Request Valuation"}
      </button>
    </form>
  );
}
