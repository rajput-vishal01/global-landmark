---
status: complete
phase: 01-taxonomy-schema-foundation
source: [docs/REQUIREMENTS_V2.md sections 4.1-4.4, 5, 9 P1; .planning/ROADMAP.md Phase 1]
started: 2026-08-20
updated: 2026-08-20
---

## Note on how this phase was verified

Phase 1 was built directly from the SPEC before `/gsd-plan-phase` had created a
phase directory, so `/gsd-verify-work` could not attach to it. The verification
below was still performed in full, against a running dev server and a running
production build; this file records the results. Phase 2 onward goes through
`/gsd-plan-phase` first so the normal flow applies.

Verification here is machine-checked rather than conversational — this phase has
no user-facing surface of its own. Its whole job is that the data layer cannot
leak, which is a thing to assert, not a thing to look at.

## The three universal gates

| Gate | Result |
|---|---|
| G1 — section 10 rows owned by this phase | Storage exists for every CFF field; admin editing and public render land in phases 2 and 4 |
| G2 — section 4.1 leak grep, zero hits | PASS, and the check is proven to fail on a planted value |
| G3 — `npm run lint && npm run build` | PASS, both clean |

## Tests

### 1. Taxonomy completeness
expected: every CFF list is present at full length and internally consistent
result: PASS — `node scripts/check-taxonomy.mjs`, all assertions
covers: 23 property types, 8 facings, 12 configurations, 15 furnishing items,
31 amenities, 6 parking types, 10 PLC attributes, 16 documentation flags,
7 area units, 7 listing statuses

### 2. Every property type maps to exactly one collection
expected: no type is unreachable from a collection page; `kind = project` wins
result: PASS — all 23 map; 23 reachable via `typesInCollection`; Commercial Plot
resolves to Commercial; an unknown type returns null rather than a guess

### 3. Mixed-unit area sorting
expected: 500 sq.yd, 1 acre and 2000 sq.ft sort by real size, not by number
result: PASS — sorts to sqft, sqyd, acre; 8 kanal = 1 acre; 1 bigha = 20 biswa;
unknown unit returns null

### 4. Status governs public visibility
expected: only published + Available renders publicly
result: PASS — asserted for all 7 statuses, and confirmed end to end: marking a
property Sold removed it from /properties (6 to 5), the homepage, /api/search
and the sitemap on a cold cache

### 5. Reference codes
expected: GL-CITY-YY-NNNN, unique, unknown city falls back rather than failing
result: PASS — GL-PKL-26-0142 format asserted; all six existing listings
backfilled with correct city prefixes; the two whose location says "Tricity"
correctly got GEN rather than a guessed city

### 6. Migration applies to the existing database without data loss
expected: additive only; nothing disappears; re-running is a no-op
result: PASS — 0001 contains no DROP, TRUNCATE or RENAME; all 6 properties
still published and Available afterwards; second `drizzle-kit migrate` is a
no-op; the guarded baseline was applied twice under ON_ERROR_STOP as a
separate proof

### 7. Backfill correctness
expected: derived columns match the TS helpers
result: PASS — 500 sq.yd to 4500 sq.ft, 27 acre to 1,176,120 sq.ft, 400 sq.yd
to 3600 sq.ft; cities parsed where unambiguous and left null where not

### 8. Internal data never reaches a public surface
expected: zero hits for owner phone, owner name, circle rate, internal note,
withheld demand price and a private charge amount
result: PASS after a fix. The first run FAILED — the withheld demand price
appeared on the homepage, because `demandPrice` was in the allowlist so that a
render-time helper could gate it. Selecting it at all put it in the RSC payload
for every listing. Fixed by resolving the price in SQL, so the database returns
null unless the listing is flagged public. Re-run scans 56 responses across 5
pages plus every client chunk they reference: clean.

### 9. The leak check can actually fail
expected: a planted, known-public value trips it
result: PASS — exits 1 on a known-public needle, 0 on real data

### 10. Price gate works in both directions
expected: withheld by default, published when flagged
result: PASS — flag off, the figure is absent from page source; flag on, it
resolves; existing "Pricing is discussed privately" copy unchanged

### 11. Seed produces every new entity and its own check passes
expected: one populated example of each, idempotent
result: PASS — builders, towers, owners, internal, charges, documents, media
and leads all seeded; check passed; re-running changes no counts and creates no
duplicates. Two pre-existing bugs fixed: deal windows expired and were never
re-seeded (active_deals stuck at 0), and all-or-nothing guards meant rows added
to the seed arrays never landed (videos stuck below the expected count).

### 12. No render regression
expected: public pages render as before
result: PASS — /properties lists all 6, homepage renders featured listings and
Deal of the Week, detail page intact, no application errors in the console
(only stale HMR socket errors from killed dev servers)

## Findings raised, not fixed here

1. **Soft 404 on the property detail route.** A missing or non-public slug
   returns HTTP 200 with the not-found body. This is documented Next 16
   behaviour — `app/loading.tsx` opens a Suspense boundary, streaming starts,
   headers are already sent, so `notFound()` can only inject
   `<meta name="robots" content="noindex">`, which is present and verified.
   Pre-existing (a never-existing slug behaves the same), but this phase makes
   every sold listing hit it. A real 404 status needs a check in `proxy.ts`,
   per Next's own guidance. Routed to Phase 9 with R-83.

2. **`public_id` column not renamed.** The TS property is `storageKey`; the
   column is still `public_id`. drizzle-kit could not tell a rename from a
   drop without a TTY, and a mis-resolved rename loses data. Deliberate, with a
   `// ponytail:` comment naming the upgrade trigger.
