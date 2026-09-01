// Exercises the service worker's routing rules in Node by stubbing the SW
// globals. This is the part with real consequences: admin data and lead
// submissions must never be served from a cache.
import fs from "node:fs";

const src = fs.readFileSync("public/sw.js", "utf8");
const handlers = {};
const events = [];
const self = {
  addEventListener: (t, fn) => (handlers[t] = fn),
  location: { origin: "https://example.com" },
  skipWaiting: () => {},
  clients: { claim: () => {} },
};
const caches = { open: async () => ({ match: async () => null, put: async () => {} }), match: async () => null, keys: async () => [] };
new Function("self", "caches", "fetch", src)(self, caches, async () => ({ ok: true, clone: () => ({}) }));

function routed(url, mode = "navigate", method = "GET") {
  let responded = false;
  handlers.fetch({
    request: { url, mode, method },
    respondWith: () => { responded = true; },
  });
  return responded;
}

const cases = [
  ["https://example.com/", "navigate", "GET", true, "page is handled"],
  ["https://example.com/properties", "navigate", "GET", true, "listing page is handled"],
  ["https://example.com/api/search?q=x", "navigate", "GET", false, "API bypasses the worker"],
  ["https://example.com/admin/properties", "navigate", "GET", false, "admin bypasses the worker"],
  ["https://example.com/api/admin/leads/export", "navigate", "GET", false, "lead export bypasses"],
  ["https://example.com/sitemap.xml", "navigate", "GET", false, "sitemap bypasses"],
  ["https://example.com/robots.txt", "navigate", "GET", false, "robots bypasses"],
  ["https://example.com/contact", "navigate", "POST", false, "POST is never intercepted"],
  ["https://example.com/local/tricity-pool.jpg", "no-cors", "GET", true, "local image is cached"],
  ["https://example.com/_next/static/chunk.js", "no-cors", "GET", true, "static chunk is cached"],
  ["https://other.example/x.jpg", "no-cors", "GET", false, "cross-origin is left alone"],
];

let failed = 0;
for (const [url, mode, method, want, label] of cases) {
  const got = routed(url, mode, method);
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}
console.log(failed ? `\n${failed} FAILED` : "\nall service-worker routing rules hold");
process.exit(failed ? 1 : 0);
