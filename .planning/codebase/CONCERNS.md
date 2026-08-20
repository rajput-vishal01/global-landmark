# Codebase Concerns

**Analysis Date:** 2026-08-20

Audited against the expansion in `docs/REQUIREMENTS_V2.md` §4 (architecture decisions) and §7 (proposed requirements). Each item notes whether it is **already logged** in REQUIREMENTS_V2 (client will see it addressed by the phased plan) or **unlogged** (found here, not tracked anywhere else).

Ranked by severity: CRITICAL → HIGH → MEDIUM → LOW.

---

## CRITICAL

### 1. No public column allowlist — every joined column is exposed today, and internal CFF fields (owner phone, brokerage, circle rate) will land on the same table
- Files: `lib/db/queries.ts` (`listProperties` L69-95, `getFeaturedProperties` L97-115, `getPropertyBySlug` L117-137, `getActiveDeal` L188-215, `searchProperties` L139-184, `listPropertySlugs` L243-254)
- Evidence: every public query uses `db.query.properties.findMany()`/`findFirst()` with `with: { project: true }` and no `columns:` allowlist — Drizzle returns every column of `properties` and every column of the joined `projects` row.
- Trigger: the CFF expansion (REQUIREMENTS_V2 §5) adds owner phone, brokerage figures, circle rate, internal status, `addedBy` etc. to fields that flow through these same query helpers. The moment those columns exist on `properties` (or a joined table without an allowlist), they serialize straight into `getPropertyBySlug`'s cached JSON, `searchProperties`'s public JSON API response (`app/api/search/route.ts`), and `listPropertySlugs` feeding `app/sitemap.ts`.
- Impact: PII/financial leak to any visitor via page source or the search API — the exact failure mode REQUIREMENTS_V2 calls "the hardest rule in this document" (§4.1).
- **Already logged:** yes — REQUIREMENTS_V2 §4.1 mandates separate internal tables + explicit `columns:` allowlists + `PublicProperty`/`AdminProperty` type split, and a grep-based verification step. This document is not solved, it is scheduled; flagging because the current code is the exact shape that will leak if the allowlist step is skipped or rushed.

### 2. `scripts/migrate.mjs` runs `drizzle-kit push --force` on every build with no migration files and no interactive gate
- Files: `scripts/migrate.mjs`, absence of `drizzle/` directory (confirmed: does not exist)
- Evidence: `execSync("npx drizzle-kit push --force", ...)` runs unconditionally whenever `DATABASE_URL` is set (i.e. every Vercel build); `--force` auto-accepts destructive statements; there is no `drizzle/*.sql` migration history to diff or roll back.
- Trigger: REQUIREMENTS_V2 §5.1 renames/splits columns off `properties` into `property_internal`, `property_owners`, etc. (the table-split for the public/internal boundary). A rename or type-narrowing pushed this way silently drops/truncates data on deploy — no review step exists between "author schema change" and "production data mutated".
- Impact: irreversible data loss on a production deploy, no rollback path.
- **Already logged:** yes — REQUIREMENTS_V2 §4.3 explicitly calls for `drizzle-kit generate` real SQL migrations for anything that moves/drops data, keeping `push` only for additive columns, and R-78 calls for backups + a tested restore drill. Currently zero of that exists.

### 3. `SocialProofTicker` fabricates visitor activity and presents it as real
- Files: `lib/data.ts` `TICKER` (L211+, random `names`/event pools)
- Evidence: ticker content is generated from static random-name/event arrays, not from real enquiry/visit data, and rendered as live social proof.
- Trigger: none needed — this is a live, current-production compliance risk, not something the expansion introduces.
- Impact: India's CCPA dark-pattern guidance treats fabricated urgency/activity as a consumer-protection risk; undercuts a discretion-first luxury brand.
- **Already logged:** yes — REQUIREMENTS_V2 R-74 (Group J) flags it by name and recommends removal or driving it from real anonymised events, explicitly deferring to client decision. Unresolved in code today.

---

## HIGH

