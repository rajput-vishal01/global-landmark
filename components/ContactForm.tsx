"use client";

import { useActionForm } from "@/lib/use-action-form";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BOXED_FIELD, BOXED_SELECT, LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** Boxed, like the Sell form: every enquiry form on the site looks the same. */
const FIELD_CLASSES = BOXED_FIELD;

const initialState: InquiryState = { status: "idle" };

/**
 * idPrefix keeps field ids unique when two forms are in the DOM at once —
 * the WhatsApp dock modal renders one over pages that already have one.
 *
 * `propertyIds` and `source` are set by the enquiry cart panel (R-05) so
 * one submit covers every shortlisted property; every other caller omits
 * them and gets the plain single-message form unchanged. `onSuccess` lets
 * the cart panel clear the shortlist once the lead is actually sent.
 */
export function ContactForm({
  idPrefix = "",
  propertyIds = [],
  source,
  onSuccess,
}: {
  idPrefix?: string;
  propertyIds?: number[];
  source?: string;
  onSuccess?: () => void;
}) {
  const { state, isPending, formProps } = useActionForm(submitInquiry, initialState);
  const fid = (name: string) => `${idPrefix}${name}`;
  const pathname = usePathname();
  // R-05: the enquiry cart must never re-offer properties from an already-
  // sent enquiry — clear it the moment the send actually succeeds.
  useEffect(() => {
    if (state.status === "sent") onSuccess?.();
  }, [state.status, onSuccess]);

  // Written directly to the DOM after mount, not React state — these are
  // uncontrolled hidden inputs, and useSearchParams() would force every
  // page rendering this form into a Suspense boundary just to fill in
  // five fields that are empty on the vast majority of visits anyway.
  const utmRefs = useRef<Record<string, HTMLInputElement | null>>({});
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      const input = utmRefs.current[key];
      if (value && input) input.value = value;
    }
  }, []);

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-5 self-start border border-border border-t-2 border-t-gold bg-white p-8 md:p-12"
      >
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold-deep"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="font-serif text-h3 text-heading">Your inquiry has been sent</h2>
        <p className="max-w-md text-pretty text-body font-sans text-ink-muted">
          We respond within one business day.
        </p>
      </div>
    );
  }

  return (
    <form {...formProps} className="flex flex-col gap-5">
      {/* Honeypot — hidden from real users, tempting to bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <input type="hidden" name="propertyIdsJson" value={JSON.stringify(propertyIds)} />
      <input type="hidden" name="pageUrl" value={pathname} />
      <input type="hidden" name="source" value={source ?? "contact_form"} />
      {UTM_KEYS.map((key) => (
        <input
          key={key}
          ref={(el) => {
            utmRefs.current[key] = el;
          }}
          type="hidden"
          name={key}
          defaultValue=""
        />
      ))}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={fid("name")} className={LABEL}>
            Name
            <Req />
          </label>
          <input id={fid("name")} name="name" type="text" required autoComplete="name" className={FIELD_CLASSES} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={fid("email")} className={LABEL}>
            Email <span className="normal-case text-ink-muted">(optional)</span>
          </label>
          <input id={fid("email")} name="email" type="email" autoComplete="email" className={FIELD_CLASSES} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={fid("phone")} className={LABEL}>
            Phone
            <Req />
          </label>
          <input
            id={fid("phone")}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={FIELD_CLASSES}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={fid("interest")} className={LABEL}>
            I am looking to
          </label>
          <Select
            id={fid("interest")}
            name="interest"
            defaultValue="buy"
            className={BOXED_SELECT}
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
          <Req />
        </label>
        <textarea
          id={fid("message")}
          name="message"
          rows={5}
          required
          className={`${FIELD_CLASSES} resize-y`}
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="border-l-2 border-error bg-error/5 px-4 py-3 text-meta font-sans text-error">
          {state.message}
        </p>
      )}

      {/* The site's one primary action style (yellow on dark text), in place
          of the old gold-corner frame, which read as decoration rather than
          as the thing to press. */}
      <button
        type="submit"
        disabled={isPending}
        className="text-eyebrow mt-2 w-full cursor-pointer bg-cta px-10 py-4 font-sans font-semibold uppercase tracking-[0.18em] text-cta-ink transition-colors hover:bg-cta-hover disabled:cursor-wait disabled:opacity-60 sm:w-fit"
      >
        {isPending ? "Sending..." : "Send Inquiry"}
      </button>
    </form>
  );
}
