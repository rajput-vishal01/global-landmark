"use client";

import { EASE } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import { useModalLock, useMounted } from "@/lib/hooks";
import { formatIndianShort } from "@/lib/attributes";
import {
  useEnquiryCart,
  ENQUIRY_OPEN_EVENT,
  type EnquiryCartItem,
} from "@/lib/enquiry-cart";

const UNDO_WINDOW_MS = 6000;

/**
 * Sibling of WhatsAppDock: same portal/animation/modal vocabulary, mirrored
 * to bottom-LEFT so the two floating buttons never overlap. Unlike
 * WhatsAppDock, it renders nothing until the shortlist has an item — no
 * point showing an empty cart button.
 */
export function EnquiryDock() {
  const { items, remove, add, clear } = useEnquiryCart();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [justRemoved, setJustRemoved] = useState<EnquiryCartItem | null>(null);
  // Submitting clears the cart (so a reopen doesn't re-offer sent
  // properties) — this flag keeps ContactForm's "sent" confirmation on
  // screen instead of the empty-state message flashing in over it.
  const [justSubmitted, setJustSubmitted] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useMounted();

  // Fired by useEnquiryCart().add() — "adding one property opens the panel
  // with a one-tap send" (R-05).
  useEffect(() => {
    const open = () => setIsPanelOpen(true);
    window.addEventListener(ENQUIRY_OPEN_EVENT, open);
    return () => window.removeEventListener(ENQUIRY_OPEN_EVENT, open);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setJustSubmitted(false);
  }, []);

  useModalLock(isPanelOpen, closePanel);

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  function handleRemove(item: EnquiryCartItem) {
    remove(item.id);
    setJustRemoved(item);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setJustRemoved(null), UNDO_WINDOW_MS);
  }

  function handleUndo() {
    if (!justRemoved) return;
    add(justRemoved);
    setJustRemoved(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  // Stable identity matters here: ContactForm's effect that calls this has
  // `onSuccess` in its dependency array, so a fresh function every render
  // (clear() triggers a re-render too) would refire the effect forever —
  // "Maximum update depth exceeded".
  const handleSubmitted = useCallback(() => {
    setJustSubmitted(true);
    clear();
  }, [clear]);

  // Keep the portal mounted while the panel is showing a post-submit
  // confirmation, even though clear() has already emptied `items`.
  if (!mounted || (items.length === 0 && !isPanelOpen)) return null;

  return createPortal(
    <>
      {items.length > 0 && (
        <m.button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          aria-label={`Open your enquiry list (${items.length} ${items.length === 1 ? "property" : "properties"})`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          whileHover={{ y: -3 }}
          className="fixed bottom-12 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 bg-dark-deep text-cream shadow-[0_16px_40px_-12px_rgba(20,20,20,0.6)] transition-colors hover:border-gold md:bottom-14 md:left-8"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M4 4h2l1.6 9.6a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L20.5 8H7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9.5" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="17" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
          </svg>
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-sans text-[11px] font-semibold text-dark-deep">
            {items.length}
          </span>
        </m.button>
      )}

      <AnimatePresence>
        {isPanelOpen && (
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label="Your enquiry list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-dark-deep/70 backdrop-blur-xl p-0 sm:items-center sm:p-6"
            onClick={closePanel}
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
                onClick={closePanel}
                aria-label="Close enquiry list"
                className="absolute right-4 top-4 cursor-pointer p-2 text-ink-muted transition-colors hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                  <path d="M4 4l16 16M20 4L4 20" />
                </svg>
              </button>
              <span aria-hidden className="mb-5 block h-px w-12 bg-gold" />
              <h2 className="font-serif text-h3 text-ink">Your Enquiry List</h2>
              <p className="mb-8 mt-2 max-w-md text-pretty text-meta font-sans text-ink-muted">
                One message to our team, covering every property below.
              </p>

              {items.length === 0 && !justSubmitted ? (
                <p className="border border-border bg-white px-6 py-8 text-center font-sans text-body text-ink-muted">
                  Your enquiry list is empty.
                </p>
              ) : (
                <>
                  {items.length > 0 && (
                    <>
                      <ul className="mb-6 flex flex-col gap-4">
                        {items.map((item) => (
                          <li key={item.id} className="flex items-center gap-4 border-b border-border pb-4">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-ink/5">
                              {item.thumbnail && (
                                <Image
                                  src={item.thumbnail}
                                  alt={item.title}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="flex flex-1 flex-col gap-0.5">
                              <p className="font-serif text-body text-ink">{item.title}</p>
                              <p className="text-meta font-sans text-ink-muted">{item.location}</p>
                            </div>
                            <span className="font-sans text-meta text-ink">
                              {item.publicPrice != null ? formatIndianShort(item.publicPrice) : "POR"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemove(item)}
                              aria-label={`Remove ${item.title}`}
                              className="cursor-pointer p-2 text-ink-muted transition-colors hover:text-error"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 4l16 16M20 4L4 20" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>

                      {justRemoved && (
                        <div className="mb-6 flex items-center justify-between border border-border bg-white px-4 py-3">
                          <span className="font-sans text-meta text-ink-muted">
                            Removed &ldquo;{justRemoved.title}&rdquo;
                          </span>
                          <button
                            type="button"
                            onClick={handleUndo}
                            className="text-eyebrow cursor-pointer font-sans font-medium uppercase tracking-[0.15em] text-gold-deep hover:underline"
                          >
                            Undo
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={clear}
                        className="text-eyebrow mb-8 cursor-pointer font-sans font-medium uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-ink"
                      >
                        Clear all
                      </button>
                    </>
                  )}

                  <ContactForm
                    idPrefix="cart-"
                    propertyIds={items.map((i) => i.id)}
                    source="enquiry_cart"
                    onSuccess={handleSubmitted}
                  />
                </>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
