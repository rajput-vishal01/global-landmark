"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isEnquiryCartItem, type EnquiryCartItem } from "@/lib/enquiry-cart-item";

export type { EnquiryCartItem };

/**
 * Enquiry shortlist (R-05) — "add to enquiry" cart. Backed by localStorage
 * (no accounts, per spec) and exposed via useSyncExternalStore so every
 * consumer (card button, detail-page button, floating dock) reads the same
 * live value with no prop drilling and no hydration mismatch: the server
 * snapshot is always `[]`, matching the first client render, then the real
 * value takes over post-hydration — the same trick lib/hooks.ts's
 * useMounted() uses. The native `storage` event keeps other tabs in sync.
 */

const STORAGE_KEY = "gld-enquiry-cart";
const MAX_ITEMS = 20;
/** Fired on a successful add so the dock can pop open — R-05: "adding one
 * property opens the panel with a one-tap send". */
export const ENQUIRY_OPEN_EVENT = "gld-enquiry-open";

// localStorage is user-editable — never trust it beyond a shape check
// (isEnquiryCartItem lives beside the type, shared with recently-viewed).
function parseCart(raw: string | null): EnquiryCartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEnquiryCartItem).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

const EMPTY: EnquiryCartItem[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedItems: EnquiryCartItem[] = EMPTY;

function getSnapshot(): EnquiryCartItem[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parseCart(raw);
  }
  return cachedItems;
}

// Must return the SAME reference every call — useSyncExternalStore warns
// (and effectively loops re-rendering) if getServerSnapshot's result isn't
// stable across calls, which a fresh `[]` literal is not.
function getServerSnapshot(): EnquiryCartItem[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeCart(items: EnquiryCartItem[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  cachedRaw = null; // force getSnapshot to re-read on next call
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) listeners.forEach((l) => l());
  });
}

export function useEnquiryCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((item: EnquiryCartItem) => {
    const current = getSnapshot();
    if (current.some((i) => i.id === item.id) || current.length >= MAX_ITEMS) return;
    writeCart([...current, item]);
    window.dispatchEvent(new Event(ENQUIRY_OPEN_EVENT));
  }, []);

  const remove = useCallback((id: number) => {
    writeCart(getSnapshot().filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const has = useCallback((id: number) => items.some((i) => i.id === id), [items]);

  return { items, add, remove, clear, has, isFull: items.length >= MAX_ITEMS };
}
