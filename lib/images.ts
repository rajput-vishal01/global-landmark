/**
 * Rewrites a Cloudinary delivery URL to serve an auto-format, auto-quality,
 * width-capped derivative — so next/image fetches an already-small source
 * instead of the full-resolution original. Non-Cloudinary URLs (Unsplash,
 * admin-pasted) pass through unchanged.
 */
export function optimizedImage(url: string, width = 1600): string {
  const m = url.match(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/
  );
  if (!m) return url;
  return `${m[1]}f_auto,q_auto,c_limit,w_${width}/${m[2]}`;
}
