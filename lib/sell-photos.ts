import { isLocalImageUrl } from "./storage-keys";

/**
 * How many photographs a seller may attach to one submission.
 *
 * 20, the same ceiling MAX_IMAGES gives an admin in lib/admin/property-parse.ts.
 * A submitted listing becomes a real listing once approved, so a lower public
 * cap would just mean the broker re-uploading the rest by hand.
 *
 * Lives in its own module because the picker (a client component) and the
 * server action both need it, and a limit enforced at only one end is not a
 * limit — the browser is not where this gets decided.
 */
export const MAX_SELL_PHOTOS = 20;

/**
 * Parse the picker's hidden `photosJson` field into storable URLs.
 *
 * Deliberately stricter than the admin parser, which also accepts
 * images.unsplash.com and the repo-bundled paths. A public submission may
 * reference ONLY files this site stored itself, from the upload route, whose
 * names are the SHA-256 of their own bytes. Anything else is dropped rather
 * than rejected: a seller who somehow posts a malformed list still gets their
 * property submitted, just without that photo, and a stranger cannot use the
 * form to hang an arbitrary remote URL off a listing.
 */
export function parseSellPhotos(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((url): url is string => typeof url === "string" && isLocalImageUrl(url))
    .slice(0, MAX_SELL_PHOTOS);
}
