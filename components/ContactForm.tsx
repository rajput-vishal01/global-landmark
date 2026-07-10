"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "@/app/contact/actions";

const FIELD_CLASSES =
  "w-full appearance-none rounded-none border-b border-border bg-transparent py-3 font-sans text-body text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none";

const LABEL_CLASSES =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink";

const initialState: InquiryState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitInquiry, initialState);

  if (state.status === "sent") {
    return (
      <div data-reveal className="flex flex-col gap-5 self-start border border-border bg-white p-8 md:p-12">
        <span aria-hidden className="block h-px w-12 bg-gold" />
        <h2 className="font-serif text-h3 text-ink">Your inquiry has been sent</h2>
        <p className="max-w-md text-pretty text-body font-sans text-ink-muted">
          A confirmation is on its way to your inbox, and a senior member of
          the group will respond within one business day.
        </p>
      </div>
    );
  }

  return (
    <form data-reveal action={formAction} className="flex flex-col gap-8">
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
          <label htmlFor="name" className={LABEL_CLASSES}>
            Name
          </label>
          <input id="name" name="name" type="text" required autoComplete="name" className={FIELD_CLASSES} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={LABEL_CLASSES}>
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={FIELD_CLASSES} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className={LABEL_CLASSES}>
            Phone <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={FIELD_CLASSES} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="interest" className={LABEL_CLASSES}>
            I am looking to
          </label>
          <select id="interest" name="interest" className={FIELD_CLASSES} defaultValue="buy">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="valuation">Request a valuation</option>
            <option value="other">Something else</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className={LABEL_CLASSES}>
          Message
        </label>
        <textarea id="message" name="message" rows={5} required className={FIELD_CLASSES} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-meta font-sans text-[#9a2b2b]">
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
