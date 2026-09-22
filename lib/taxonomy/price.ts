/**
 * Price and charges (CFF group 6).
 *
 * Demand price, negotiability and the per-sq.ft rate live on `properties`;
 * every other charge is a row in `property_charges` so the list can grow
 * without a migration and each charge can carry its own basis.
 *
 * Circle rate is deliberately NOT here — it lives on `property_internal`
 * and never reaches a public query.
 */

/** Indian currency formatting — one formatter, used everywhere including email. */
export function formatRupees(paise: number): string {
  return `₹${Math.round(paise).toLocaleString("en-IN")}`;
}

/**
 * Lakh/Crore shorthand for headline figures. Below a lakh the plain grouped
 * number reads better than "0.4 Lakh".
 */
export function formatIndianShort(amount: number): string {
  if (amount >= 10_000_000) return `₹${trimZeros(amount / 10_000_000)} Cr`;
  if (amount >= 100_000) return `₹${trimZeros(amount / 100_000)} Lakh`;
  return formatRupees(amount);
}

function trimZeros(n: number): string {
  // 1.50 -> "1.5", 2.00 -> "2" — trailing zeros read as false precision.
  return n.toFixed(2).replace(/\.?0+$/, "");
}

export type Charge = {
  chargeType: string;
  amount: number;
  basis: string;
  isIncludedInDemand: boolean;
};

/**
 * All-in total for the admin (R-13). Charges already included in the demand
 * price are skipped rather than double-counted; percent and per-sq.ft
 * charges are resolved against the demand price and area respectively.
 *
 * Returns null when the demand price is unknown — an "all-in" built on a
 * missing base would be a confidently wrong number on a money screen.
 */
export function allInPrice(
  demandPrice: number | null,
  charges: Charge[],
  areaSqft: number | null
): number | null {
  if (demandPrice == null) return null;
  let total = demandPrice;
  for (const c of charges) {
    if (c.isIncludedInDemand) continue;
    if (c.basis === "percent") total += (demandPrice * c.amount) / 100;
    else if (c.basis === "per_sqft") total += areaSqft != null ? c.amount * areaSqft : 0;
    else total += c.amount;
  }
  return Math.round(total);
}

/**
 * Public price bands (R-13). Buyers filter by budget, and this keeps that
 * possible even when the exact price is withheld — the band is derived, not
 * stored, so it can never disagree with the price it came from.
 */
const PRICE_BANDS = [
  { value: "under-50l", label: "Under ₹50 Lakh", min: 0, max: 5_000_000 },
  { value: "50l-1cr", label: "₹50 Lakh – ₹1 Cr", min: 5_000_000, max: 10_000_000 },
  { value: "1cr-2cr", label: "₹1 – 2 Cr", min: 10_000_000, max: 20_000_000 },
  { value: "2cr-5cr", label: "₹2 – 5 Cr", min: 20_000_000, max: 50_000_000 },
  { value: "5cr-plus", label: "₹5 Cr+", min: 50_000_000, max: Infinity },
] as const;

export type PriceBand = (typeof PRICE_BANDS)[number]["value"];

export function priceBand(amount: number | null): PriceBand | null {
  if (amount == null || amount < 0) return null;
  return PRICE_BANDS.find((b) => amount >= b.min && amount < b.max)?.value ?? null;
}
