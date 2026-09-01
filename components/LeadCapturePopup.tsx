"use client";

import { EASE } from "@/lib/motion";
import { useActionState, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { Select } from "@/components/ui/Select";
import { useModalLock, useMounted } from "@/lib/hooks";
import { submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";

const DELAY_MS = 10_000;
const DISMISS_KEY = "gld-lead-popup-dismissed";

const FIELD =
  "w-full appearance-none rounded-none border-b border-border bg-transparent py-2.5 font-sans text-body text-ink focus:border-gold focus:outline-none";

const initialState: InquiryState = { status: "idle" };

/**
 * Ten seconds in, once: name and phone, so the brokerage can follow up.
 *
 * Deliberately narrow. It reuses the contact server action rather than
 * introducing a second lead path, so a popup submission lands in the same
 * admin inbox, with the same rate limit, honeypot and validation as every
 * other enquiry — the only difference is `source`, which is what tells the
 * admin where it came from.
 *
 * Suppressed for the session on dismiss AND on send: an overlay that
 * returns on the next page view is the version of this pattern everyone
 * hates. It also stays out of the way on /contact, where the visitor is
 * already looking at a bigger version of the same form.
 */
export function LeadCapturePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(submitInquiry, initialState);
  const mounted = useMounted();
  const pathname = usePathname();

  const close = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Private-mode sessionStorage throws; the popup simply reappears next
      // session, which is better than the overlay failing to close.
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (pathname === "/contact") return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return;
    }
    const id = setTimeout(() => setIsOpen(true), DELAY_MS);
    return () => clearTimeout(id);
  }, [pathname]);

  // Sent is a dismissal too — nobody should be asked twice in one visit.
  useEffect(() => {
    if (state.status !== "sent") return;
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* see above */
    }
    const id = setTimeout(() => setIsOpen(false), 2600);
    return () => clearTimeout(id);
  }, [state.status]);

  useModalLock(isOpen, close);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label="Request a callback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          onClick={close}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-dark-deep/70 p-4 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <m.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative mt-10 w-full max-w-md border border-border bg-cream p-7 shadow-[0_30px_80px_-30px_rgba(20,20,20,0.6)] sm:mt-0 md:p-9"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 cursor-pointer p-1 text-ink-muted transition-colors hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </button>

            <span aria-hidden className="mb-5 block h-px w-12 bg-gold" />

            {state.status === "sent" ? (
              <div>
                <p className="font-serif text-h4 text-heading">
                  Thank you — we have your details.
                </p>
                <p className="mt-3 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                  {state.message}
                </p>
              </div>
            ) : (
              <>
                <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.22em] text-gold-deep">
                  Speak with us
                </p>
                <h2 className="mt-2 text-balance font-serif text-h4 leading-snug text-heading">
                  Looking for something specific?
                </h2>
                <p className="mt-3 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                  Leave your number and a principal will call you back — no
                  automated follow-ups.
                </p>

                <form action={formAction} className="mt-6 flex flex-col gap-5">
                  {/* Honeypot — hidden from real users, tempting to bots. */}
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                  />
                  <input type="hidden" name="source" value="popup" />
                  <input type="hidden" name="pageUrl" value={pathname} />
                  {/* The action requires a message; the popup deliberately
                      does not ask for one, so it sends the context instead. */}
                  <input
                    type="hidden"
                    name="message"
                    value="Requested a callback from the website pop-up."
                  />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="popup-name" className={LABEL}>
                      Name
                      <Req />
                    </label>
                    <input
                      id="popup-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      className={FIELD}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="popup-phone" className={LABEL}>
                      Phone
                      <Req />
                    </label>
                    <input
                      id="popup-phone"
                      name="phone"
                      type="tel"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      className={FIELD}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="popup-email" className={LABEL}>
                      Email <span className="normal-case text-ink-muted">(optional)</span>
                    </label>
                    <input
                      id="popup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className={FIELD}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className={LABEL}>I am looking to</span>
                    <Select
                      name="interest"
                      defaultValue="buy"
                      aria-label="I am looking to"
                      options={[
                        { value: "buy", label: "Buy" },
                        { value: "sell", label: "Sell" },
                        { value: "valuation", label: "Request a valuation" },
                        { value: "other", label: "Something else" },
                      ]}
                    />
                  </div>

                  {state.status === "error" && (
                    <p role="alert" className="text-meta font-sans text-error">
                      {state.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="text-eyebrow mt-1 cursor-pointer bg-cta px-6 py-3.5 font-sans font-semibold uppercase tracking-[0.2em] text-cta-ink transition-colors hover:bg-cta-hover disabled:cursor-wait disabled:opacity-60"
                  >
                    {isPending ? "Sending..." : "Request a callback"}
                  </button>

                  <button
                    type="button"
                    onClick={close}
                    className="text-meta cursor-pointer font-sans text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink"
                  >
                    No thanks
                  </button>
                </form>
              </>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