### 4. `listProperties` has no pagination/LIMIT; `/properties` renders every row
- Files: `lib/db/queries.ts` `listProperties` (L69-95, no `.limit()`), `app/(site)/properties/page.tsx` (maps the full result set)
- Evidence: query has `where`/`orderBy` but no `limit`; the page component renders every returned row into the DOM.
- Trigger: CFF onboarding is expected to bring the portfolio from a handful of seed listings to hundreds/thousands of live rows (REQUIREMENTS_V2 §5, R-61 bulk import). At that volume this is an unbounded query + unbounded render on every request.
- Impact: growing page-weight/LCP regression, growing DB read cost per request, eventually a request that never completes.
- **Already logged:** yes — R-75 (Group K) calls for pagination/cursor + B-tree indexes on every new filter column, explicitly citing this exact query as "loads every matching row."

### 5. `uniqueSlug()` selects every property row on every property save
- Files: `app/admin/(panel)/properties/actions.ts` `uniqueSlug()` (L255-263)
- Evidence: `db.select({ id, slug }).from(properties)` with no `where`, called on every create (L280) and every update (L321).
- Trigger: same inventory-growth trigger as #4 — at hundreds/thousands of rows, every single admin save (including the CFF's expected "draft autosave every ~20s" per §4.5) does a full table scan just to check slug uniqueness.
- Impact: admin form save latency scales with total inventory size, worst at exactly the moment autosave (R-4.5) fires most often.
- **Unlogged** — not called out anywhere in REQUIREMENTS_V2; R-75's indexing/pagination scope is about public list/filter queries, not this admin write-path helper.

### 6. `searchProperties()` — multi-token `ILIKE` scan, no index, feeds a public JSON endpoint
- Files: `lib/db/queries.ts` `searchProperties` (L139-184), `app/api/search/route.ts`
- Evidence: up to 6 tokens each expanded into 5 `ilike` `or()` branches plus a correlated subquery against `projects`, with no trigram/full-text index; results feed a public API route directly.
- Trigger: CFF-driven inventory growth (R-61 bulk import, hundreds+ rows) plus R-46 locality pages and R-39 comparison, all of which will drive more search traffic against a bigger table.
- Impact: degrading search latency and DB load as inventory scales; public endpoint amplifies impact since one client request can trigger up to 6×5 ILIKE branches.
- **Already logged:** yes — R-76 (Group K) explicitly names this query and recommends Postgres full-text or `pg_trgm` with an index "when the portfolio grows."

### 7. `lib/rate-limit.ts` is a single-instance in-memory Map
- Files: `lib/rate-limit.ts` (module-level `const logs = new Map(...)`, L10)
- Evidence: rate-limit state lives in process memory; explicitly commented `// ponytail: in-memory throttle (per server instance) — move to a shared store if the site ever scales horizontally.`
- Trigger: every deploy resets all counters to zero (instant reset of abuse protection); any horizontal scaling (multiple serverless instances/regions) splits the counter per instance, multiplying the effective limit by instance count.
- Impact: rate limits on enquiry forms, search, and other public write/read paths become ineffective under real traffic or during a deploy-heavy period (which this expansion, being a large multi-phase build, will produce).
- **Already logged:** yes — R-77 (Group K) calls for a shared store "before any serious traffic or multi-instance deploy."

### 8. Single shared admin password, no per-user identity or audit trail
- Files: `lib/admin/auth.ts` (whole file — stateless HMAC token `exp.hmac(exp)`, no user id in the payload)
- Evidence: `createAdminToken`/`verifyAdminToken` encode only an expiry + MAC; no user identity anywhere; comment confirms "Revocation: tokens have no per-session kill switch — to force-logout a leaked session, rotate ADMIN_SESSION_SECRET (invalidates every session)."
- Trigger: REQUIREMENTS_V2 Group I adds multi-user CRM operations — lead assignment (R-55), price-history actor tracking (R-60), duplicate detection, brokerage — all of which need to know *which* admin user did something. Group J's DPDP compliance (R-70) requires access restricted to named users and an audit trail.
- Impact: cannot attribute any admin action to a person; a single leaked password compromises the whole admin panel with no way to revoke just that session; blocks R-31 (per-listing `addedBy` attribution) and R-70 (DPDP compliance) from being implementable as designed.
- **Already logged:** yes — R-54 (Group I) specifies `admin_users` with roles, per-user login replacing the shared password, and an audit log; explicitly says "keep the HMAC cookie mechanism; add identity to it."

