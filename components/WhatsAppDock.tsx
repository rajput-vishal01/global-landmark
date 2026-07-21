"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { ContactForm } from "@/components/ContactForm";
import { useModalLock, useMounted } from "@/lib/hooks";
import { whatsAppHref } from "@/lib/whatsapp";
import { WHATSAPP } from "@/lib/data";
const NUDGE_DELAY_MS = 30_000;
const NUDGE_DISMISS_KEY = "gld-nudge-dismissed";

/**
 * Persistent contact layer: WhatsApp button bottom-right, a quiet nudge
 * card that appears after a delay, and a full inquiry modal reusing the
 * site's ContactForm. Portaled to <body> to escape section stacking.
 */
export function WhatsAppDock() {
  const [showNudge, setShowNudge] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mounted = useMounted();

  useEffect(() => {
    if (sessionStorage.getItem(NUDGE_DISMISS_KEY)) return;
    const id = setTimeout(() => setShowNudge(true), NUDGE_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  useModalLock(
    isModalOpen,
    useCallback(() => setIsModalOpen(false), [])
  );

  function dismissNudge() {
    sessionStorage.setItem(NUDGE_DISMISS_KEY, "1");
    setShowNudge(false);
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed bottom-12 right-5 z-40 flex flex-col items-end gap-3 md:bottom-14 md:right-8">
        <AnimatePresence>
          {showNudge && !isModalOpen && (
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="w-72 border border-border bg-white p-5 shadow-[0_24px_60px_-24px_rgba(20,20,20,0.45)]"
            >
              <button
                type="button"
                onClick={dismissNudge}
                aria-label="Dismiss"
                className="absolute right-3 top-3 cursor-pointer p-1 text-ink-muted transition-colors hover:text-ink"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
              <span aria-hidden className="mb-3 block h-px w-8 bg-gold" />
              <p className="font-serif text-h4 leading-snug text-ink">
                {WHATSAPP.nudgeTitle}
              </p>
              <p className="mt-2 text-meta font-sans leading-relaxed text-ink-muted">
                {WHATSAPP.nudgeBody}
              </p>
              <button
                type="button"
                onClick={() => {
                  dismissNudge();
                  setIsModalOpen(true);
                }}
                className="text-eyebrow mt-4 cursor-pointer bg-ink px-5 py-2.5 font-sans font-medium uppercase tracking-[0.18em] text-cream transition-opacity hover:opacity-90"
              >
                {WHATSAPP.nudgeCta}
              </button>
            </m.div>
          )}
        </AnimatePresence>

        <m.a
          href={whatsAppHref(WHATSAPP.defaultMessage)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.6, ease: EASE }}
          whileHover={{ y: -3 }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 bg-dark-deep text-cream shadow-[0_16px_40px_-12px_rgba(20,20,20,0.6)] transition-colors hover:border-gold"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.38a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.81.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
          </svg>
        </m.a>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={WHATSAPP.modalTitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-dark-deep/70 backdrop-blur-xl p-0 sm:items-center sm:p-6"
            onClick={() => setIsModalOpen(false)}
          >
            <m.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.5, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent
              className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto border border-border bg-cream p-6 md:p-10"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close inquiry form"
                className="absolute right-4 top-4 cursor-pointer p-2 text-ink-muted transition-colors hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
              <span aria-hidden className="mb-5 block h-px w-12 bg-gold" />
              <h2 className="font-serif text-h3 text-ink">{WHATSAPP.modalTitle}</h2>
              <p className="mb-8 mt-2 max-w-md text-pretty text-meta font-sans text-ink-muted">
                {WHATSAPP.modalBody}
              </p>
              <ContactForm idPrefix="wa-" />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
