"use client";

import { useActionState } from "react";
import { LABEL } from "@/components/form-classes";
import { Select } from "@/components/ui/Select";
import { submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";

const FIELD_CLASSES =
  "w-full appearance-none rounded-none border-b border-border bg-transparent py-3 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none";

const initialState: InquiryState = { status: "idle" };

/**
 * idPrefix keeps field ids unique when two forms are in the DOM at once —
 * the WhatsApp dock modal renders one over pages that already have one.
 */
export function ContactForm({ idPrefix = "" }: { idPrefix?: string }) {
  const [state, formAction, isPending] = useActionState(submitInquiry, initialState);
  const fid = (name: string) => `${idPrefix}${name}`;

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-5 self-start border border-border bg-white p-8 md:p-12">
        <span aria-hidden className="block h-px w-12 bg-gold" />
        <h2 className="font-serif text-h3 text-ink">Your inquiry has been sent</h2>
        <p className="max-w-md text-pretty text-body font-sans text-ink-muted">
          A confirmation is on its way. We respond within one business day.
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
          <label htmlFor={fid("name")} className={LABEL}>
            Name
          </label>
          <input id={fid("name")} name="name" type="text" required autoComplete="name" className={FIELD_CLASSES} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={fid("email")} className={LABEL}>
            Email
          </label>
          <input id={fid("email")} name="email" type="email" required autoComplete="email" className={FIELD_CLASSES} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={fid("phone")} className={LABEL}>
            Phone <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input id={fid("phone")} name="phone" type="tel" autoComplete="tel" className={FIELD_CLASSES} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={fid("interest")} className={LABEL}>
            I am looking to
          </label>
          <Select
            id={fid("interest")}
            name="interest"
            defaultValue="buy"
            options={[
              { value: "buy", label: "Buy" },
              { value: "sell", label: "Sell" },
              { value: "valuation", label: "Request a valuation" },
              { value: "other", label: "Something else" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fid("message")} className={LABEL}>
          Message
        </label>
        <textarea id={fid("message")} name="message" rows={5} required className={FIELD_CLASSES} />
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
        {isPending ? "Sending..." : "Send Inquiry"}
      </button>
    </form>
  );
}
