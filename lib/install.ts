"use client";

import { useSyncExternalStore } from "react";

/** Chrome/Edge fire this; it is not in lib.dom yet. */
export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * One place that owns "can this browser install us, and has someone asked".
 *
 * A module store rather than state in a component, for two reasons:
 *
 * 1. `beforeinstallprompt` fires ONCE and is not re-fired. Listening from
 *    inside a useEffect loses it outright whenever the browser gets there
 *    before React hydrates — which is most of the time on a fast reload.
 *    Attaching at module scope means the listener exists as soon as the
 *    chunk runs.
 * 2. Two components offer the install now (the timed card and the nav
 *    button). If each kept its own copy of the event, whichever one was
 *    clicked second would call `prompt()` on a spent event, which throws.
 *    Here there is one event and consuming it clears it for both.
 */
let event: InstallEvent | null = null;
let requested = false;
const subscribers = new Set<() => void>();

function emit() {
  for (const notify of subscribers) notify();
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Keep it: this is the only handle on the real install dialog, and
    // opening that dialog has to happen inside a user gesture later.
    e.preventDefault();
    event = e as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    event = null;
    requested = false;
    emit();
  });
}

/** The kept event, or null when this browser has not offered one. */
export function useInstallEvent(): InstallEvent | null {
  return useSyncExternalStore(
    subscribe,
    () => event,
    () => null
  );
}

/** True once something has explicitly asked for the install card. */
export function useInstallRequested(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => requested,
    () => false
  );
}

/** Opens the card on demand — the nav button's route in on iOS, which has no API. */
export function requestInstall() {
  requested = true;
  emit();
}

export function clearInstallRequest() {
  requested = false;
  emit();
}

/**
 * Opens the browser's own install dialog. Must be called from a click:
 * Chrome rejects a prompt that did not come from a user gesture.
 */
export async function runInstall(): Promise<void> {
  const pending = event;
  if (!pending) return;
  // Drop it before prompting, not after: the event is single-use, and a
  // second call on it throws.
  event = null;
  emit();
  await pending.prompt();
  await pending.userChoice;
}

/** iOS Safari fires nothing and exposes no API — it only gets instructions. */
export function isIos(): boolean {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Already installed — standalone window, or iOS's own flag. */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Whether an install offer is worth showing at all: something to install,
 * a way to install it, and not already done.
 *
 * Not a hook for `isInstalled` — display-mode does not change under a live
 * page except by installing, which fires `appinstalled` and re-renders
 * everything here anyway.
 */
export function useCanOfferInstall(): boolean {
  const event = useInstallEvent();
  return (event !== null || isIos()) && !isInstalled();
}
