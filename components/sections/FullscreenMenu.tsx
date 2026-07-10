"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MENU_GROUPS } from "./nav-links";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Fullscreen overlay menu — blurred page behind, centered wordmark,
 * numbered link groups, contact/office/social row at the bottom.
 * Portaled to <body>: the header's backdrop-filter makes it the containing
 * block for fixed descendants, which would clip this overlay to the bar.
 */
export function FullscreenMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Hydration-safe client check: false during SSR, true after mount.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-0 z-50 overflow-y-auto bg-dark-deep/70 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between px-5 py-6 md:px-12">
            <span aria-hidden className="w-8" />
            <Link
              href="/"
              onClick={onClose}
              className="font-serif text-2xl uppercase tracking-[0.18em] text-cream md:text-3xl"
            >
              Global Landmark
            </Link>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 text-cream/80 transition-colors duration-300 hover:text-cream"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </button>
          </div>

          <motion.nav
            initial="closed"
            animate="open"
            variants={{
              open: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
              closed: {},
            }}
            className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 md:py-20"
          >
            {MENU_GROUPS.map((group) => (
              <motion.div
                key={group.n}
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: 20 },
                }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex items-baseline gap-6"
              >
                <span className="text-eyebrow font-sans text-gold-highlight/70">
                  {group.n}
                </span>
                <Link
                  href={group.href}
                  onClick={onClose}
                  className="font-serif text-h2 uppercase tracking-[0.06em] text-cream transition-colors duration-300 hover:text-gold-highlight"
                >
                  {group.label}
                </Link>
              </motion.div>
            ))}
          </motion.nav>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
            className="mx-auto grid max-w-6xl grid-cols-1 gap-8 border-t border-cream/15 px-6 py-10 md:grid-cols-3"
          >
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-cream/50">
                Contact
              </span>
              <p className="text-meta font-sans text-cream/80">
                inquiries@globallandmark.com
                <br />
                +1 (212) 555-0184
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-cream/50">
                Office
              </span>
              <p className="text-meta font-sans text-cream/80">
                One Meridian Plaza, Suite 4400
                <br />
                New York, NY 10001
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-cream/50">
                Follow
              </span>
              <p className="text-meta font-sans text-cream/80">
                <a href="#" className="transition-colors hover:text-cream">Instagram</a>
                {"  ·  "}
                <a href="#" className="transition-colors hover:text-cream">LinkedIn</a>
                {"  ·  "}
                <a href="#" className="transition-colors hover:text-cream">Facebook</a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
