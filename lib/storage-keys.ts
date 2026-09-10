/**
 * Storage keys and the URLs built from them. Pure string work, no filesystem.
 *
 * Split out of lib/storage.ts so a CLIENT component can ask "is this one of
 * our own uploads?" without dragging `node:fs` into the browser bundle.
 * Turbopack does not fail quietly on that — it refuses to build the chunk
 * ("the chunking context does not support external modules (request:
 * node:fs)") and the whole page 500s — which is how this was found.
 *
 * lib/storage.ts re-exports everything here, so existing imports of
 * `isStorageKey` and friends from that module keep working unchanged.
 */

/**
 * A stored file's name: the SHA-256 of its bytes, plus one known extension.
 *
 * The pattern is the security boundary as much as a format check. It admits
 * only lowercase hex and a fixed extension, so a key can never contain a path
 * separator or a `..` segment — the reason resolveStoragePath can build a
 * filesystem path from one at all.
 */
const KEY_PATTERN = /^[a-f0-9]{64}\.(jpg|png|webp|avif|pdf)$/;

export function isStorageKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/** Public URL for an image. Same-origin, so next/image needs no allowlist. */
export function imageUrl(storageKey: string): string {
  return `/api/images/${storageKey}`;
}

/** True for a URL this site stored itself — not an external host. */
export function isLocalImageUrl(url: string): boolean {
  const key = url.startsWith("/api/images/") ? url.slice("/api/images/".length) : null;
  return key !== null && isStorageKey(key);
}

/** The key inside one of our own image URLs, or null for anything else. */
export function storageKeyFromUrl(url: string): string | null {
  return isLocalImageUrl(url) ? url.slice("/api/images/".length) : null;
}
