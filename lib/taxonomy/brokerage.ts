/**
 * Brokerage arithmetic (R-31) — internal always, admin/CRM only.
 *
 * Percent is stored in basis points (1% = 100bp) on crm_deals so a stored
 * "2%" never drifts through repeated float rounding on a money figure.
 */

export const DEAL_STAGES = [
  "Enquiry",
  "Site Visit",
  "Negotiation",
  "Token",
  "Agreement",
  "Registry",
  "Closed",
  "Lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const CLOSED_STAGES: readonly DealStage[] = ["Closed", "Lost"];

export function percentToBp(percent: number): number {
  return Math.round(percent * 100);
}

export function bpToPercent(bp: number): number {
  return bp / 100;
}

/**
 * The brokerage figure a deal actually owes: an explicit override always
 * wins (an admin hand-correcting a negotiated figure), otherwise it's
 * computed from dealValue * percent. Null when there isn't enough to
 * compute from — a blank money screen beats a confidently wrong one.
 */
export function brokerageAmount(
  dealValue: number | null,
  brokeragePercentBp: number | null,
  override: number | null
): number | null {
  if (override != null) return override;
  if (dealValue == null || brokeragePercentBp == null) return null;
  return Math.round((dealValue * brokeragePercentBp) / 10_000);
}

/**
 * Pending is NEVER stored (R-31) — always the amount minus every payment
 * entry, so it can never disagree with a payment added after the fact.
 * A null total amount means "not computed yet," not "fully paid."
 */
export function brokeragePending(
  totalAmount: number | null,
  payments: { amount: number }[]
): number | null {
  if (totalAmount == null) return null;
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  return totalAmount - paid;
}

export function isClosedStage(stage: string): boolean {
  return (CLOSED_STAGES as readonly string[]).includes(stage);
}
