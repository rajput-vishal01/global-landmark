/**
 * Shaping the Google Places (New) place-details response into what the
 * testimonial wall renders. Pure, so scripts/check-reviews.mjs can pin it
 * without a network call or the Next.js runtime.
 */

export type GoogleReview = {
  id: string;
  author: string;
  /** The reviewer's Google profile. Google's terms require the attribution to link there. */
  authorUrl: string | null;
  photoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string | null;
};

export type GoogleReviews = {
  rating: number | null;
  total: number;
  /** The listing on Google Maps, for "see all reviews". */
  mapsUrl: string | null;
  reviews: GoogleReview[];
};

/**
 * Only 4 and 5 star reviews reach the wall. It sits on the home page as
 * a trust band, and the full, unfiltered list stays one click away via the
 * "on Google" link, which shows the real average.
 */
const MIN_RATING_SHOWN = 4;

type RawReview = {
  name?: string;
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

export type RawPlace = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: RawReview[];
};

/** Rendered straight into href/src, so only real http(s) URLs pass. */
function httpUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return /^https?:$/.test(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
}

export function parsePlaceReviews(place: RawPlace): GoogleReviews {
  const reviews = (place.reviews ?? []).flatMap((r, i): GoogleReview[] => {
    // The reviewer's own words over Google's machine translation.
    const text = (r.originalText?.text ?? r.text?.text ?? "").trim();
    const author = r.authorAttribution?.displayName?.trim();
    const rating = Number(r.rating);
    if (!text || !author || !(rating >= MIN_RATING_SHOWN)) return [];
    return [
      {
        id: r.name ?? `google-${i}`,
        author,
        authorUrl: httpUrl(r.authorAttribution?.uri),
        photoUrl: httpUrl(r.authorAttribution?.photoUri),
        rating: Math.min(5, Math.round(rating)),
        text,
        relativeTime: r.relativePublishTimeDescription ?? null,
      },
    ];
  });
  return {
    rating: typeof place.rating === "number" ? place.rating : null,
    total: place.userRatingCount ?? 0,
    mapsUrl: httpUrl(place.googleMapsUri),
    reviews,
  };
}
