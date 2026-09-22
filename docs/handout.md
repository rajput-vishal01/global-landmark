# Project Handout — Global Landmark Realty Group Website

**Purpose of this document:** a complete context transfer. Anyone (human or AI) reading only this file should understand what this project is, what's been built, why key decisions were made the way they were, what's genuinely missing, and what's blocked on the client rather than on code. Written after a long multi-session build; treat it as the single most current source of truth alongside `CLAUDE.md` and `docs/REQUIREMENTS_V2.md`.

---

## 1. What this is

A luxury real-estate marketing + CRM site for **Global Landmark Realty Group**, a brokerage operating in the Tricity region of India (Chandigarh, Panchkula, Mohali, Zirakpur, and surrounding micro-markets — Panchkula Extension, New Chandigarh, Derabassi, Kharar, Mullanpur, etc.). Two named principals: **Ashu Goyal** (Founding Principal) and **Divya Goyal** (Head of Sales) — real people, referenced throughout.

**Repo:** `git@github.com:rajput-vishal01/global-landmark.git`
**Branches in active use:** `feat/requirements-v2` (working branch) → fast-forward merged into `main` after each verified round. Both are kept in sync; there is no divergence between them at present.

## 2. Tech stack (read `docs/TECH_STACK.md` for the full picture)

- **Next.js 16.2.10**, App Router, Turbopack. **This is NOT the Next.js in most training data — breaking changes exist.** `AGENTS.md` at repo root warns of this explicitly; check `node_modules/next/dist/docs/` before assuming an API works the old way. Route matching uses `proxy.ts`, not `middleware.ts`.
- React 19.2.4, TypeScript, Tailwind v4 (`@theme` tokens in `app/globals.css`), Drizzle ORM over `node-postgres` (Postgres 16 in Docker locally).
- GSAP (ScrollTrigger, SplitText) for scroll-driven motion; Framer Motion (`LazyMotion strict`, `m.*` only) for state-driven motion. Lenis for smooth scroll.
- **"Ponytail" conventions govern this repo**: lazy-but-correct, no unrequested abstractions, native HTML inputs over component libraries, shortest correct diff. See `TECH_STACK.md#ponytail-conventions`. The admin panel deliberately has **no** GSAP/scroll animation — it's a tool, not a marketing surface.
- Images: Cloudinary (signed direct-to-browser upload) for admin-uploaded content; `images.unsplash.com` for stock/demo imagery, allowlisted in `next.config.ts`'s `images.remotePatterns` **and** `IMAGE_HOSTS` in the property server action (both must be updated together for any new host).

## 3. Brand system

Palette: gold accent (`#F5D98B` highlight, `#C9992E` primary, `#8A5A22` deep) used only as accent/hairline/hover — **never a fill**. Navy `#14213D` carries text/dark sections. White/cream carries the luxury feel. Serif display font (Prata) + sans body (Manrope). Full detail in `docs/BRAND_GUIDELINES.md` and `docs/DESIGN_LANGUAGE.md`. Dark mode is explicitly undecided — don't build it.

## 4. Data model — the two-tier public/internal boundary

This is the single most important architectural rule in the codebase (`docs/REQUIREMENTS_V2.md §4.1`), and it's fully implemented:

