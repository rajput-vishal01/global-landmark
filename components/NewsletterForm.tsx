"use client";

import { useActionState } from "react";
import { LABEL, FIELD } from "@/components/form-classes";
import {
  subscribeToNewsletter,
  type SubscribeState,
} from "@/app/(site)/newsletter/actions";

const initialState: SubscribeState = { status: "idle" };

/**
 * Footer newsletter signup. Success and "already subscribed" both come back
 * as `ok` — a repeat signup is a normal thing to do, not an error, and the
 * form must never tell a visitor the site fell over because they were
 * already on the list.
 */
export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {/* Honeypot — hidden from real users, tempting to bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <label htmlFor="newsletter-email" className={LABEL}>
        Subscribe for monthly updates
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
          className={FIELD}
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 cursor-pointer border border-ink/25 px-6 py-2.5 text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:border-gold disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Submit"}
        </button>
      </div>

      <p
        aria-live="polite"
        className={`min-h-[1.25rem] text-meta font-sans ${
          state.status === "error" ? "text-error" : "text-ink-muted"
        }`}
      >
        {state.message}
      </p>
    </form>
  );
}
