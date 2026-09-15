import { isMarketStory } from "./news-filter";
import { MARKET_QUERIES, PROPERTY_QUERIES } from "./news-queries";

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

/** Pages pulled per query. 10 rows a page, and the 48h window rarely holds more. */
const PAGES_PER_QUERY = 2;

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
        [...PROPERTY_QUERIES, ...MARKET_QUERIES].map((q) => fetchQuery(apiKey, q))
      )
    ).flat();

    const seen = new Set<string>();
    const stories: NewsArticle[] = [];

    for (const data of responses) {
      if (data.status !== "success" || !Array.isArray(data.results)) continue;
      for (const item of data.results) {
        if (!item.title || !isSafeHttpUrl(item.link)) continue;
        if (!isMarketStory(item.title, item.description ?? null)) continue;

        const key = item.link.toLowerCase();
        const titleKey = item.title.trim().toLowerCase();
        if (seen.has(key) || seen.has(titleKey)) continue;
        seen.add(key);
        seen.add(titleKey);

        stories.push({
          title: item.title,
          link: item.link,
          source: item.source_name ?? item.source_id ?? "Market Desk",
          excerpt: item.description ?? null,
          image: item.image_url ?? null,
          publishedAt: item.pubDate ?? null,
        });
      }
    }

    // Newest first. One list now, so this is the whole ordering: the queries
    // interleave otherwise and the grid would open on whichever query
    // happened to be listed first rather than on the latest story.
    stories.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

    return stories.slice(0, 36);
  } catch (err) {
    console.error("fetchRealEstateNews failed:", err);
    return [];
  }
}
