export type NewsArticle = {
  title: string;
  link: string;
  source: string;
  excerpt: string | null;
  image: string | null;
  publishedAt: string | null;
};

/**
 * An article link is rendered straight into an `href` on /news, so it has
 * to be a real http(s) URL — React renders `javascript:` hrefs, it only
 * warns about them in development.
 *
 * newsdata.io is a trusted API and is not the threat here; the point is
 * that nothing downstream re-checks, and the admin path already applies
 * exactly this rule to hand-typed links (see services/actions.ts). An
 * article that fails is dropped rather than rendered unlinked — a news
 * card with no link is not worth a row.
 */
function isSafeHttpUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    return /^https?:$/.test(new URL(url).protocol);
  } catch {
    return false;
  }
}

type NewsdataResponse = {
  status: string;
  nextPage?: string | null;
  results?: {
    title?: string;
    link?: string;
    source_name?: string;
    source_id?: string;
    description?: string;
    image_url?: string;
    pubDate?: string;
  }[];
};

const REVALIDATE_SECONDS = 12 * 60 * 60; // client-requested 12h refresh

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
 * Residency Road in Srinagar" — hence the local relevance gate below: an
 * article has to name a Tricity place AND a property subject in its own
 * title or description to survive.
 */
const PROPERTY_QUERIES = [
  '(Chandigarh OR Panchkula OR Zirakpur) AND (property OR "real estate")',
  '(Mohali OR Tricity OR "New Chandigarh") AND (housing OR realty OR property)',
  '(Chandigarh OR Mohali OR Panchkula) AND (RERA OR GMADA OR township OR plots)',
  '(Zirakpur OR Kharar OR Derabassi OR Mullanpur) AND (flats OR builder OR land)',
];

/**
 * Tricity news that is not specifically about property.
 *
 * Property coverage of four small cities inside a 48-hour window is thin —
 * often one or two stories — and a page holding a single card reads as
 * broken. These fill the rest of the grid, and they rank strictly below the
 * property stories, so the top of the page is still the property desk.
 * The city gate below applies to them exactly as it does to the others: a
 * story that is not about the Tricity never appears either way.
 */
const REGIONAL_QUERIES = [
  "Chandigarh OR Panchkula OR Zirakpur OR Mohali",
  'Tricity OR "New Chandigarh" OR Kharar OR Derabassi',
];

/** Pages pulled per query. 10 rows a page, and the 48h window rarely holds more. */
const PAGES_PER_QUERY = 2;

/** The article has to be about one of these places... */
const TRICITY_RE =
  /\b(chandigarh|panchkula|zirakpur|mohali|tricity|kharar|derabassi|mullanpur|banur|new chandigarh)\b/i;

/** ...and about property, not merely mention a place in a crime report. */
const PROPERTY_RE =
  /\b(real[- ]estate|realty|property|properties|housing|homebuyer|builder|apartment|flat|plot|township|rera|gmada|residential|commercial space|land pooling|home loan|circle rate|collector rate|stamp duty|possession)\b/i;

/**
 * Crime and casualty copy, kept out of the regional filler.
 *
 * The property bucket is exempt: "ED lens on a Rs 40-crore GMADA waiver" is
 * a land story a buyer in this market genuinely wants, and stripping the
 * word "fraud" would remove the most relevant coverage there is. This gate
 * exists for the general-Tricity tier only, where an abduction report is
 * simply the wrong thing to put on a brokerage's market page.
 */
const CRIME_RE =
  /\b(murder|rape|abduct|kidnap|assault|molest|suicide|killed|death|dead body|shot dead|drug|smuggl|terror|accident|crash|arrested)\b/i;

/** Tricity is the hard requirement; property is the ranking preference. */
function classify(
  title: string,
  description: string | null
): "property" | "regional" | null {
  const hay = `${title} ${description ?? ""}`;
  if (!TRICITY_RE.test(hay)) return null;
  if (PROPERTY_RE.test(hay)) return "property";
  return CRIME_RE.test(hay) ? null : "regional";
}

async function fetchPage(
  apiKey: string,
  q: string,
  page?: string
): Promise<NewsdataResponse> {
  const params = new URLSearchParams({
    apikey: apiKey,
    q,
    language: "en",
    country: "in",
  });
  // Deliberately no `category=business`: it cut a four-result query to two,
  // and Tricity property stories are filed under regional news as often as
  // under business.
  if (page) params.set("page", page);

  const res = await fetch(`https://newsdata.io/api/1/latest?${params}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    console.error(`newsdata.io responded ${res.status} for query: ${q}`);
    return { status: "error" };
  }
  return (await res.json()) as NewsdataResponse;
}

/** Every page of one query, walked through the nextPage cursor. */
async function fetchQuery(apiKey: string, q: string): Promise<NewsdataResponse[]> {
  const pages: NewsdataResponse[] = [];
  let cursor: string | undefined;

  for (let i = 0; i < PAGES_PER_QUERY; i++) {
    const data = await fetchPage(apiKey, q, cursor);
    pages.push(data);
    if (data.status !== "success" || !data.nextPage) break;
    cursor = data.nextPage;
  }
  return pages;
}

/**
 * Tricity real-estate coverage, deduped and filtered. Fails soft to the
 * page's empty state.
 *
 * Image-less articles are kept (the card falls back to a typographic tile):
 * once the relevance gate is applied the daily pool is small enough that
 * dropping them too would leave the page empty most days.
 */
export async function fetchRealEstateNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    console.error("NEWSDATA_API_KEY missing; /news renders fallback state");
    return [];
  }

  try {
    const responses = (
      await Promise.all(
        [...PROPERTY_QUERIES, ...REGIONAL_QUERIES].map((q) => fetchQuery(apiKey, q))
      )
    ).flat();

    const seen = new Set<string>();
    const property: NewsArticle[] = [];
    const regional: NewsArticle[] = [];

    for (const data of responses) {
      if (data.status !== "success" || !Array.isArray(data.results)) continue;
      for (const item of data.results) {
        if (!item.title || !isSafeHttpUrl(item.link)) continue;
        const bucket = classify(item.title, item.description ?? null);
        if (!bucket) continue;

        const key = item.link.toLowerCase();
        const titleKey = item.title.trim().toLowerCase();
        if (seen.has(key) || seen.has(titleKey)) continue;
        seen.add(key);
        seen.add(titleKey);

        (bucket === "property" ? property : regional).push({
          title: item.title,
          link: item.link,
          source: item.source_name ?? item.source_id ?? "Market Desk",
          excerpt: item.description ?? null,
          image: item.image_url ?? null,
          publishedAt: item.pubDate ?? null,
        });
      }
    }

    // Newest first within each bucket; the queries interleave otherwise, so
    // the grid would open on whichever query happened to be listed first.
    const byDate = (a: NewsArticle, b: NewsArticle) =>
      (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
    property.sort(byDate);
    regional.sort(byDate);

    return [...property, ...regional].slice(0, 36);
  } catch (err) {
    console.error("fetchRealEstateNews failed:", err);
    return [];
  }
}
