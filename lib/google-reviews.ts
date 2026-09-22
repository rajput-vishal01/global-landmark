import { unstable_cache } from "next/cache";
import { parsePlaceReviews, type GoogleReviews, type RawPlace } from "./google-reviews-parse";

/**
 * The office's Google Maps reviews, for the testimonial wall.
 *
 * Google Places API (New), server-side only: the key lives in
 * GOOGLE_PLACES_API_KEY and never reaches the browser. With no key the
 * wall simply shows the reviews added in the admin, the same fail-soft
 * shape as the news feed.
 *
 * GOOGLE_PLACE_ID pins the listing. Without it the place is found once by
 * name (searchText) and cached, so it works before anyone looks the ID up.
 *
 * ponytail: Google returns at most five reviews per place, its "most
 * relevant" five, and there is no paging. More than that needs Google
 * Business Profile API access (owner OAuth), which is a different
 * integration. Nothing is stored: Google's terms limit caching review
 * content, so the result lives only in the 6-hour data cache.
 */

const API = "https://places.googleapis.com/v1";
const PLACE_QUERY = "Global Landmark Realty Group, Peer Muchalla, Zirakpur";
const REVALIDATE_SECONDS = 6 * 60 * 60;
const TIMEOUT_MS = 8000;

async function places<T>(path: string, init: RequestInit, key: string, fieldMask: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": fieldMask,
    },
    cache: "no-store", // unstable_cache below is the one cache layer
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    // Google's error body names the cause (API not enabled, key restricted).
    throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

async function placeId(key: string): Promise<string> {
  const pinned = process.env.GOOGLE_PLACE_ID?.trim();
  if (pinned) return pinned;
  const found = await places<{ places?: { id?: string }[] }>(
    "/places:searchText",
    { method: "POST", body: JSON.stringify({ textQuery: PLACE_QUERY }) },
    key,
    "places.id"
  );
  const id = found.places?.[0]?.id;
  if (!id) throw new Error(`Places API: no place found for "${PLACE_QUERY}"`);
  return id;
}

// Throws on failure on purpose: unstable_cache does not store a thrown
// call, so one bad response is retried on the next request instead of
// blanking the reviews for six hours.
const fetchReviewsCached = unstable_cache(
  // The key is read inside rather than passed in: arguments become part of
  // the cache key, and the key has no business in the on-disk cache.
  async (): Promise<GoogleReviews> => {
    const key = process.env.GOOGLE_PLACES_API_KEY?.trim() ?? "";
    const id = await placeId(key);
    const place = await places<RawPlace>(
      `/places/${encodeURIComponent(id)}`,
      { method: "GET" },
      key,
      "rating,userRatingCount,googleMapsUri,reviews"
    );
    return parsePlaceReviews(place);
  },
  ["google-reviews"],
  { revalidate: REVALIDATE_SECONDS, tags: ["google-reviews"] }
);

export async function getGoogleReviews(): Promise<GoogleReviews | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return null;
  try {
    return await fetchReviewsCached();
  } catch (err) {
    console.error("google reviews unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}
