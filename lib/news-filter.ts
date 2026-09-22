/**
 * The /news relevance gate.
 *
 * Pure and Next-free on purpose, exactly like lib/emi.ts and lib/similar.ts:
 * scripts/check-news.mjs compiles this file on its own with plain tsc, which
 * cannot see Next's `fetch(..., { next: { revalidate } })` extension. Keeping
 * the predicate out of lib/news.ts is what makes it testable.
 */

/**
 * The article has to be about one of these places.
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
 * newsdata.io tags every article with categories. Anything it files under
 * one of these is dropped before any keyword is read.
 *
 * Politics is NOT here: once the property requirement went (below), civic
 * and development decisions ("UT plans split option for industrial plots")
 * are exactly the Tricity coverage the page wants, and the API files many
 * of them under politics.
 */
const EXCLUDED_CATEGORIES = new Set(["crime", "sports", "entertainment"]);

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
 * "assaulted". Inflections were walking straight through the gate. The few
 * stems that collide with ordinary words ARE bounded: "dead" (deadline),
 * "shot" (shot up), and "body" only as a body found (civic body, governing
 * body).
 */
const VIOLENT_RE =
  /\b(murder|rape|abduct|kidnap|assault|molest|suicide|kill|death|dead\b|shot\b|shoot|stab|bod(y|ies) (found|recovered)|terror|accident|crash|arrest|attack|clash|riot|firing|lynch|jail|sentenc|convict|imprison|prison)/i;

/**
 * Hospitality and events PR. A hotel is a "property" in its own press copy
 * ("Lords Hotels & Resorts showcases bespoke wedding celebrations"), which
 * put wedding marketing at the top of a market page.
 */
const LIFESTYLE_RE = /\b(wedding|celebrat|banquet|honeymoon|staycation)/i;

/**
 * Tricity news, minus crime (Sep 2026).
 *
 * The page used to require a property subject in the headline as well. That
 * left two or three stories a day, and the client asked for a fuller page
 * over a stricter one: "remove property filter and keep tricity". So:
 *   1. newsdata.io has not filed it under crime, sports or entertainment;
 *   2. the HEADLINE places it in the Tricity;
 *   3. neither mentions violence, sentencing or hospitality PR.
 * The search queries themselves (news-queries.ts) still ask for property
 * topics, so what arrives leans to local property and development news.
 *
 * The place has to be in the headline because a summary mention is often
 * incidental: "Ubud Hotels for Indian Travelers Exploring Bali" and an
 * Amritsar NRI event both passed on a passing "Chandigarh" in the summary.
 * The one allowance is "UT" (Chandigarh's administration, as local papers
 * write it) when the summary confirms it is Chandigarh.
 */
const UT_RE = /\bUT\b/;

export function isMarketStory(
  title: string,
  description: string | null,
  categories: readonly string[] = []
): boolean {
  if (categories.some((c) => EXCLUDED_CATEGORIES.has(c.toLowerCase()))) return false;
  const summary = description ?? "";
  const inTricity =
    TRICITY_RE.test(title) || (UT_RE.test(title) && /\bchandigarh\b/i.test(summary));
  const hay = `${title} ${summary}`;
  return inTricity && !VIOLENT_RE.test(hay) && !LIFESTYLE_RE.test(hay);
}
