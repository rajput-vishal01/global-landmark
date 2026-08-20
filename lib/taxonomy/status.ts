/**
 * Listing lifecycle, provenance and ownership vocabulary (CFF groups 1, 8).
 *
 * Everything here is INTERNAL — the client was explicit that reference
 * code, dates, who added a listing and its status are for the admin panel
 * only. The one place status reaches the public site is indirectly, through
 * `isPubliclyVisible` deciding whether a listing renders at all.
 */

/** CFF group 1, exactly as the client wrote them. */
export const LISTING_STATUSES = [
  "Available",
  "Reserved",
  "Token Received",
  "Under Agreement",
  "Sold",
  "Rented",
  "Hold",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Admin badge colours, using the existing @theme tokens only. */
export const STATUS_BADGE: Record<ListingStatus, string> = {
  Available: "border-gold bg-gold/10 text-gold-deep",
  Reserved: "border-gold-deep/40 bg-gold-deep/5 text-gold-deep",
  "Token Received": "border-gold-deep/40 bg-gold-deep/5 text-gold-deep",
  "Under Agreement": "border-ink-muted/40 bg-ink/5 text-ink-muted",
  Sold: "border-ink/30 bg-ink/10 text-ink",
  Rented: "border-ink/30 bg-ink/10 text-ink",
  Hold: "border-error/40 bg-error/5 text-error",
};

/** A listing is only ever public while it is genuinely available. */
export const PUBLIC_STATUSES: readonly ListingStatus[] = ["Available"];

/**
 * The single gate every public query, the detail route and the sitemap must
 * agree on. Both conditions matter: a published listing that has been sold
 * must disappear, and an Available listing still in draft must not appear.
 *
 * ponytail: `Reserved` is treated as NOT public — the conservative reading,
 * since showing a reserved property invites enquiries that cannot convert.
 * CONFIRM with the client; flipping it is one entry in PUBLIC_STATUSES.
 */
export function isPubliclyVisible(
  publicationState: string,
  listingStatus: string
): boolean {
  return (
    publicationState === "published" &&
    (PUBLIC_STATUSES as readonly string[]).includes(listingStatus)
  );
}

/** Draft exists because a half-entered listing mid-call is normal. */
export const PUBLICATION_STATES = ["draft", "published", "archived"] as const;

export type PublicationState = (typeof PUBLICATION_STATES)[number];

/** CFF group 1 — provenance. `sourceName` names the dealer or owner. */
export const ADDED_BY = ["Global Landmark", "Dealer", "Owner"] as const;

/** CFF group 8. */
export const SELLER_CATEGORIES = ["Owner", "Builder", "Investor", "NRI", "Bank"] as const;

export const OWNER_TYPES = ["Individual", "Builder", "Investor", "NRI"] as const;

/**
 * Reference code (R-07): GL-<CITY>-<YY>-<seq>, e.g. GL-PKL-26-0142.
 * Generated once on insert and never reused, so a deleted listing's code
 * does not come back attached to a different property.
 */
const CITY_CODES: Record<string, string> = {
  Chandigarh: "CHD",
  Panchkula: "PKL",
  "Panchkula Extension": "PKX",
  Mohali: "MOH",
  Zirakpur: "ZKP",
  "New Chandigarh": "NCH",
  Derabassi: "DRB",
  Kharar: "KHR",
  Mullanpur: "MLP",
};

/** Unknown or missing city falls back to GEN rather than failing the save. */
export function cityCode(city: string | null | undefined): string {
  return (city && CITY_CODES[city]) || "GEN";
}

export function refCode(city: string | null | undefined, year: number, seq: number): string {
  const yy = String(year % 100).padStart(2, "0");
  return `GL-${cityCode(city)}-${yy}-${String(seq).padStart(4, "0")}`;
}

/** Days a listing has been on the market; null once it is no longer live. */
export function daysOnMarket(listedAt: Date, status: string, now = new Date()): number | null {
  if (status === "Sold" || status === "Rented") return null;
  return Math.max(0, Math.floor((now.getTime() - listedAt.getTime()) / 86_400_000));
}
