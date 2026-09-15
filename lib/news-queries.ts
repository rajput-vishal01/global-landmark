/** The newsdata.io search queries. Dependency-free so scripts/check-news.mjs can compile and check them on their own. */

/**
 * Tricity property coverage from newsdata.io.
 *
 * Three things about the free plan shape this file, all verified against the
 * live API rather than assumed:
 *
 * 1. `q` is rejected over 100 characters ("UnsupportedQueryLength"), so the
 *    city list and the real-estate vocabulary cannot go in one query. They
 *    are split across several short ones and merged here instead.
 * 2. Boolean AND / OR and parentheses DO work, which is what makes each of
 *    those short queries worth issuing — `(cities) AND (property words)`
 *    returns an order of magnitude fewer, better rows than cities alone.
 * 3. The archive endpoint is paid; `latest` only reaches back 48 hours and
 *    returns 10 rows a page. Tricity property news is thin at that window,
 *    so we page a little deeper per query to have enough to show.
 *
 * `q` matches anywhere in the body, which alone lets through "a view of the
 * Residency Road in Srinagar" — hence the relevance gate in news-filter.ts: an
 * article has to name a Tricity place AND a property subject in its own
 * title or description to survive.
 */
export const PROPERTY_QUERIES = [
  '(Chandigarh OR Panchkula OR Zirakpur) AND (property OR "real estate")',
  '(Mohali OR Tricity OR "New Chandigarh") AND (housing OR realty OR property)',
  '(Chandigarh OR Mohali OR Panchkula) AND (RERA OR GMADA OR township OR plots)',
  '(Zirakpur OR Kharar OR Derabassi OR Mullanpur) AND (flats OR builder OR land)',
];

/**
 * Two more property angles, added when the general-Tricity tier was
 * removed. They widen coverage WITHIN the property subject rather than
 * outside it, which is the only kind of widening this page wants.
 *
 * They were first written as two long queries (106 and 138 characters) and
 * newsdata.io answered both with a 422 on every refresh, so none of this
 * coverage ever reached the page. Split into five under the limit, covering
 * every original term. scripts/check-news.mjs now fails any query over 100.
 */
export const MARKET_QUERIES = [
  '(Chandigarh OR Mohali OR Panchkula) AND ("housing board" OR "master plan" OR sector)',
  '(Chandigarh OR Mohali OR Panchkula) AND "land acquisition"',
  '(Chandigarh OR Zirakpur OR Mohali OR Panchkula) AND ("property rates" OR "circle rate")',
  '(Chandigarh OR Zirakpur OR Mohali OR Panchkula) AND ("collector rate" OR "stamp duty")',
  '(Chandigarh OR Zirakpur OR Mohali OR Panchkula) AND "home loan"',
];

/** The free plan rejects `q` longer than this ("UnsupportedQueryLength"). */
export const MAX_QUERY_LENGTH = 100;
