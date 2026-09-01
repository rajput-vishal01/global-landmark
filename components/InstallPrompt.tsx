"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { EASE } from "@/lib/motion";
import { useMounted } from "@/lib/hooks";

/** Chrome/Edge fire this; it is not in lib.dom yet. */
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "gld-install-dismissed";
/** A month. Long enough that saying no is respected, short enough to re-offer. */
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

/** Public pages already throw a lead pop-up at 10s; wait it out. */
const DELAY_PUBLIC_MS = 45_000;
/** The panel has no competing pop-up, and it is where installing actually pays. */
const DELAY_ADMIN_MS = 8_000;
/** How often to re-check once another dialog has pushed us back. */
const RETRY_MS = 5_000;

function snoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() < until;
  } catch {
    // Private mode: treat as not snoozed but never throw.
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    /* nothing to do */
  }
}

/** Already installed — standalone window, or iOS's own flag. */
function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Phone-sized viewport, as an external store rather than state-in-an-effect:
 * the media query IS the source of truth, and this keeps the copy correct if
 * the window is resized while the card is open. Server snapshot is `false`,
 * so SSR renders the desktop wording and never mismatches on hydration
 * (the card itself does not render until mounted anyway).
 */
const SMALL_SCREEN = "(max-width: 767px)";

function subscribeToWidth(onChange: () => void) {
  const mq = window.matchMedia(SMALL_SCREEN);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Offers to install the app, in the form that platform actually supports.
 *
 * Three cases, because "install" is not one mechanism:
 *
 * 1. Chrome, Edge and Android fire `beforeinstallprompt`. We keep the event
 *    and hand it back on click — that is the only way to open the real
 *    install dialog, and it has to be a user gesture.
 * 2. iOS Safari fires nothing and has no API. The only route is Share →
 *    Add to Home Screen, so it gets instructions rather than a dead button.
 * 3. Anything else (desktop Safari, Firefox) gets nothing, because a button
 *    that cannot install is worse than no button.
 *
 * The copy follows the screen, not the OS: a phone is asked to add to the
 * home screen, a desktop to install a shortcut, since those are the words
 * each platform uses for the thing that appears afterwards.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const isSmall = useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(SMALL_SCREEN).matches,
    () => false
  );
  const mounted = useMounted();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  const close = useCallback(() => {
    snooze();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (isInstalled() || snoozed()) return;
    // The login screen is the wrong moment to ask for anything.
    if (pathname === "/admin/login") return;

    const delay = isAdmin ? DELAY_ADMIN_MS : DELAY_PUBLIC_MS;

    const onPrompt = (e: Event) => {
      // Keep the event: Chrome only lets us open the dialog through it.
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Never stack on top of another dialog (the lead pop-up, a delete
    // confirmation) — that is the moment this reads as spam. But wait it
    // out rather than giving up: the lead pop-up opens at 10s and stays
    // until dismissed, so a one-shot check at 45s found it still open and
    // the offer never appeared on the public site at all.
    let timer: ReturnType<typeof setTimeout>;
    const tryShow = () => {
      if (document.querySelector("[role=dialog]")) {
        timer = setTimeout(tryShow, RETRY_MS);
        return;
      }
      setVisible(true);
    };
    timer = setTimeout(tryShow, delay);

    const onInstalled = () => {
      snooze();
      setVisible(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(timer);
    };
  }, [pathname, isAdmin]);

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    // Either way the question has been answered; do not ask again.
    snooze();
    setEvent(null);
    setVisible(false);
  }

  if (!mounted || !visible) return null;
  // Nothing installable and no iOS instructions to give: stay silent.
  if (!event && !isIos()) return null;

  const addLabel = isSmall ? "Add to home screen" : "Install as a shortcut";
  const body = isSmall
    ? "Open it like an app, straight from your home screen — no browser, works offline."
    : "Install it as a desktop shortcut, in its own window with quick links to listings and leads.";

  return createPortal(
    <AnimatePresence>
      <m.div
        role="dialog"
        aria-label="Install this app"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.4, ease: EASE }}
        // Both bottom corners of the public site are taken — WhatsApp on
        // the right, the enquiry basket on the left — so this stacks ABOVE
        // the left one: that FAB is 56px tall at bottom-12, i.e. it ends at
        // 104px, and bottom-32 starts at 128. The panel has no docks, so
        // there it just sits in the corner.
        className={`fixed z-[45] w-[min(22rem,calc(100vw-2rem))] border border-border bg-cream p-5 shadow-[0_24px_60px_-24px_rgba(20,20,20,0.45)] ${
          isAdmin ? "bottom-5 right-5" : "bottom-32 left-5 md:bottom-36 md:left-8"
        }`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Not now"
          className="absolute right-3 top-3 cursor-pointer p-1 text-ink-muted transition-colors hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l16 16M20 4L4 20" />
          </svg>
        </button>

        <span aria-hidden className="mb-3 block h-px w-10 bg-gold" />
        <p className="font-serif text-h4 leading-snug text-heading">{addLabel}</p>
        <p className="mt-2 text-meta font-sans leading-relaxed text-ink-muted">{body}</p>

        {iosHelp ? (
          // iOS has no install API — these are the actual taps.
          <ol className="mt-4 flex list-decimal flex-col gap-1.5 pl-4 text-meta font-sans text-ink">
            <li>Tap the Share button in Safari&rsquo;s toolbar.</li>
            <li>Scroll and choose &ldquo;Add to Home Screen&rdquo;.</li>
            <li>Tap Add — the icon appears with your apps.</li>
          </ol>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => (event ? install() : setIosHelp(true))}
              className="text-eyebrow cursor-pointer bg-cta px-5 py-2.5 font-sans font-semibold uppercase tracking-[0.18em] text-cta-ink transition-colors hover:bg-cta-hover"
            >
              {event ? "Install" : "Show me how"}
            </button>
            <button
              type="button"
              onClick={close}
              className="text-meta cursor-pointer font-sans text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink"
            >
              Not now
            </button>
          </div>
        )}
      </m.div>
    </AnimatePresence>,
    document.body
  );
}
