/*
 * Service worker.
 *
 * Deliberately small and hand-written rather than a Workbox build: this is a
 * marketing site whose content must stay fresh (listings change, news is on a
 * 12h cache), so aggressive precaching would be a bug, not a feature. What we
 * actually want is (1) installability and (2) a page that says something
 * useful when a phone drops signal at a site visit.
 *
 * Strategy, by request type:
 *   - navigations  → network first, fall back to the cached page, then to
 *                    /offline. A broker on bad hotel wifi sees the last copy
 *                    rather than the browser's dinosaur.
 *   - static assets → stale-while-revalidate (images, CSS, JS, fonts).
 *   - everything else (API, admin, POSTs) → straight to the network, never
 *     cached. Admin data and lead submissions must never be served stale.
 */

const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const OFFLINE_URL = "/offline";

// Only the offline page is precached. Everything else earns its place by
// being visited, which keeps the install cheap on a metered connection.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

// Drop caches from older versions, then take over open tabs immediately.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PAGES && key !== ASSETS)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** Anything that must never be served from a cache. */
function isAlwaysLive(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname === "/sitemap.xml" ||
    url.pathname === "/robots.txt"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isAlwaysLive(url)) return;

  // Navigations: network first, cache as a fallback, /offline as a last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Static assets: serve what we have, refresh in the background.
  if (/\.(?:png|jpg|jpeg|webp|avif|svg|ico|css|js|woff2?)$/i.test(url.pathname) ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/local/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
