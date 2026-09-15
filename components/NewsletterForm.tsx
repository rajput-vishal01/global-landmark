"use client";

import { useActionForm } from "@/lib/use-action-form";
import { Req } from "@/components/ui/RequiredMark";
import {
  subscribeToNewsletter,
  type SubscribeState,
} from "@/app/(site)/newsletter/actions";

const initialState: SubscribeState = { status: "idle" };

/**
 * Dark-surface copies of the shared LABEL/FIELD in components/form-classes:
 * this form now lives on the navy footer, and those constants are tuned for
 * ink-on-white (they are shared with every admin form, so they must stay
 * that way).
 */
const LABEL_ON_NAVY =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-cta";
const FIELD_ON_NAVY =
  "w-full appearance-none rounded-none border-b border-cream/25 bg-transparent py-2 font-sans text-body text-cream placeholder:text-cream/40 focus:border-cta focus:outline-none";

/**
 * Footer newsletter signup. Success and "already subscribed" both come back
 * as `ok` — a repeat signup is a normal thing to do, not an error, and the
 * form must never tell a visitor the site fell over because they were
 * already on the list.
 */
export function NewsletterForm() {
  // Stays on screen to take another address, so it clears itself on success.
  const { state, isPending, formProps } = useActionForm(subscribeToNewsletter, initialState, {
    resetOnSuccess: true,
  });

  return (
    <form {...formProps} className="flex flex-col gap-3">
      {/* Honeypot — hidden from real users, tempting to bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {/* The one form where email stays mandatory: it IS the subscription,
          so there is nothing to store without it. */}
      <label htmlFor="newsletter-email" className={LABEL_ON_NAVY}>
        Subscribe for monthly updates
        <Req />
      </label>

      <div className="flex items-end gap-3">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          placeholder="you@example.com"
          className={FIELD_ON_NAVY}
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-eyebrow shrink-0 cursor-pointer bg-cta px-6 py-2.5 font-sans font-semibold uppercase tracking-[0.18em] text-cta-ink transition-colors duration-200 hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Submit"}
        </button>
      </div>

      {/* `text-error` is a deep red tuned for white; on navy it reads as
          near-black. A pale rose is the only value here that is not a token
          because it exists solely for this one dark surface. */}
      <p
        aria-live="polite"
        className={`min-h-[1.25rem] text-meta font-sans ${
          state.status === "error" ? "text-[#ffb3b3]" : "text-cream/70"
        }`}
      >
        {state.message}
      </p>
    </form>
  );
}
