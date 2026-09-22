"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

/** False during SSR/hydration, true after mount — for portal/window gates. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/** Fires when a pointer goes down outside the ref'd element. */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  /**
   * Receives the event, so a caller whose popup is portalled out of `ref` can
   * check the target itself before treating the click as outside. Optional
   * parameter, so the callers that ignore it are unchanged.
   */
  onOutside: (event: PointerEvent) => void
): void {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside(e);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref, onOutside]);
}

/**
 * Every overlay open right now, oldest first. Overlays can stack (a timed
 * popup over a dialog, a lightbox over a form), so the scroll lock is held
 * until the LAST one closes, and Escape closes only the topmost.
 */
const openModals: symbol[] = [];

/** True while any overlay is open — timed popups check it before showing. */
export function isModalOpen(): boolean {
  return openModals.length > 0;
}

/**
 * Overlay behavior: while `open`, body scroll is locked and (when `onClose`
 * is given) Escape closes this overlay if it is the topmost one.
 */
export function useModalLock(open: boolean, onClose?: () => void): void {
  useEffect(() => {
    if (!open) return;
    const id = Symbol("modal");
    openModals.push(id);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose && openModals.at(-1) === id) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      openModals.splice(openModals.indexOf(id), 1);
      if (!openModals.length) document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}
