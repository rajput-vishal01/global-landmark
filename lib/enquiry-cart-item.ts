import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";

/**
 * Pure type + mapper, deliberately NOT in lib/enquiry-cart.ts: that file is
 * "use client" (it uses useSyncExternalStore), and Next.js forbids calling
 * any export of a client-boundary file directly from a Server Component —
 * only importing it as a rendered element is allowed. ListingCard and the
 * property detail page are Server Components that need to build a cart
 * item, so the mapper has to live on the server-safe side of the boundary.
 */
export type EnquiryCartItem = {
  id: number;
  slug: string;
  title: string;
  location: string;
  thumbnail: string | null;
  publicPrice: number | null;
};

/**
 * localStorage is user-editable — never trust it beyond a shape check.
 * Shared by the enquiry cart and the recently-viewed strip (R-45), which
 * persist the same item shape under different keys.
 */
export function isEnquiryCartItem(x: unknown): x is EnquiryCartItem {
  if (!x || typeof x !== "object") return false;
  const v = x as Record<string, unknown>;
  return typeof v.id === "number" && typeof v.slug === "string" && typeof v.title === "string";
}

/** Minimal shape stored per item — never the whole property object. */
export function toEnquiryCartItem(property: PublicPropertyWithMedia): EnquiryCartItem {
  return {
    id: property.id,
    slug: property.slug,
    title: property.title,
    location: property.location,
    thumbnail: property.images[0]?.url ?? null,
    publicPrice: property.publicPrice,
  };
}