### 9. Property/document deletion is irreversible and destroys Cloudinary assets
- Files: `app/admin/(panel)/properties/actions.ts` (delete action; image deletion tied to property deletion)
- Trigger: CFF brings dealer-sourced, admin-entered inventory (R-58 flags "duplicate detection... dealer-sourced inventory duplicates constantly") — irreversible delete plus frequent duplicate cleanup is a data-loss trap.
- Impact: a mis-click during dedup cleanup permanently destroys a listing and its media with no recovery path.
- **Already logged:** yes — R-63 (Group I) calls for archive/soft-delete/restore-window before purge.

---

## MEDIUM

### 10. No centralized error reporting — `console.error` only
- Files: pervasive; 27 occurrences across `lib/` and `app/` (`lib/db/queries.ts`, `lib/rate-limit.ts` callers, admin actions, etc.)
- Trigger: expansion adds CRM/lead/payment-adjacent flows (deals, brokerage, site-visit booking R-42) where a silent failure has real business cost, not just a degraded page render.
- Impact: production errors (failed leads, failed notifications, failed autosave) are invisible until a user complains; no alerting on `/api/health`.
- **Already logged:** yes — R-79 (Group K) calls for centralized error reporting + alerting on `/api/health`.

### 11. Config coupling trap: new image host requires two separate edits or the site 500s
- Files: `next.config.ts` (`images.remotePatterns`), `app/admin/(panel)/properties/actions.ts` `IMAGE_HOSTS` (L38, currently `Set(["res.cloudinary.com", "images.unsplash.com"])`)
- Evidence: `isAllowedImageUrl()` checks against the local `IMAGE_HOSTS` set independently of `next.config.ts`'s `remotePatterns`; the two lists are not derived from a single source.
- Trigger: R-62 media tooling and any new CDN/host choice during the build-out; an admin pastes an image URL from an unlisted host and the property save either rejects it or, if it slips past the action check but not `next.config.ts`, breaks `<Image>` rendering (500) on the public page.
- Impact: silent admin-side rejection or a public-page 500, discovered late (post-deploy) rather than at config time.
- **Already logged:** yes — REQUIREMENTS_V2 §4.6 names this exact two-file coupling and the "never widen with a wildcard — `/_next/image` becomes an SSRF proxy" constraint.

### 12. CSP `frame-src` hardcoded to two hosts; every new embed type needs a manual edit
- Files: `next.config.ts` L14 — `"frame-src https://www.youtube-nocookie.com https://www.instagram.com"`
- Trigger: REQUIREMENTS_V2's expansion adds Google Maps embeds, virtual tours, and drone video (media/documents groups) — none of those hosts are in the CSP today.
- Impact: any admin who embeds a Maps/virtual-tour iframe without a matching code change gets a silently blocked embed on the public site (CSP violation, not a build error) — hard to diagnose without checking browser console.
- **Already logged:** yes — §4.6 explicitly calls this out.

### 13. Unattributed credibility figures and fabricated/generic press mentions
- Files: `lib/data.ts` (`headingHighlight: "₹850 Crore"` L93, `PRESS` array L151+, `"Sold to date", "₹850 Cr+"` L292, repeated at L323/L347)
- Evidence: ₹850 Cr sales figure repeated four times across the file with no sourcing; `PRESS` lists mastheads with no verifiable linkage confirmed in this codebase.
- Trigger: none needed — live today; becomes higher-stakes once DPDP/consumer-protection scrutiny (R-70, R-74) is actively being addressed for the ticker, and press/credibility claims sit in the same trust category.
- Impact: same category of risk as the ticker (R-74) — unverified quantitative/credibility claims presented as fact.
- **Unlogged** — REQUIREMENTS_V2 flags the ticker (R-74) by name but does not mention the ₹850 Cr figure or the `PRESS` array; worth folding into the same "activity ticker honesty review" pass or a sibling item.

### 14. Placeholder `#` social links, silently dropped
- Files: `components/sections/Footer.tsx` (filters out `href="#"` links)
- Trigger: none needed — live today.
- Impact: incomplete brand presence; low severity but visible (empty social row) once real social accounts should exist per REQUIREMENTS_V2's public-site brand groups.
- **Unlogged** — no line in REQUIREMENTS_V2 references this filter or the underlying missing URLs.

