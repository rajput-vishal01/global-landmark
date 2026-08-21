import { isEnquiryCartItem, type EnquiryCartItem } from "@/lib/enquiry-cart-item";

/**
 * Recently-viewed listings (R-45). localStorage, no accounts, no server —
 * the same "no login required" constraint the enquiry cart works under.
 *
 * Deliberately NOT a useSyncExternalStore store like lib/enquiry-cart.ts:
 * this list has exactly one consumer (the strip) and is read once on mount,
 * so there is no cross-component state to keep in sync and none of that
 * boilerplate earns its place. Reuses the cart's item shape rather than
 * inventing a second near-identical one.
 */

const STORAGE_KEY = "gld-recently-viewed";
const MAX_ITEMS = 8;

/** Never throws: a private-mode / quota-blocked localStorage must not break a page. */
export function readRecentlyViewed(): EnquiryCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isEnquiryCartItem).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

/**
 * Records a view, most-recent-first. Re-visiting a property moves it back to
 * the front instead of duplicating it, so the strip reflects order of
 * interest rather than order of discovery.
 */
export function recordView(item: EnquiryCartItem): EnquiryCartItem[] {
  const next = [item, ...readRecentlyViewed().filter((i) => i.id !== item.id)].slice(
    0,
    MAX_ITEMS
  );
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota or private mode — the strip is a convenience, not a feature
      // worth throwing over.
    }
  }
  return next;
}
