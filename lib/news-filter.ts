/**
 * The /news relevance gate.
 *
 * Pure and Next-free on purpose, exactly like lib/emi.ts and lib/similar.ts:
 * scripts/check-news.mjs compiles this file on its own with plain tsc, which
 * cannot see Next's `fetch(..., { next: { revalidate } })` extension. Keeping
 * the predicate out of lib/news.ts is what makes it testable.
 */

/**
 * The article has to be about one of these places...
 *
 * GMADA counts as a place: it is the Greater Mohali Area Development
 * Authority, and its land and plot stories are the single most relevant
 * coverage this page can carry — but a headline like "ED lens on a
 * Rs 40-crore GMADA land waiver" never names a city, so a pure city list
 * threw it away.
 */
const TRICITY_RE =
  /\b(chandigarh|panchkula|zirakpur|mohali|tricity|kharar|derabassi|mullanpur|banur|new chandigarh|gmada)\b/i;

/** ...and about property, not merely mention a place in passing. */
const PROPERTY_RE =
  /\b(real[- ]estate|realty|property|properties|housing|homebuyer|builder|apartment|flat|plot|township|rera|gmada|residential|commercial space|land pooling|home loan|circle rate|collector rate|stamp duty|possession)\b/i;

/**
 * Violent crime and casualty copy, excluded even from property stories.
 *
 * Financial-irregularity words are deliberately NOT here: "ED lens on a
 * Rs 40-crore GMADA waiver" is a land story a buyer in this market
 * genuinely wants, and filtering "fraud", "scam" or "probe" would remove
 * the most relevant coverage there is. What this catches is the other kind
 * — "property dealer shot dead in Zirakpur" is about a property dealer,
 * not about the property market.
 *
 * No trailing \b on the stems: the previous version used \bmurder\b, which
 * matches "murder" but not "murdered", and \bassault\b, which missed
 * "assaulted". Inflections were walking straight through the gate.
 */
const VIOLENT_RE =
  /\b(murder|rape|abduct|kidnap|assault|molest|suicide|kill|death|dead|shot|shoot|stab|body|terror|accident|crash|arrest|attack|clash|riot|firing|lynch)/i;

/**
 * Both gates are hard requirements: the story must be about the Tricity AND
 * about property, and must not be violent-crime copy.
 *
 * There used to be a second tier — any Tricity story that was not crime —
 * to keep the grid full on thin days. It let through exactly what you would
 * expect once you notice that Mohali has an international cricket stadium:
 * match reports, politics, weather. A brokerage's market page showing
 * cricket is worse than one showing four stories, so the tier is gone and
 * the page's honest empty state does the work instead.
 */
export function isMarketStory(title: string, description: string | null): boolean {
  const hay = `${title} ${description ?? ""}`;
  return TRICITY_RE.test(hay) && PROPERTY_RE.test(hay) && !VIOLENT_RE.test(hay);
}
