"use client";

import { useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { EASE } from "@/lib/motion";
import { useModalLock, useMounted } from "@/lib/hooks";

/**
 * A button that opens a form in a dialog — the property page keeps its
 * forms (book a visit, request details) out of the page and behind the
 * buttons that ask for them, so one page never shows the same form twice.
 * The form is passed as children, so it can be a server-rendered tree.
 */
export function FormDialog({
  label,
  className,
  eyebrow,
  title,
  sub,
  children,
}: {
  label: ReactNode;
  className: string;
  eyebrow: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const close = useCallback(() => setOpen(false), []);
  useModalLock(open, close);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`cursor-pointer ${className}`}>
        {label}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                onClick={close}
                className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
              >
                <m.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative my-6 w-full max-w-2xl bg-surface p-6 shadow-2xl sm:p-10"
                >
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="absolute right-4 top-4 cursor-pointer p-2 text-ink-muted transition-colors hover:text-ink"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M5 5l14 14M19 5 5 19" />
                    </svg>
                  </button>
                  <p className="text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-gold-deep">
                    {eyebrow}
                  </p>
                  <h2 className="mt-2 pr-8 text-balance font-serif text-h3 text-heading">{title}</h2>
                  {sub && <p className="mt-3 text-pretty font-sans text-body text-ink-muted">{sub}</p>}
                  <div className="mt-8">{children}</div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
