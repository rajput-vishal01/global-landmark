"use client";

import { useActionForm } from "@/lib/use-action-form";
import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BOXED_FIELD, LABEL } from "@/components/form-classes";
import { Req } from "@/components/ui/RequiredMark";
import { isModalOpen, useModalLock, useMounted } from "@/lib/hooks";
import { submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";

const DELAY_MS = 10_000;
const DISMISS_KEY = "gld-lead-popup-dismissed";

const FIELD = BOXED_FIELD;

/** The same four intents the contact form offers, as one-tap choices. */
const INTERESTS = [
  ["buy", "Buy"],
  ["sell", "Sell"],
  ["valuation", "Valuation"],
  ["other", "Other"],
] as const;

/** What the visitor is promised, set beside the form so the ask has a reason. */
const PROMISES = [
  "A principal calls you back, not a call centre",
  "No automated follow-ups or mailing lists",
  "Your number is never shared",
];

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
  const { state, isPending, formProps } = useActionForm(submitInquiry, initialState);
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
    // Never over another overlay (a booking dialog, the photo viewer, the
    // menu): wait until the visitor has closed it, then show.
    let id: ReturnType<typeof setTimeout>;
    const tryOpen = () => {
      if (isModalOpen()) id = setTimeout(tryOpen, 3000);
      else setIsOpen(true);
    };
    id = setTimeout(tryOpen, DELAY_MS);
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
            className="relative mt-10 grid w-full max-w-3xl grid-cols-1 overflow-hidden border border-border bg-white shadow-[0_40px_90px_-30px_rgba(20,20,20,0.65)] sm:mt-0 md:grid-cols-[0.85fr_1.15fr]"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-cream/80 transition-colors hover:bg-white/10 hover:text-cream md:text-ink-muted md:hover:bg-ink/5 md:hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </button>

            {/* Brand panel: the logo's graphite, with why to leave a number.
                A short strip on a phone, a full column from md. */}
            <div data-band className="flex flex-col bg-navy p-7 text-cream md:p-9">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/40"
                />
                <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.22em] text-cta">
                  Speak with us
                </p>
              </div>
              <h2 className="mt-6 text-balance font-serif text-h3 leading-snug text-cream">
                Looking for something specific?
              </h2>
              <p className="mt-3 text-pretty text-meta font-sans leading-relaxed text-cream/70">
                Leave your number and a principal will call you back — no
                automated follow-ups.
              </p>
              <ul className="mt-8 hidden flex-col gap-3 md:flex">
                {PROMISES.map((promise) => (
                  <li key={promise} className="flex items-start gap-3 text-meta font-sans text-cream/80">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/60 text-gold-highlight"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                    {promise}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-7 md:p-9">
              {state.status === "sent" ? (
                <div role="status" className="flex h-full flex-col justify-center">
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold-deep"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <p className="mt-5 font-serif text-h4 text-heading">
                    Thank you — we have your details.
                  </p>
                  <p className="mt-3 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                    {state.message}
                  </p>
                </div>
              ) : (
                <form {...formProps} className="flex flex-col gap-4">
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
                      Email <span className="normal-case tracking-normal text-ink-muted">(optional)</span>
                    </label>
                    <input
                      id="popup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className={FIELD}
                    />
                  </div>

                  {/* One tap instead of open-scroll-pick: native radios styled
                      as chips, so keyboard and screen readers get a real group. */}
                  <fieldset className="flex flex-col gap-2">
                    <legend className={`${LABEL} mb-2`}>I am looking to</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {INTERESTS.map(([value, label]) => (
                        <label key={value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="interest"
                            value={value}
                            defaultChecked={value === "buy"}
                            className="peer sr-only"
                          />
                          <span className="flex items-center justify-center border border-border bg-white px-3 py-2.5 text-meta font-sans font-semibold text-ink transition-colors hover:border-gold/60 peer-checked:border-gold peer-checked:bg-gold/10 peer-checked:text-gold-deep peer-focus-visible:ring-2 peer-focus-visible:ring-gold/40">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {state.status === "error" && (
                    <p role="alert" className="border-l-2 border-error bg-error/5 px-4 py-3 text-meta font-sans text-error">
                      {state.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="text-eyebrow mt-2 cursor-pointer bg-cta px-6 py-4 font-sans font-semibold uppercase tracking-[0.2em] text-cta-ink transition-colors hover:bg-cta-hover disabled:cursor-wait disabled:opacity-60"
                  >
                    {isPending ? "Sending..." : "Request a callback"}
                  </button>

                  <button
                    type="button"
                    onClick={close}
                    className="text-meta cursor-pointer self-center font-sans text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink"
                  >
                    No thanks
                  </button>
                </form>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
