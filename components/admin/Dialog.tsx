"use client";

import { useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useModalLock, useMounted } from "@/lib/hooks";
import { EASE } from "@/lib/motion";

/**
 * Panel dialog for short create/edit forms.
 *
 * Adding a two-field record should not cost a page navigation: you lose
 * your place in the list, and coming back means finding the row you were
 * looking at again. Same portal/lock/animation vocabulary as
 * DeleteButton's confirm, so the panel has one modal treatment rather
 * than two.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const mounted = useMounted();
  useModalLock(
    open,
    useCallback(() => onClose(), [onClose])
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          onClick={onClose}
          // Pinned to the top, not centred: these forms are taller than a laptop
          // viewport, and a centred tall dialog opens with its own heading
          // scrolled off screen.
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-dark-deep/60 p-4 backdrop-blur-sm sm:p-6"
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-6 w-full max-w-xl border border-border bg-cream p-6 md:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 cursor-pointer p-1 text-ink-muted transition-colors hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </button>

            <span aria-hidden className="block h-px w-10 bg-gold" />
            <h2 className="mt-4 font-serif text-h4 text-ink">{title}</h2>
            {description && (
              <p className="mt-2 text-meta font-sans text-ink-muted">{description}</p>
            )}

            <div className="mt-6">{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