### 15. Stock Unsplash imagery throughout, including a mismatched landmark photo
- Files: `lib/data.ts` (13+ `images.unsplash.com` references), `scripts/seed.mjs` (`unsplash(id)` helper, L13)
- Evidence: `lib/data.ts` L110-111 uses an "India Gate at dawn" Unsplash photo (`alt: "India Gate at dawn under a violet sky"`) for a brand whose service area is the Tricity (Chandigarh/Mohali/Zirakpur/Panchkula) — India Gate is a New Delhi landmark, geographically wrong for the brand.
- Trigger: none needed — live today; becomes acute once real property photography (CFF media requirements, R-62) is expected to replace all placeholders before go-live.
- Impact: geographically incorrect hero imagery undermines a "hyperlocal Tricity specialist" positioning; broader stock-photo use across the site reads as generic/templated for a luxury brand.
- **Unlogged** — REQUIREMENTS_V2 does not call out this specific image or the general stock-photo-to-real-photo migration as a tracked item.

### 16. No test suite anywhere in the repo
- Files: repo-wide — `find` for `*.test.*`/`*.spec.*` returned nothing
- Trigger: expansion adds ~150 CFF fields, conditional admin-form sections, price/brokerage math, taxonomy validation, ref-code generation — all logic classes that are easy to silently break during a large build.
- Impact: no regression safety net for money-adjacent logic (brokerage, EMI calc R-41, price bands) or the public/internal boundary itself (the one thing that must never regress).
- **Already logged:** yes — R-88 (Group M) mandates one assert-based runnable check per non-trivial helper (ref-code, brokerage maths, area conversion, status→visibility, charge totalling, price-band derivation), matching repo convention (no framework). Not yet built for existing helpers either.

---

## LOW

### 17. No `drizzle/` migrations directory — confirmed absent
- Files: N/A (directory does not exist at repo root)
- Related to Critical #2; listed separately because it's a standalone gap-check any reviewer will look for.
- **Already logged:** yes — covered by §4.3 / R-78.

### 18. `getActiveDeal`/list queries always fetch full `project: true` relation even where only a few columns are used
- Files: `lib/db/queries.ts` (`with: { project: true }` in `listProperties`, `getFeaturedProperties`, `searchProperties`, `getActiveDeal`)
- Trigger: compounds with Critical #1 (no column allowlist) — once `projects` gains internal fields (builder deal terms, etc. per REQUIREMENTS_V2 §5.2 new tables), the same unscoped `with: { project: true }` re-leaks them.
- Impact: minor performance overhead today; becomes a second instance of the Critical #1 leak pattern once `projects` carries sensitive columns.
- **Unlogged** — REQUIREMENTS_V2 §4.1 discusses the `properties` table allowlist but does not explicitly call out that every `with: { project: true }` join needs the same allowlist treatment; worth surfacing as a checklist item under the same fix.

---

## Summary table

| # | Concern | Severity | Logged in REQUIREMENTS_V2? |
|---|---|---|---|
| 1 | No public column allowlist | CRITICAL | Yes (§4.1) |
| 2 | `drizzle-kit push --force` on every build, no migrations | CRITICAL | Yes (§4.3, R-78) |
| 3 | Fabricated social-proof ticker | CRITICAL | Yes (R-74) |
| 4 | `listProperties` unbounded, full-table render | HIGH | Yes (R-75) |
| 5 | `uniqueSlug()` full-table scan on every save | HIGH | **No** |
| 6 | `searchProperties` ILIKE scan, no index | HIGH | Yes (R-76) |
| 7 | In-memory rate limiter, single instance | HIGH | Yes (R-77) |
| 8 | Single shared admin password, no identity/audit | HIGH | Yes (R-54) |
| 9 | Irreversible delete destroys Cloudinary assets | HIGH | Yes (R-63) |
| 10 | No centralized error reporting | MEDIUM | Yes (R-79) |
| 11 | Image host: two-file config coupling | MEDIUM | Yes (§4.6) |
| 12 | CSP `frame-src` hardcoded, new embeds need edits | MEDIUM | Yes (§4.6) |
| 13 | Unattributed ₹850 Cr figure / press mentions | MEDIUM | **No** |
| 14 | Placeholder `#` social links | MEDIUM | **No** |
| 15 | Stock imagery incl. geographically wrong India Gate photo | MEDIUM | **No** |
| 16 | No test suite | MEDIUM | Yes (R-88) |
| 17 | No `drizzle/` migrations directory | LOW | Yes (§4.3/R-78) |
| 18 | `with: { project: true }` un-allowlisted joins | LOW | **No** (implied by §4.1 but not spelled out) |

---

*Concerns audit: 2026-08-20*