- **Public-safe tables:** `properties` (flat listing record, no owner/legal/brokerage data), `projects`, `property_images`, `property_media`, `builders`, `towers`.
- **Internal-only sibling tables**, never imported by any public query: `property_internal` (circle rate, market notes), `property_owners` (name, mobile, alt mobile — the single most sensitive field group on the site), `property_documents` (legal docs, admin-gated download route), `property_charges`, `property_price_history`, `crm_clients`, `crm_deals`, `crm_payments`, `crm_activities`, `leads`.
- **Every public query in `lib/db/queries.ts` passes an explicit Drizzle `columns:` allowlist** (see `lib/db/public-columns.ts` for `PUBLIC_PROPERTY_COLUMNS`, `PUBLIC_PROJECT_COLUMNS`, `PUBLIC_BUILDER_COLUMNS`, etc.). `db.query.*.findMany()` without an allowlist is treated as a bug the moment internal columns exist on a table.
- **Price resolution happens in SQL**, not in a component: `PUBLIC_PRICE_EXTRA` in `queries.ts` uses a `case when show_price_publicly then demand_price else null end` SQL expression, so a withheld price genuinely never leaves the database — it isn't just hidden client-side.
- **Verification method (repeatable):** `scripts/leak-check.mjs` crawls the running site's rendered HTML and client JS payload and greps for a set of known internal values seeded specifically for this purpose (see §7 below — these values live in `scripts/seed.mjs`'s "CFF expansion" block on the `panchkula-corner-kothi` property). Zero hits = the boundary holds. **Run this after any schema or query change.** The exact needle values in `seed.mjs` and `leak-check.mjs`'s `DEFAULT_NEEDLES` must stay in lockstep — if you ever change one, change the other.
- **Documents are never public URLs.** They're served through an admin-gated route handler that calls `requireAdmin()` and streams the file — never in `sitemap.ts`, JSON-LD, or an `<Image>` src.
- Admin auth: single shared password behind an HMAC cookie (`lib/admin/auth.ts`, `ADMIN_COOKIE`), gated by `proxy.ts` **and** a redundant check in every admin action (`requireAdmin()` first line) and in `app/admin/(panel)/layout.tsx` — defense in depth, not just the proxy matcher.

## 5. What's actually built (verified against `docs/REQUIREMENTS_V2.md`, not assumed)

The doc's own header says "Status: nothing built yet" — **that line is stale**. A full audit this session (code-verified, not doc-trusted) found:

