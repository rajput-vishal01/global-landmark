# Constraints

Extracted from `docs/REQUIREMENTS_V2.md` (classified SPEC, precedence 0) — §2.2
the CFF field register, §4 cross-cutting architecture decisions, §5 target data
model, §8 guardrails, §10 the public/internal coverage matrix.

Current-code risk constraints are cross-checked against `.planning/codebase/CONCERNS.md`
(audit dated 2026-08-20) so this file reflects the real state of the repo, not only
the SPEC's intent.

---

## The public/internal boundary
- source: docs/REQUIREMENTS_V2.md §4.1, §10; .planning/codebase/CONCERNS.md #1
- type: protocol
- content: The SPEC calls this "the hardest rule in this document" and a leak "a project-ending defect." Owner phone numbers, brokerage figures, circle rates and legal documents must never reach a public page or a client bundle.
  - Internal data lives in tables the public read layer never imports: `property_internal`, `property_owners`, `property_documents`, `crm_clients`, `crm_deals`, `crm_brokerage`. Separation is by table, not by flag.
  - Every public query passes an explicit Drizzle `columns: { … }` allowlist. Missing allowlist = bug.
  - Two enforced types: `PublicProperty` (the only shape any `app/(site)/**` component may accept) and `AdminProperty` (full row). Public components must not accept the Drizzle row type, so leaks become type errors.
  - Documents are never public URLs. No public Cloudinary folder. Served through an admin-gated route handler calling `requireAdmin()`, streaming via Cloudinary `type: "authenticated"` + short-TTL signed URL or a private bucket. Never in `sitemap.ts`, JSON-LD, or an `<Image>` src.
  - Status governs publication: only `Available` (CONFIRM: possibly also `Reserved`) renders publicly. `Sold`, `Rented`, `Hold`, `Token Received`, `Under Agreement` are admin-only, respected by the list query, the detail route and the sitemap.
  - Mandatory per-phase verification: render a property page, then grep the HTML *and* the client JS payload for a known owner phone number, a brokerage figure and a circle rate. Zero hits, or the phase is not done.
  - **Current-code risk (CRITICAL, CONCERNS #1):** every public query in `lib/db/queries.ts` (`listProperties` L69-95, `getFeaturedProperties` L97-115, `getPropertyBySlug` L117-137, `getActiveDeal` L188-215, `searchProperties` L139-184, `listPropertySlugs` L243-254) uses `db.query.properties.findMany()`/`findFirst()` with `with: { project: true }` and no `columns:` allowlist. Drizzle returns every column of `properties` and of the joined `projects` row. These same helpers feed `app/api/search/route.ts` (public JSON) and `app/sitemap.ts`. The code is already the exact shape that leaks the moment internal columns land.
  - **Current-code risk (LOW→CRITICAL, CONCERNS #18, unlogged in the SPEC):** the SPEC discusses the `properties` allowlist but never states that every `with: { project: true }` join needs the same treatment. Once `projects` carries builder deal terms or other internal fields (§5.2), the unscoped join re-leaks them. Add joined-relation allowlists to the same checklist.

## Field coverage — nothing in the CFF may be dropped
- source: docs/REQUIREMENTS_V2.md §1, §2.2, §10
- type: schema
- content: Every CFF field must be storable, editable in the admin, and either rendered publicly or explicitly marked internal. §10 is the coverage checklist and "comes back fully ticked or the work is not done." Twenty field groups: Basic Details · Property Type (26 entries) · Location Filters · Builder Details · Area · Price Details · Configuration · Ownership · Furnishing · Facing · Possession Status · Property Age · Loan · Legal · Amenities (31) · Parking · Documentation · Brokerage · Photos & Media · Property Specifications. Visibility legend: **P** rendered publicly · **I** admin/internal only · **B** internal always, public when a flag is on. All of Ownership (§8) and all of Brokerage (§18) are **I**; Circle Rate and Mortgaged are **I only**; uploaded document files are **I only**.

## Schema strategy — columns vs arrays vs JSONB vs sibling tables
- source: docs/REQUIREMENTS_V2.md §4.2
- type: schema
- content: The CFF adds ~150 fields. Do not create 150 columns; do not dump everything in one JSON blob.
  - **Real columns** for anything filtered, sorted, faceted or shown on a card: status, type, country/city/locality/sector, configuration, beds/baths, the four areas + units, demand price, possession, age, facing, `listedAt`, `updatedAt`, `addedBy`, `refCode`, `projectId`, `towerId`, floor, unit.
  - **`text[]` arrays** for flat checklists validated against a taxonomy list: amenities, parking, PLC attributes, documentation, furnishing inventory, legal flags, banks on panel. Mirrors the existing `properties.amenities`; adding an option needs no migration.
  - **JSONB** only for open-ended admin-authored content: the existing `extras`, other-charges breakdown, "Other" free text beside a checklist.
  - **Sibling tables** for 1:N or internal data: media, documents, owners, brokerage, CRM, tower inventory, price history.
  - Every list defined **once** in `lib/attributes.ts` (or `lib/taxonomy/*.ts` if that file passes ~400 lines) and imported by both the admin form and the public renderer. Server actions validate against those lists exactly as `parseChoice`/`parseAmenities` do today; unknown values are dropped, not saved.

## Target data model — table inventory and visibility
- source: docs/REQUIREMENTS_V2.md §5.1, §5.2, §5.3
- type: schema
- content: Proposed shape; the implementer may restructure provided every §10 field has a home and §4.1 holds.
  - **Changed:** `projects` gains `builderId` FK, `launchDate`, `possessionDate`, `possessionStatus`, `priceAppreciation`, `totalTowers`, `totalUnits`, `greenArea` + unit, `numberOfFloors`, project-level `amenities text[]`, `country/city/locality/sector`, `coverImage`; keeps `reraNumber`. `properties` stays the public-safe listing record and gains `refCode` (unique), `publicationState` (draft|published|archived), `listingStatus`, `addedBy`, `sourceName`, location quartet + `block`/`society`, `towerId`, `floorNumber`, `totalFloors`, `unitNumber`, the area quartet each with its own unit, `frontFeet`, `depthFeet`, `plcAttributes text[]`, `configuration`, `beds`, `baths`, `balconies`, `roomFlags text[]`, `facing`, `possessionStatus`, `propertyAge`, `furnishing`, `furnishingInventory text[]`, `amenities text[]`, `parkingTypes text[]`, `parkingSlots`, `roadWidth`, `entranceWidth`, `ceilingHeight`, `isCorner`, `isParkFacing`, `legalFlags text[]`, `documentationFlags text[]`, `loanFlags text[]`, `banksOnPanel text[]`, `demandPrice`, `perSqftRate`, `isNegotiable`, `showPricePublicly` (default false), plus existing `extras jsonb`. `property_images` gains `mediaKind` (cover|interior|exterior|floor_plan|other) with exactly one `cover` per property enforced in the action. `deals` is unchanged (Deal of the Week).
  - **New public:** `towers`, `property_media`. **New mixed:** `builders` (name public, contacts internal), `property_charges` (internal, selectively public), `site_settings` (admin-edited, public output).
  - **New internal-only:** `property_documents`, `property_owners`, `property_internal`, `property_price_history`, `leads`, `crm_clients`, `crm_deals`, `crm_activities`, `crm_tasks`, `admin_users`, `audit_log`, `partners`, `saved_searches`.
  - **Derived, never stored:** `brokeragePending = brokerageAmount − brokeragePaid`; collection group (Kothi/Plot/Projects/Flats/Land/Commercial) mapped from `propertyType` + `kind`, no column; days-on-market = `now − listedAt` for non-closed listings.

## Migrations — `push` is additive-only
- source: docs/REQUIREMENTS_V2.md §4.3; .planning/codebase/CONCERNS.md #2, #17
- type: protocol
- content: `npm run build` runs `drizzle-kit push` via `scripts/migrate.mjs` — fine for additive change, dangerous for the table split. Generate real SQL migrations (`drizzle-kit generate`) for anything that moves or drops data; keep `push` for purely additive columns. `scripts/seed.mjs` must produce at least one fully-populated example of every new entity so admin and public pages can be exercised without client data.
  - **Current-code risk (CRITICAL, CONCERNS #2):** `scripts/migrate.mjs` runs `execSync("npx drizzle-kit push --force", …)` unconditionally whenever `DATABASE_URL` is set — i.e. every Vercel build. `--force` auto-accepts destructive statements, and no `drizzle/` directory exists (confirmed absent, CONCERNS #17) so there is no migration history to diff or roll back. A rename or type-narrowing pushed this way silently drops or truncates production data on deploy, with no review step between authoring a schema change and mutating production data, and no rollback path. §5.1's table split is exactly the change class this breaks on.

## Caching and revalidation
- source: docs/REQUIREMENTS_V2.md §4.4
- type: protocol
- content: Every new public query joins the existing pattern — `unstable_cache` + `site-data` tag, wrapped in `failSoft`. Every new admin mutation calls `revalidatePublicSite()`. Every new public route (collections, project pages, builder pages, locality pages) is added to `lib/admin/revalidate.ts`; a stale collection page after a status change is called out as a visible, embarrassing bug.

## Admin form ergonomics
- source: docs/REQUIREMENTS_V2.md §4.5
- type: protocol
- content: The property form goes from ~15 fields to ~150 and must not ship as one endless page. Sectioned into the CFF's own groups, each collapsible with a filled/total count in the header. Conditional sections driven by one map keyed on property type — a Residential Plot never asks for balconies, a tower flat must ask for floor and unit (this is R-12, "not a nicety"). Draft state: `draft` saves without publishing; only `published` + `Available` reaches the public site. Keep the existing action shape — typed state, validation-first, honest errors, `requireAdmin()` first line, `revalidatePublicSite()` last. Native inputs only: `<input type="date">`, `<select>`, checkboxes; no date picker, form library or state manager. Autosave drafts every ~20s to survive a dropped connection mid-entry.

## Third-party surface config coupling
- source: docs/REQUIREMENTS_V2.md §4.6; .planning/codebase/CONCERNS.md #11, #12
- type: api-contract
- content: Any new image host needs **two** edits or the site 500s at render: `images.remotePatterns` in `next.config.ts` **and** `IMAGE_HOSTS` in the property server action. Google Maps embeds, virtual tours and drone video hosts need explicit `frame-src` entries in the CSP. Never widen with a wildcard — `/_next/image` becomes an SSRF proxy.
  - **Current state (CONCERNS #11):** `isAllowedImageUrl()` checks the local `IMAGE_HOSTS` set (`app/admin/(panel)/properties/actions.ts` L38, currently `Set(["res.cloudinary.com", "images.unsplash.com"])`) independently of `next.config.ts`'s `remotePatterns`; the two lists are not derived from a single source. Failure mode is silent admin-side rejection or a public-page 500 discovered post-deploy.
  - **Current state (CONCERNS #12):** `next.config.ts` L14 hardcodes `frame-src https://www.youtube-nocookie.com https://www.instagram.com`. Maps, virtual tour and drone hosts required by R-28 are absent; an embed added without a matching code change is silently blocked by CSP — a browser-console-only failure, not a build error.

## Guardrails — do not break these
- source: docs/REQUIREMENTS_V2.md §8
- type: protocol
- content: Keep the fail-soft wrapper and the `site-data` cache tag — a DB blip must still render the marketing site. No component library, form library, state manager, date picker or second ORM: native HTML + Tailwind + Drizzle, per TECH_STACK.md ponytail conventions. No GSAP or scroll animation in the admin panel. Never wildcard `images.remotePatterns`; add hosts explicitly, in both places. Never weaken the CSP to make an embed work; add the specific `frame-src` host. Never ship the property form as one 150-field page. Never use `db.query.*.findMany()` without a `columns` allowlist in a public query once internal columns exist. Never name the CRM table `deals` — taken by Deal of the Week; the SPEC calls the collision "a real trap." `prefers-reduced-motion` and keyboard paths work on every new surface. Every new non-trivial helper ships with one runnable check.

## Existing behaviour is frozen unless named
- source: docs/REQUIREMENTS_V2.md §1
- type: protocol
- content: "Existing behaviour not mentioned here stays exactly as it is. Do not redesign the landing page, the motion system, or the brand tokens." The SPEC also states it does not pre-write the code — file layout, component split, query shapes and form ergonomics are the implementer's call, made against the conventions already in the repo (ponytail ladder, Server Components by default, Drizzle, Tailwind v4 `@theme` tokens, GSAP for scroll-driven motion, Framer Motion for state-driven motion).

## Phase exit criteria
- source: docs/REQUIREMENTS_V2.md §1, §9
- type: protocol
- content: Each phase is independently shippable and ends green: `npm run lint && npm run build`, plus the §4.1 leak check. Where an item says **CONFIRM**, build the default named there, leave a `// ponytail:` comment naming the ceiling, and put the question on the client follow-up list (§11).

## Admin identity and attribution
- source: docs/REQUIREMENTS_V2.md §3.1, R-54; .planning/codebase/CONCERNS.md #8
- type: protocol
- content: **Current-code risk (HIGH, CONCERNS #8):** `lib/admin/auth.ts` issues a stateless HMAC token `exp.hmac(exp)` encoding only an expiry and a MAC — no user identity anywhere. The file's own comment confirms "tokens have no per-session kill switch — to force-logout a leaked session, rotate `ADMIN_SESSION_SECRET` (invalidates every session)." No admin action can be attributed to a person, and a single leaked password compromises the whole panel with no per-session revocation. This blocks R-31 brokerage attribution, R-55 lead assignment, R-60 price-history actor tracking, R-07's status-change audit and R-70 DPDP named-user access as designed. Remedy per R-54: `admin_users` with roles, per-user login, `audit_log`; keep the HMAC cookie mechanism and add identity to it.

## Performance and scale limits in current code
- source: .planning/codebase/CONCERNS.md #4, #5, #6, #7; docs/REQUIREMENTS_V2.md R-75, R-76, R-77
- type: nfr
- content:
  - **`listProperties` is unbounded (HIGH, CONCERNS #4).** `lib/db/queries.ts` L69-95 has `where`/`orderBy` and no `.limit()`; `app/(site)/properties/page.tsx` renders every returned row. At CFF-onboarding volume (hundreds/thousands of rows via R-61 bulk import) this is an unbounded query plus an unbounded render on every request. Logged as R-75.
  - **`uniqueSlug()` full-table scan on every save (HIGH, CONCERNS #5 — UNLOGGED in the SPEC).** `app/admin/(panel)/properties/actions.ts` L255-263 runs `db.select({ id, slug }).from(properties)` with no `where`, called on every create (L280) and every update (L321). Admin save latency scales with total inventory — worst at exactly the moment §4.5's ~20s draft autosave fires most often. R-75's indexing/pagination scope covers public list/filter queries, not this admin write-path helper. Needs its own line item.
  - **`searchProperties()` unindexed ILIKE feeding a public endpoint (HIGH, CONCERNS #6).** `lib/db/queries.ts` L139-184: up to 6 tokens each expanded into 5 `ilike` `or()` branches plus a correlated subquery against `projects`, no trigram or full-text index, results served directly by `app/api/search/route.ts`. One client request can trigger up to 6×5 ILIKE branches. Logged as R-76.
  - **In-memory rate limiter (HIGH, CONCERNS #7).** `lib/rate-limit.ts` L10 holds state in a module-level `Map`. Every deploy resets all counters; horizontal scaling splits the counter per instance, multiplying the effective limit by instance count. A large multi-phase build is deploy-heavy by nature. Logged as R-77.
  - Target NFRs from `docs/PROJECT_OVERVIEW.md` remain in force: Core Web Vitals stay healthy despite rich animation (LCP unaffected by hero video/motion, no scroll jank); reduced-motion and keyboard/screen-reader users get a fully functional experience.

## Data-safety limits in current code
- source: .planning/codebase/CONCERNS.md #9, #10, #16; docs/REQUIREMENTS_V2.md R-63, R-79, R-88
- type: nfr
- content:
  - **Irreversible delete destroys Cloudinary assets (HIGH, CONCERNS #9).** The property delete action ties image deletion to property deletion with no recovery path. Combined with R-58's expectation of frequent dealer-duplicate cleanup, a mis-click permanently destroys a listing and its media. Logged as R-63.
  - **No centralized error reporting (MEDIUM, CONCERNS #10).** 27 `console.error` occurrences across `lib/` and `app/`; no alerting on `/api/health`. Failed leads, failed notifications and failed autosaves are invisible until a user complains. Logged as R-79.
  - **No test suite anywhere in the repo (MEDIUM, CONCERNS #16).** A repo-wide search for `*.test.*` / `*.spec.*` returns nothing. No regression net for money-adjacent logic (brokerage, price bands) or for the public/internal boundary itself — the one thing that must never regress. Logged as R-88 (assert-based checks, no framework); not yet built for existing helpers either.

## Content-integrity constraints in current code
- source: .planning/codebase/CONCERNS.md #3, #13, #14, #15; docs/REQUIREMENTS_V2.md R-74, R-02, R-06, R-03
- type: nfr
- content:
  - **Fabricated social-proof ticker (CRITICAL, CONCERNS #3).** `lib/data.ts` `TICKER` (L211+) generates content from static random name/event pools and renders it as live visitor activity. Live production risk today, not introduced by the expansion. India's CCPA dark-pattern guidance treats fabricated urgency/activity as a consumer-protection risk. R-74 flags it by name and defers to client decision — the SPEC's instruction is "flag it, do not quietly keep it."
  - **Unattributed credibility figures and press mentions (MEDIUM, CONCERNS #13).** `lib/data.ts` repeats `₹850 Crore` four times (L93, L292, L323, L347) with no sourcing, and the `PRESS` array (L151+) lists mastheads with no verifiable linkage in the codebase. CONCERNS marks this "Unlogged"; that verdict is out of date — **R-02 covers both**, requiring real client-supplied numbers and removal of any of the six mastheads the client cannot evidence.
  - **Placeholder `#` social links (MEDIUM, CONCERNS #14).** `components/sections/Footer.tsx` filters out `href="#"` links, so X, LinkedIn and YouTube render as nothing. CONCERNS marks this "Unlogged"; **R-06 covers it explicitly**, naming the same three placeholders and the silent filter.
  - **Stock imagery including a geographically wrong landmark (MEDIUM, CONCERNS #15).** `lib/data.ts` carries 13+ `images.unsplash.com` references including an "India Gate at dawn" photo (L110-111) for a Tricity-focused brand, and `scripts/seed.mjs` has an `unsplash(id)` helper. CONCERNS marks this "Unlogged"; **R-03 covers it explicitly**, requiring removal of the India Gate shot and zero Unsplash URLs in shipped code.

## Motion, brand and design constraints carried forward
- source: docs/ANIMATION_GUIDELINES.md, docs/DESIGN_LANGUAGE.md, docs/BRAND_GUIDELINES.md; docs/REQUIREMENTS_V2.md §8
- type: nfr
- content: The SPEC freezes these ("do not redesign the landing page, the motion system, or the brand tokens"), so they are constraints on all new surfaces rather than open design questions.
  - **Library split:** scroll-position-driven → GSAP ScrollTrigger; component/UI-state-driven → Framer Motion. Never both libraries for the same element's same interaction.
  - **Motion performance:** animate `transform`/`opacity` only; `will-change: transform` only on actively animating elements; lazy-init heavy effects inside `useGSAP()`; `gsap.matchMedia()` for responsive and `prefers-reduced-motion`; never block LCP on animation; no layout thrash — `ScrollTrigger.batch()` over N instances on a grid; kill/revert on unmount; one `ScrollTrigger.refresh()` after dynamic content load; no markers or GSDevTools in production.
  - **Motion accessibility:** every scroll/hover animation has a `prefers-reduced-motion` fallback giving instant state changes, not a slowed-down version. Content must be reachable and readable with JS/animation disabled — GSAP-hidden (`opacity: 0` pre-JS) elements need a fallback to visible. Keyboard focus states are never suppressed by hover-only patterns.
  - **Explicitly not built:** custom cursor followers, full AJAX page-transition systems, `mix-blend-mode: difference` as a legibility mechanism, blanket image-hover-zoom on non-gallery elements, deep multi-level mega-nav motion.
  - **Gold is an accent, never a fill** — never a large background, never body text, never more than ~10% of any viewport's visual weight. Palette: gold highlight `#F5D98B`, gold primary `#C9992E`, gold deep `#8A5A22`, navy `#14213D`, white `#FFFFFF`, plus derived tokens `navy-90` `#1C2B4D`, `ink-muted` `#4A5468`, `grey-border` `#D8D9DE`, `off-white` `#FAF9F6`.
  - **Imagery:** fixed aspect ratios only for listing/gallery grids — 4:5 primary or 3:2 secondary, never masonry. Hover zoom on gallery/listing images only, capped `scale(1.04–1.08)` over 0.6–0.8s, never on icons, logos or UI chrome. Art-directed desktop/mobile pairs for hero and feature moments. `<Image>` with responsive `sizes`, lazy below the fold, eager + high priority for the LCP hero only.
  - **Voice:** no exclamation points, no ALL CAPS except tracked eyebrow labels, no stock real-estate clichés, no emoji. CTAs calm and specific.
  - **Open decision carried forward:** exact display serif and body grotesque font families are unresolved in both BRAND_GUIDELINES.md and DESIGN_LANGUAGE.md (both defer to TASKS.md, which is outside this ingest set).
