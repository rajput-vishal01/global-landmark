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

/**
 * ...and be ABOUT property. This one is tested against the HEADLINE only.
 *
 * It used to be tested against headline + summary, which is how crime kept
 * getting through: a court or police story names Chandigarh and mentions a
 * seized "property" once in its summary, and passed. A story that is about
 * the property market says so in its headline. Plurals are listed because
 * the trailing \b stops "flat" from matching "flats".
 */
const PROPERTY_RE =
  /\b(real[- ]estate|realty|property|properties|housing|homebuyers?|homes|builders?|apartments?|flats?|plots?|villas?|townships?|rera|gmada|residential|commercial space|land pooling|home loans?|circle rates?|collector rates?|stamp duty|possession)\b/i;

/**
 * newsdata.io tags every article with categories. Anything it files under
 * one of these is not market news whatever its words say, so it is dropped
 * before any keyword is read.
 */
const EXCLUDED_CATEGORIES = new Set(["crime", "politics", "sports", "entertainment", "health"]);

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
 * Sentencing is here too ("ED secures 18 months' jail for postal official",
 * which named Chandigarh and a seized property and so passed both gates).
 * A probe into a land deal is market news; who went to prison is not.
 *
 * No trailing \b on the stems: the previous version used \bmurder\b, which
 * matches "murder" but not "murdered", and \bassault\b, which missed
 * "assaulted". Inflections were walking straight through the gate.
 */
const VIOLENT_RE =
  /\b(murder|rape|abduct|kidnap|assault|molest|suicide|kill|death|dead|shot|shoot|stab|body|terror|accident|crash|arrest|attack|clash|riot|firing|lynch|jail|sentenc|convict|imprison|prison)/i;

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
/**
 * Hospitality and events PR. A hotel is a "property" in its own press copy
 * ("Lords Hotels & Resorts showcases bespoke wedding celebrations"), which
 * put wedding marketing at the top of a market page.
 */
const LIFESTYLE_RE = /\b(wedding|celebrat|banquet|honeymoon|staycation)/i;

/**
 * Four gates, all required:
 *   1. newsdata.io has not filed it under crime, politics, sports, etc.;
 *   2. the HEADLINE is about property;
 *   3. the headline or summary places it in the Tricity;
 *   4. neither mentions violence, sentencing or hospitality PR.
 */
export function isMarketStory(
  title: string,
  description: string | null,
  categories: readonly string[] = []
): boolean {
  if (categories.some((c) => EXCLUDED_CATEGORIES.has(c.toLowerCase()))) return false;
  const hay = `${title} ${description ?? ""}`;
  return (
    PROPERTY_RE.test(title) &&
    TRICITY_RE.test(hay) &&
    !VIOLENT_RE.test(hay) &&
    !LIFESTYLE_RE.test(hay)
  );
}
