export type NewsArticle = {
  title: string;
  link: string;
  source: string;
  excerpt: string | null;
  image: string;
  publishedAt: string | null;
};

type NewsdataResponse = {
  status: string;
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

// newsdata.io caps at 10 results per request — two distinct queries are
// merged to fill the page.
const QUERIES = [
  '"real estate" OR property OR housing',
  '"property market" OR "real estate investment" OR builder OR township',
];

async function fetchQuery(apiKey: string, q: string): Promise<NewsdataResponse> {
  const params = new URLSearchParams({
    apikey: apiKey,
    q,
    category: "business",
    language: "en",
    country: "in",
  });
  const res = await fetch(`https://newsdata.io/api/1/latest?${params}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    console.error(`newsdata.io responded ${res.status} for query: ${q}`);
    return { status: "error" };
  }
  return (await res.json()) as NewsdataResponse;
}

/**
 * Indian real-estate coverage from newsdata.io. Two queries merged and
 * deduped; image-less articles are dropped (a photo-less card reads as a
 * dead site). Fails soft to the page's empty state.
 */
export async function fetchRealEstateNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    console.error("NEWSDATA_API_KEY missing; /news renders fallback state");
    return [];
  }

  try {
    const responses = await Promise.all(
      QUERIES.map((q) => fetchQuery(apiKey, q))
    );

    const seen = new Set<string>();
    const articles: NewsArticle[] = [];
    for (const data of responses) {
      if (data.status !== "success" || !Array.isArray(data.results)) continue;
      for (const item of data.results) {
        if (!item.title || !item.link || !item.image_url) continue;
        const key = item.link.toLowerCase();
        const titleKey = item.title.trim().toLowerCase();
        if (seen.has(key) || seen.has(titleKey)) continue;
        seen.add(key);
        seen.add(titleKey);
        articles.push({
          title: item.title,
          link: item.link,
          source: item.source_name ?? item.source_id ?? "Market Desk",
          excerpt: item.description ?? null,
          image: item.image_url,
          publishedAt: item.pubDate ?? null,
        });
      }
    }
    return articles.slice(0, 12);
  } catch (err) {
    console.error("fetchRealEstateNews failed:", err);
    return [];
  }
}