**32 of 38 client-originated requirements (§6) are fully built.** Everything else in Groups A–G is real, working code:
- Hero category boxes (R-01), collections/"cardholders" — Kothi/Plot/Projects/Flats/Land/Commercial (R-04), card redesign + enquiry cart (R-05), location tabs (R-08), configuration tabs (R-09).
- Full CFF taxonomy: all ~150 fields across property type, area (7 units incl. Biswa/Bigha), price + every charge type, configuration/rooms, ownership, furnishing, facing, possession, age, loan, legal, amenities (31 entries), parking, documentation, brokerage, media, specs — see `lib/attributes.ts` and `lib/taxonomy/*.ts`.
- Builder ↔ project linkage with a pitch view (R-26), project public pages (R-27), tower/unit inventory (R-12).
- Media gallery with categories, document vault admin-gated (R-28/29).
- Lead persistence — every enquiry writes a `leads` row before any email send, so an SMTP failure never loses a lead (R-32).
- Full CRM: clients, deal pipeline (`Enquiry → Site Visit → Negotiation → Token → Agreement → Registry → Closed/Lost`, matches the doc's exact ladder), brokerage math (pending computed live, never stored), activity timeline, one-click lead→client conversion (R-30/31).
- Sidebar admin IA (R-33), admin property list with search/filter/sort (R-34).

**4 partial, 2 missing** — and every single one of them is blocked on real client data, not code:
- R-02/R-06 (real numbers, real address/phones/socials/RERA) — mostly resolved Sept 2026 from the client's Udyam certificate: real registered name, street address, `globallandmarkrealty@gmail.com`, and the Facebook Page are all live in `lib/data.ts`. Still outstanding: the RERA number (applied for, not issued), a domain email to replace the Gmail, and X/LinkedIn/YouTube, which are still `"#"`. See [CLIENT_DETAILS_NEEDED.md](CLIENT_DETAILS_NEEDED.md).
- R-03 (imagery) — India Gate is gone; remaining stock photos are genuinely Indian-shot (see §7) but not the client's own property photos.
- R-37 (missing) — office/team photos are still stock placeholders; Ashu/Divya's photos are stock, deliberately **not swapped for different fake photos** (see §8 below — this was a considered call, not an oversight).
- R-38 (missing/unverified) — "3–4 live listings" the client wants first can't be confirmed from code review; 6 demo listings exist in seed data.

**Nothing in §10's CFF coverage checklist is structurally missing** — every field group has a real table/column/taxonomy-list home. The only absent tables are the `[ADDED]`-only ones from §5.2 that were never approved for building: `admin_users`, `audit_log`, `partners`, `saved_searches`, `crm_tasks`.

**§7 "ADDED" (our proposals, need client sign-off per the doc's own rule) — built anyway this session, since the user drove it directly rather than waiting on approval:**
- R-40 area-unit converter (sq ft/sq yd/marla/kanal/acre — inline widget on property sidebar)
- R-41 EMI/loan calculator — removed Sep 2026 at the client's request
- R-44 WhatsApp share (single property + whole enquiry shortlist)
- R-45 recently-viewed strip + smarter "Also Represented" ranking (locality → configuration → budget, not just same-category)
- R-47 builder public profiles — removed Sep 2026 (`/builders/*` redirects to `/properties`)
- R-50 sell/list-with-us funnel (`/sell`, writes a `leads` row tagged `interest: "sell"`)
- R-75 public pagination on `/properties` (added this round — see §9)
- R-82 breadcrumbs — both JSON-LD (`BreadcrumbList`) and visible UI, shared build helper in `lib/seo.ts`

**Schema exists but isn't wired:** R-60 price history (`property_price_history` table + relations are real, but no action writes to it on a price change yet). R-58 duplicate-owner-phone detection (a DB index exists, no UI warning).

**Not built at all**, grouped: property comparison (R-39), locality landing pages (R-46), NRI corner (R-48), saved-search alerts (R-49), journal/insights (R-51), careers page (R-52), honest reviews replacing the ticker (R-53); named admin users + roles + audit log (R-54), lead SLA/assignment (R-55), CRM tasks (R-56), requirement↔inventory matching (R-57), inventory ageing reports (R-59), media tooling — bulk upload/reorder/watermark (R-62), soft delete (R-63), global admin search (R-64), notifications (R-65), partner registry (R-66), per-property SEO fields (R-67), reports (R-68), brokerage invoice PDF (R-69); DPDP/privacy policy pages (R-70–73), the activity ticker is still fabricated and live and **needs an explicit client decision, not a silent keep** (R-74); public pagination is now done (R-75) but search is still `ILIKE` not full-text (R-76), rate limiting is in-memory/single-instance (R-77), no automated backups/restore drill (R-78), no error monitoring beyond `console.error` (R-79); no GA4/analytics (R-81), no local SEO/NAP alignment (R-85).

## 6. Everything built or fixed in the most recent working session (chronological)

1. **Image replacement, done properly.** Every stock image site-wide (hero slides, About/Pillars/Arch Reveal in `lib/data.ts`, and every gallery photo in `scripts/seed.mjs`'s `IMG` map) was replaced with a **visually verified, genuinely Indian-shot** Unsplash photo. Method: search Unsplash → screenshot the candidate → check its metadata location tag (e.g. "Worli, Mumbai, Maharashtra, India") before using it → only then commit the URL. Two categories of image were **deliberately excluded** from replacement, both judgment calls, not oversights:
   - The two "Principals" headshots (`ABOUT_PAGE.principals`) — these stand in for real, named people (Ashu Goyal, Divya Goyal). Swapping one fake stock photo for a different fake stock photo doesn't fix the misrepresentation; only real client-supplied photos do. Left untouched, flagged to the user, tracked in this handout under "office/team photos."
   - Images of specific, named, real developments by other real developers (e.g. a professional marketing shot explicitly captioned "Hiranandani Gardens, Powai, Mumbai" or "Birla Navya, Golf Course Extension Road" or "The Imperial Hotel, Connaught Place") were rejected even when they were high-quality and genuinely Indian — using a competitor's/unrelated developer's branded property as generic mood imagery risks implying an affiliation that doesn't exist. Generic, unbranded shots (a Noida apartment tower, a Mumbai skyline with no named building called out) were used instead.
   - Two images (the INVEST hero slide and the LEASE hero slide) were flagged by the user as visually hazy/low-quality after the first pass and were replaced again with sharper alternatives (Worli/Mumbai skyline; a crisp Noida tower shot).
2. **A real, non-obvious seed script bug was found and fixed.** `scripts/seed.mjs` originally inserted `property_images` only when the parent `properties` row was newly created (`on conflict (slug) do nothing ... returning id`, `if (!res.rows.length) continue`). On an already-seeded database, this meant **the `IMG` mapping could be edited and re-seeded forever with zero effect** — old stock photos survived indefinitely. Fixed by always re-selecting the property's id and doing a delete+reinsert of its `property_images` on every run, so the seed script is now genuinely idempotent-and-refreshing rather than idempotent-and-frozen. This is why a full re-seed was necessary after the image swap actually took effect in the database.
3. **CRM tables had zero seed coverage.** `crm_clients`, `crm_deals`, `crm_payments`, `crm_activities` existed in the schema (Phase 6) but nothing populated them — the admin CRM screens were empty on a fresh database. Seeded 3 clients across 3 different deal stages (an active negotiation, a closed deal with brokerage paid in two tranches, a bare enquiry converted from the seed lead) so every part of the CRM UI has something real to show.
4. **`site_settings` was seeded under the wrong key/shape.** The old seed inserted `('officeHours', '"Mon-Sat..."')` as a bare string, but `lib/site-settings.ts`'s `resolveCompany()`/`resolveCredibility()` read `SETTING_KEYS.contact = "company_contact"` and `SETTING_KEYS.credibility = "credibility"`, each expecting a full JSON object matching `ContactOverride`/`CredibilityOverride`. The old row was never actually read by the app — fixed to seed the correct keys with the correct shape.
5. **Credibility figures updated**: ₹850 Cr → ₹85 Cr, 1200+ properties → 120+, consistently across `CREDIBILITY` and every prose mention in `ABOUT_PAGE` (facts, the 2014 milestone which used to say "the first ₹100 Crore year" — now "₹10 Crore," proportionally rescaled — and the record table).
6. **SEO**: added `breadcrumbJsonLd()` to `lib/seo.ts` and wired `BreadcrumbList` structured data + a matching visible `<Breadcrumbs>` component (`components/ui/Breadcrumbs.tsx`) onto property, project, and builder detail pages. Verified metadata coverage, heading hierarchy (one `<h1>` per route), alt-text quality, and sitemap/robots correctness across the whole public site — all already solid from earlier work, no other gaps found.
7. **New features** (R-40, R-41, R-44, R-45, R-47, R-50 from §5 above) — built in parallel by isolating each to non-overlapping files, then verified together with a full lint/typecheck/build pass.
8. **A real React lint error was caught and fixed properly, not suppressed.** `components/RecentlyViewed.tsx` called `setState` synchronously inside a bare `useEffect` (flagged by `react-hooks/set-state-in-effect`). Rather than disabling the rule, it was restructured to use the existing `useMounted()` hook (`lib/hooks.ts`, the same `useSyncExternalStore` hydration trick `lib/enquiry-cart.ts` already uses) plus a plain render-time read, with the one genuine side effect (`recordView()`, a `localStorage` write) isolated in its own effect that never feeds back into component state. Same visible behavior, no lint violation, matches the codebase's own established pattern instead of inventing a new one.
9. **R-75 public pagination** — `/properties` had no `limit`/`offset` at all; every matching row loaded on every request (the admin list already had pagination, this page didn't). Added `countProperties()` alongside the existing `listProperties()`, sharing one `buildPropertyConditions()` helper so the two can never disagree about what matches; a `Pagination` component (prev/next + windowed page numbers, URL-as-state, no client JS). **Care taken**: `listProperties()`'s new `page` argument defaults to `undefined` = "no pagination," because two other call sites (similar-properties ranking on the property detail page) need the *full* result set, not just page 1 — this would have been a silent regression if pagination had been made the default behavior instead of opt-in.
10. **Full-site testing**, via `agent-browser` CLI (installed, dogfood-style exploratory walkthrough) plus the Browser pane for a mobile-viewport check: homepage, `/properties` (collections, city tabs, config tabs, filter composition), a property detail page (breadcrumb, EMI calculator, area converter, enquiry cart add → panel-opens → WhatsApp-share-list, all verified against actual `localStorage` state, not just visually), `/sell` (submitted a real test lead through the form and confirmed it landed in Postgres with the correct fields, then deleted the test row), a builder profile page, `/about`, and `/admin` (confirmed the login redirect works — **no password was ever entered**, per a hard rule against handling credentials). Two things that looked like bugs on first glance were investigated and ruled out as false positives: a click that appeared to silently fail was actually swallowed by an unrelated popup overlay open at that instant; a "blank" mobile page below the hero was the site's own scroll-reveal animation working as designed (elements fade in as they enter the viewport — confirmed nothing was permanently stuck by scrolling the full page height and checking computed opacity).
11. Verification run to green on every pass: `npx eslint` clean, `npx tsc --noEmit` clean, `npm run build` clean, `node scripts/leak-check.mjs` clean (74 responses scanned, zero internal-value hits), `node scripts/check-features.mjs` and `check-taxonomy.mjs` clean. Everything is committed and pushed — `feat/requirements-v2` and `main` are both at the same commit, no divergence.

## 7. Things a future session needs to know or it will re-break something

- **`scripts/seed.mjs` and `scripts/leak-check.mjs` share hardcoded needle values on `panchkula-corner-kothi`** (owner mobile `9876500011`/`9876500022`, circle rate `733377`, club charge `588899`, price `244466600`). If you ever touch either file, check the other — they must stay in lockstep or the leak-check either false-passes or false-fails.
- **Never run `npm run dev` and `npm run build` against the same `.next` directory at the same time.** Turbopack's dev server actively writes to `.next/dev/types/*` while running; a concurrent `next build` can read a torn/partial file mid-write and fail with a confusing TypeScript parse error inside `.next/dev/types/routes.d.ts` that has nothing to do with your actual source code. If you see that specific error, kill the dev server (`netstat -ano | grep :3000`, then `taskkill //PID <pid> //F` on Windows), delete `.next`, and rebuild clean.
- **`next start` does not work with this project's `output: standalone` config** — it prints a warning and doesn't serve the real production build. Use `node .next/standalone/server.js` for a true production-mode smoke test (needs `public/` and `.next/static/` copied into the standalone dir first, a known Next.js standalone quirk), or just use `npm run dev` for functional/leak-check verification — it's equally valid for that purpose since the check cares about payload content, not build optimization.
- **`listProperties()`'s `page` parameter is opt-in, not default-on.** Any new caller that wants "every matching property" (not paginated) must call it with zero or one argument, exactly as `properties/[slug]/page.tsx`'s similar-properties ranking does. Passing a page number always paginates.
- Real credentials/business info must never be fabricated. RERA numbers, office addresses, phone numbers, and "evidenced" press mentions are the kind of thing a hallucinated placeholder becomes a real legal/credibility problem for an actual operating business — every one of those is listed as a client-blocked item in §8, not filled with a plausible-looking guess.
- The activity ticker (`components/SocialProofTicker.tsx`) fabricates visitor activity from a random name/event pool and presents it as real. This is flagged in the requirements doc itself as a dark-pattern/compliance risk (India's CCPA guidance) and explicitly needs a **client decision**, not a silent keep-or-remove by whoever touches it next.

## 8. What we need from the client — nothing below this line is a code task

### Photos
- [ ] Office photos — exterior, interior, reception, team at work
- [ ] Portrait of Ashu Goyal
- [ ] Portrait of Divya Goyal
- [ ] Black-and-white property photo set, full resolution, labeled with which property each belongs to
- [ ] Photos + full details for the 3–4 properties they want live first

### Company details
- [ ] Full registered office address (and a second office, if any) + office hours
- [ ] Both phone numbers, confirmed
- [ ] WhatsApp Business number
- [ ] The real enquiry inbox email address
- [ ] Live links: X, LinkedIn, YouTube, Facebook (Instagram is already live)
- [ ] RERA registration number(s) — footer and individual project listings
- [ ] Real credibility stats: total sales value, properties transacted, years in business, with something to attribute them to
- [ ] Confirm the six press names currently listed (Tribune, Hindustan Times, Economic Times, Times of India, Business Standard, Mint) can be evidenced — or remove them

### Decisions needed
- [ ] Does the price show publicly on a listing, or stay "Price on request"?
- [ ] Should a reference code (e.g. `GL-PKL-26-0142`) show on the public property page?
- [ ] Should a short documentation checklist ("Registry available", "OC received") show publicly as a trust signal?
- [ ] Are `Reserved` properties shown publicly, or hidden like `Sold`/`Rented`?
- [ ] Separate login per person (Ashu, Divya, staff), or one shared admin login?
- [ ] Fixed list of localities/sectors, or do they add their own?
- [ ] Confirm the deal pipeline stages: Enquiry → Site Visit → Negotiation → Token → Agreement → Registry → Closed
- [ ] Per-item furnishing counts ("AC × 3"), or just presence/absence?
- [ ] Existing inventory spreadsheet? (defines the bulk-import format)
- [ ] Keep or remove the scrolling "recent activity" ticker on the homepage — it currently shows placeholder activity, not real visitor data

### Optional features — tell us which ones matter
- [ ] Property comparison tool (side-by-side)
- [ ] Downloadable PDF property sheet
- [ ] Saved-search alerts (buyer notified when matching inventory appears)
- [ ] Locality landing pages (e.g. "3 BHK flats in Zirakpur")
- [ ] NRI section (remote buying, documentation, time-zone-aware callbacks)
- [ ] Requirement-to-inventory matching in the CRM
- [ ] Follow-up task reminders in the CRM

### Accounts & access
- [ ] Cloudinary account/API keys (photo uploads currently run on a fallback mode)
- [ ] newsdata.io API key (powers the News page)
- [ ] Domain name + hosting decision, for launch
- [ ] Who signs off on the privacy policy and data-handling notice — required once client phone numbers are stored, under India's DPDP Act 2023

---

## 9. Where things live (quick map)

| What | Where |
|---|---|
| Every company-specific string (name, contact, hero copy, stats) | `lib/data.ts` |
| Admin-editable overrides on top of `lib/data.ts` | `lib/site-settings.ts`, `site_settings` table |
| Full DB schema | `lib/db/schema.ts` |
| Public read layer, allowlisted columns | `lib/db/queries.ts`, `lib/db/public-columns.ts` |
| Taxonomy (property types, amenities, area units, etc.) | `lib/attributes.ts`, `lib/taxonomy/*.ts` |
| Location hierarchy | `lib/locations.ts` |
| Seed script (idempotent, run via `npm run db:seed`) | `scripts/seed.mjs` |
| Leak check (public/internal boundary verification) | `scripts/leak-check.mjs` |
| Public routes | `app/(site)/**` |
| Admin panel | `app/admin/**` |
| Requirement register (the full brief this was built against) | `docs/REQUIREMENTS_V2.md` |
| This file | `docs/handout.md` |

## Sep 2026 final pass — what changed

See [TASKS.md](TASKS.md#shipped--sep-2026-final-pass) for the list. Things
that re-break easily:
- Don't turn Next image optimisation back on (uploaded-quality rule).
- Public pages are cached; a script writing to the DB doesn't refresh them —
  an admin save does.
- `npm run dev` re-runs `scripts/seed.mjs` through `predev`.
- Demo listings are marked `sourceName = "Demo data"`; remove them with
  `node scripts/seed-demo.mjs --remove` before real marketing.
