/**
 * Home-loan EMI maths (R-41). Pure, client-side only — no rate feed, no
 * eligibility check, no bank API. The visitor's own numbers in, a monthly
 * figure out.
 *
 * Kept out of the component so the arithmetic is importable by
 * scripts/check-features.mjs; a money screen that is confidently wrong is
 * worse than no calculator at all.
 */

export type EmiResult = {
  /** Equated monthly instalment, rounded to whole rupees. */
  monthly: number;
  /** Principal + interest over the full tenure. */
  totalPayable: number;
  totalInterest: number;
};

/**
 * Standard amortising-loan EMI:
 *
 *   E = P · r · (1+r)^n / ((1+r)^n − 1)
 *
 * with `r` the MONTHLY rate and `n` the tenure in months. A zero rate makes
 * that expression 0/0, so it is special-cased to straight-line repayment
 * rather than left to produce NaN on screen.
 */
export function computeEmi(
  principal: number,
  annualRatePercent: number,
  tenureYears: number
): EmiResult {
  const months = Math.round(tenureYears * 12);
  if (!(principal > 0) || months <= 0) {
    return { monthly: 0, totalPayable: 0, totalInterest: 0 };
  }

  const r = annualRatePercent / 12 / 100;
  const monthly =
    r <= 0
      ? principal / months
      : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);

  const rounded = Math.round(monthly);
  const totalPayable = rounded * months;
  return {
    monthly: rounded,
    totalPayable,
    totalInterest: Math.max(0, totalPayable - principal),
  };
}

/**
 * Slider defaults. Seeded from the published price at the market-standard
 * 80% loan-to-value; when the price is withheld (R-13) there is nothing to
 * seed from, so a round ₹50 L stands in and the visitor drags from there.
 *
 * ponytail: 8.5% is a hardcoded prevailing-rate guess. Move it to
 * site_settings if the client ever wants to keep it current without a deploy.
 */
export const EMI_DEFAULTS = {
  ratePercent: 8.5,
  tenureYears: 20,
  fallbackLoan: 5_000_000,
  loanToValue: 0.8,
  minLoan: 500_000,
  maxLoan: 100_000_000,
  step: 100_000,
} as const;

/** Seed loan amount for a listing, clamped to the slider's own range. */
export function seedLoanAmount(publicPrice: number | null): number {
  const raw =
    publicPrice != null && publicPrice > 0
      ? publicPrice * EMI_DEFAULTS.loanToValue
      : EMI_DEFAULTS.fallbackLoan;
  const snapped = Math.round(raw / EMI_DEFAULTS.step) * EMI_DEFAULTS.step;
  return Math.min(EMI_DEFAULTS.maxLoan, Math.max(EMI_DEFAULTS.minLoan, snapped));
}
