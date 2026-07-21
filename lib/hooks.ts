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
  onOutside: () => void
): void {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref, onOutside]);
}

/**
 * Overlay behavior: while `open`, body scroll is locked and (when `onClose`
 * is given) Escape closes.
 */
export function useModalLock(open: boolean, onClose?: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onKey =
      onClose && ((e: KeyboardEvent) => e.key === "Escape" && onClose());
    document.body.style.overflow = "hidden";
    if (onKey) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      if (onKey) window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}
