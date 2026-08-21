/**
 * "Also Represented" ranking (R-45, second half).
 *
 * Was: every other listing in the same category, newest first — which put a
 * ₹90 L Zirakpur flat under a ₹6 Cr Chandigarh kothi because both are
 * "Residential". A buyer's notion of similar is locality, then
 * configuration, then budget, so those are what score.
 *
 * Pure and structurally typed on purpose: no DB import, no Drizzle types,
 * so scripts/check-features.mjs can exercise it directly.
 */

export type SimilarSubject = {
  id: number;
  category?: string | null;
  propertyType?: string | null;
  configuration?: string | null;
  city?: string | null;
  locality?: string | null;
  areaSqft?: number | null;
  publicPrice?: number | null;
};

/** Within a quarter either way reads as "the same bracket" to a buyer. */
const TOLERANCE = 0.25;

/** Below this, the listing has nothing in common worth showing as related. */
const MIN_SCORE = 2;

/** Two blank fields are not a match — an unset locality must not score. */
function sameValue(a: string | null | undefined, b: string | null | undefined): boolean {
  return Boolean(a) && a === b;
}

function within(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a == null || b == null || a <= 0 || b <= 0) return false;
  return Math.abs(a - b) / Math.max(a, b) <= TOLERANCE;
}

export function similarityScore(subject: SimilarSubject, candidate: SimilarSubject): number {
  let score = 0;
  // Locality subsumes city — a same-locality match already implies the city,
  // so scoring both would double-count one fact.
  if (sameValue(subject.locality, candidate.locality)) score += 4;
  else if (sameValue(subject.city, candidate.city)) score += 2;

  if (sameValue(subject.configuration, candidate.configuration)) score += 3;
  if (sameValue(subject.propertyType, candidate.propertyType)) score += 2;
  if (sameValue(subject.category, candidate.category)) score += 2;

  // Only when BOTH prices are published — a withheld price (R-13) is null
  // here, and scoring null against null would make every POR listing look
  // like a budget match for every other.
  if (within(subject.publicPrice, candidate.publicPrice)) score += 3;
  if (within(subject.areaSqft, candidate.areaSqft)) score += 2;

  return score;
}

/**
 * Highest-scoring candidates first, excluding the subject itself. Ties keep
 * the caller's order (Array.sort is stable), so equally-similar listings
 * still come through newest-first.
 */
export function rankSimilar<T extends SimilarSubject>(
  subject: SimilarSubject,
  candidates: readonly T[],
  limit = 3
): T[] {
  return candidates
    .filter((c) => c.id !== subject.id)
    .map((c) => ({ c, score: similarityScore(subject, c) }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => c);
}
