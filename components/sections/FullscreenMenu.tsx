"use client";

import { EASE } from "@/lib/motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { MENU_GROUPS } from "./nav-links";
import { PropertySearch } from "@/components/PropertySearch";
import { useModalLock, useMounted } from "@/lib/hooks";
import { COMPANY } from "@/lib/data";

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
  const mounted = useMounted();
  useModalLock(open, onClose);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          data-lenis-prevent
          className="fixed inset-0 z-50 overflow-y-auto bg-dark-deep/70 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between px-5 py-6 md:px-12">
            <span aria-hidden className="w-8" />
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 whitespace-nowrap font-serif uppercase text-cream sm:gap-3"
            >
              <Image
                src="/logo.png"
                alt=""
                width={56}
                height={56}
                className="h-11 w-11 shrink-0 object-contain md:h-14 md:w-14"
              />
              <span className="text-lg tracking-[0.14em] sm:text-2xl sm:tracking-[0.18em] md:text-3xl">
                {COMPANY.name}
              </span>
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

          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
            className="mx-auto max-w-6xl px-6 pt-6"
          >
            <PropertySearch
              tone="dark"
              placeholder="Search residences, locations, projects"
              className="max-w-md"
            />
          </m.div>

          <m.nav
            initial="closed"
            animate="open"
            variants={{
              open: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
              closed: {},
            }}
            className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 md:py-20"
          >
            {MENU_GROUPS.map((group) => (
              <m.div
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
              </m.div>
            ))}
          </m.nav>

          <m.div
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
                {COMPANY.email}
                <br />
                {COMPANY.phone} · {COMPANY.phoneAlt}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-cream/50">
                Office
              </span>
              <p className="text-meta font-sans text-cream/80">
                {COMPANY.addressLines.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-cream/50">
                Follow
              </span>
              <p className="text-meta font-sans text-cream/80">
                {COMPANY.socials.filter((s) => s.href.startsWith("http")).map((social, i) => (
                  <span key={social.label}>
                    {i > 0 && "  ·  "}
                    <a href={social.href} className="transition-colors hover:text-cream">
                      {social.label}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
