# Requirements: Global Landmark Realty Group

**Defined:** 2026-08-20
**Core Value:** Owner phone numbers, brokerage figures, circle rates and legal documents never reach a public page or a client JS bundle — while every one of the ~150 CFF fields is still storable, editable and either rendered publicly or explicitly marked internal.

**Source of truth:** [`docs/REQUIREMENTS_V2.md`](../docs/REQUIREMENTS_V2.md) (the SPEC,
precedence 0). IDs below are the SPEC's own `R-nn`, kept verbatim so the §10 coverage
checklist and the client sign-off stay traceable. `GAP-nn` IDs are repo-originated —
found in `.planning/codebase/CONCERNS.md` or named in SPEC §9 without an R-number.

**Two approval states, kept strictly separate.** v1 below is SPEC §6
(client-originated). v2 below is SPEC §7, tagged `[ADDED]` in the source, which
states: "Everything in this section is ours, not the client's… Get a yes before
building." v2 is **not** committed scope.

---

## v1 Requirements

Client-originated scope for this round. Each maps to exactly one owning phase in
[`ROADMAP.md`](ROADMAP.md).

### Group A — Public site & brand

- [ ] **R-01**: Hero category words (Sale / Purchase / Lease / Invest) sit in visible bordered boxes, legible over all four slide images at 360 / 768 / 1440px, with a visible keyboard focus ring on the box
- [ ] **R-02**: Every credibility figure on the page is attributable to something the client supplied, and all currency renders in the Indian system (Lakh / Crore, `en-IN` grouping) everywhere including emails
- [ ] **R-03**: Zero Unsplash URLs remain in shipped code; the India Gate image is gone; every landing-page image is the client's, with the B&W set treated as a deliberate editorial series
- [ ] **R-04**: Six collections (Kothi / Plot / Projects / Flats / Land / Commercial) render with correct live counts, compose with every other filter, survive refresh, and are reachable from header and menu
- [ ] **R-05**: A visitor can shortlist properties (persisting across navigation and reload) and send one enquiry covering all of them; the email lists every property with ref code and a `leads` row appears in admin
- [ ] **R-06**: Footer, fullscreen menu, contact page, JSON-LD and transactional emails all show identical real contact details; no `#` links remain anywhere
- [ ] **R-07**: Every property has a unique ref code (`GL-<CITY>-<YY>-<seq>`); status changes flip public visibility within one revalidation; ref code, dates, added-by and status appear in no public HTML or JSON
- [ ] **R-08**: Clicking a city tab filters instantly; deep links restore the exact tab state; admin and public share one location vocabulary
- [ ] **R-09**: Selecting a configuration tab (e.g. "3+1") fills room counts from a template; one list drives admin and public; no existing listing loses its configuration in migration

### Group B — Property data model (the CFF)

- [ ] **R-10**: All 26 CFF property types are reachable somewhere sensible; Lease / Pre-Leased / Investment are modelled as intent or deal attributes, not building types, with the mapping documented
- [ ] **R-11**: All seven area units (incl. Biswa and Bigha) render with Indian digit grouping; a plot listing never shows an empty "Carpet Area" row; area sorting works across mixed units
- [ ] **R-12**: Adding a second unit to a tower takes under 10 fields; the project page shows live availability grouped by tower
- [ ] **R-13**: The admin all-in charge total is correct; public shows a formatted Indian price or "Price on request" per `showPricePublicly`; circle rate appears nowhere public
- [ ] **R-14**: A 3+1 listing shows 3 bedrooms plus a servant room without double-entry; room flags round-trip
- [ ] **R-15**: Owner data (multiple owners per property) is editable in admin, appears in no public query, and the §4.1 leak grep is clean
- [ ] **R-16**: The furnishing level and item checklist round-trip and render cleanly on the detail page for furnished listings only
- [ ] **R-17**: All eight compass facings exist in one source list and are exposed as a public filter
- [ ] **R-18**: All six possession statuses exist as a public filter and a card badge
- [ ] **R-19**: All five property-age bands are storable and filterable
- [ ] **R-20**: Public shows home-loan availability, bank-approved status and panel banks as a selling point; the market-value-vs-circle-rate note stays internal
- [ ] **R-21**: RERA (+ number), CLU, Registry and Freehold render as a compact public "Legal status" strip; Mortgaged is internal only
- [ ] **R-22**: A unit shows its own plus its project's amenities, de-duplicated and grouped by theme, across all 31 CFF entries
- [ ] **R-23**: All six parking types plus slot count are storable; the card shows slot count where it matters
- [ ] **R-24**: All 16 documentation items are storable, internal by default, each able to carry an uploaded file and a note
- [ ] **R-25**: Floor number, total floors, corner, park facing, road width, entrance width and ceiling height render as a two-column spec table on the detail page

### Group C — Builder, project, and the pitch

- [ ] **R-26**: Creating "Green Lotus Saksham" and selecting builder "Green Lotus" shows all builder details and lists their other projects on one admin pitch screen
- [ ] **R-27**: `/projects/[slug]` renders hero, builder line, RERA number, possession dates, project amenities, tower availability, gallery, map, enquiry CTA and brochure, and is present in sitemap, revalidation and search

### Group D — Media and documents

- [ ] **R-28**: A property carries cover + interior set + exterior set + floor plan + four link media types; delete still removes every remote asset first
- [ ] **R-29**: An unauthenticated request for a legal document gets 401/404 with no redirect leak; documents appear in no sitemap, JSON-LD or public bundle

### Group E — Enquiry, leads & conversion

- [ ] **R-32**: Killing SMTP still leaves a complete record of every enquiry — persist the `leads` row first, then send *(implied — droppable, see Open Item 3)*

### Group F — CRM, brokerage & operations

- [ ] **R-30**: A website enquiry can become a client, a deal and a closed transaction without leaving the admin
- [ ] **R-31**: 2% on a ₹1.2 Cr deal with ₹1 L received shows the correct pending figure everywhere; no brokerage number appears in any public payload *(per-agent attribution depends on R-54 — see Open Item 2)*

### Group G — Admin panel

- [ ] **R-33**: Admin navigation covers every destination this round adds, stays utilitarian (no GSAP, no Lenis, no scroll animation) and is usable on a phone at a site visit
- [ ] **R-34**: The admin property list searches by ref code, title, locality, project, owner name and owner phone, filters and sorts, and paginates *(implied — droppable, see Open Item 3)*
- [ ] **R-35**: The admin dashboard shows listings by status, new leads, deals by stage, brokerage pending, stale listings, live Deal of the Week and today's tasks — every tile linking to its filtered list *(implied — droppable, see Open Item 3)*
- [ ] **R-36**: Office address, phones, WhatsApp, email, socials, credibility stats, hero copy and office hours are editable in admin without a code deploy, with `lib/data.ts` as the fallback default *(implied — droppable, see Open Item 3)*

### Client update deliverables — specification incomplete

⚠️ Both are referenced by ID and title only. Neither has a Need / Build / Done-when
block anywhere in the SPEC. See PROJECT.md **Open Item 1**.

- [ ] **R-37**: Office photographs and portraits of Ashu Goyal and Divya Goyal are live on the site — *acceptance absent in source; must be written before Phase 7 can tick it*
- [ ] **R-38**: The client's first live listings are published — *acceptance absent in source; count ambiguous ("three to four" in §2.1 vs "four" in §10)*

### Gap items — repo-originated, not client scope

Not in the client's list. Included in v1 because the approved scope cannot hold
without them.

- [ ] **GAP-01**: `uniqueSlug()` no longer scans the whole `properties` table on every save. Currently `db.select({ id, slug }).from(properties)` with no `where`, called on every create and update (`app/admin/(panel)/properties/actions.ts` L255-263, L280, L321) — admin save latency scales with inventory, worst exactly when §4.5's ~20s draft autosave fires. CONCERNS #5, unlogged in the SPEC; R-75 covers public list queries, not this admin write path
- [ ] **GAP-02**: Joined relations carry `columns:` allowlists too, not just `properties`. §4.1 mandates the allowlist on `properties` but never states that the unscoped `with: { project: true }` in every public query re-leaks the moment `projects` carries internal fields per §5.2. CONCERNS #18. **The §4.1 leak gate is not honestly passable without this**
- [ ] **GAP-03**: Doc sync — `CONTENT_MODEL.md`, `SITE_ARCHITECTURE.md`, `TASKS.md`, `README.md` corrected for this round. Named in SPEC §9 P9 scope with no R-number. Covers the stale `(marketing)` route-group references in two docs, the superseded "no price by design" banner, the stale `navy`/`off-white` token names and the stale `motion.*` guidance in `TECH_STACK.md`

---

## v2 Requirements

SPEC §7, all 52 items, tagged `[ADDED]`. **Proposed, not approved.** Client sign-off
questions are §11 items 25–26. These appear in ROADMAP.md only behind an explicit
approval gate; none is committed scope.

### Group H — Public-facing features that convert (gated → Phase 8)

- **R-39**: Property comparison, 2–4 side by side, sharing state with the enquiry cart
- **R-40**: Area unit converter across all seven units
- **R-41**: EMI / loan calculator seeded from demand price and the loan block
- **R-42**: Site-visit booking writing a lead + a `crm_task`
- **R-43**: Server-generated one-page property/project sheet PDF with QR
- **R-44**: WhatsApp share for a property or a whole shortlist
- **R-45**: Recently viewed strip + smarter "Also Represented" matching
- **R-46**: Locality landing pages (`/properties/[city]/[locality]`)
- **R-47**: Builder public profiles (`/builders/[slug]`)
- **R-48**: NRI corner
- **R-49**: Saved search + WhatsApp/email alerts, keyed on phone, no accounts
- **R-50**: Sell / list-with-us valuation funnel
- **R-51**: Journal / market insights
- **R-52**: Careers / associate onboarding form
- **R-53**: Reviews & honest social proof

### Group I — Admin & operations depth (gated → Phase 6)

- **R-54**: Named admin users, roles, per-user login, audit log — ⚠️ marked "**Required**" for R-31 by the SPEC itself while sitting in the unapproved bucket. See Open Item 2
- **R-55**: Lead assignment & SLA queues
- **R-56**: Tasks & follow-up reminders (`crm_tasks`, Today view)
- **R-57**: Requirement ↔ inventory matching, both directions
- **R-58**: Duplicate detection on owner phone or project + tower + unit
- **R-59**: Inventory ageing / days-on-market reporting
- **R-60**: Price history with actor, date and reason
- **R-61**: Bulk CSV/Excel import with dry-run validation, plus export
- **R-62**: Media tooling — bulk upload, drag reorder, alt text, watermark, compression budget
- **R-63**: Soft delete / archive / restore window
- **R-64**: Global admin search + saved filter presets
- **R-65**: Notifications — new lead to assigned agent, daily digest
- **R-66**: Dealer / channel-partner registry feeding shared commission
- **R-67**: Per-property SEO fields + scheduled publishing
- **R-68**: Reports — pipeline value, source attribution, agent performance, brokerage
- **R-69**: Deal document checklist + brokerage invoice PDF

### Group J — Compliance, legal, data protection (gated → Phase 9)

- **R-70**: DPDP Act 2023 handling — consent notice, purpose limitation, retention, deletion on request, named-user access (R-54), audit trail (R-54). Source calls it "non-optional once the CRM ships"
- **R-71**: RERA advertising compliance — registration number on projects, units, footer and PDFs
- **R-72**: Privacy policy, terms, disclaimer, cookie/consent. Blocks R-81
- **R-73**: Data retention windows & subject-request process
- **R-74**: Activity ticker honesty review — ⚠️ **client decision required**; the ticker fabricates visitor activity in production today (CONCERNS #3)

### Group K — Performance, reliability, scale (gated → Phase 9)

- **R-75**: Pagination + B-tree indexes on every new filter column
- **R-76**: Search upgrade to Postgres full-text or `pg_trgm`
- **R-77**: Distributed rate limiting replacing the in-memory `Map`
- **R-78**: Real SQL migrations, automated backups, tested restore drill
- **R-79**: Centralised error monitoring & alerting on `/api/health`
- **R-80**: Image and LCP budget on a detail page now carrying 20+ images

### Group L — SEO, analytics, growth (gated → Phase 9)

- **R-81**: GA4 + event tracking behind consent (depends on R-72)
- **R-82**: Structured data expansion — breadcrumbs, project/builder, FAQPage, LocalBusiness
- **R-83**: Sitemap & robots covering collections, projects, builders, localities
- **R-84**: Per-property branded OG images
- **R-85**: Local SEO / NAP alignment with the Google Business Profile

### Group M — Accessibility & quality (gated → Phase 9)

- **R-86**: WCAG 2.2 AA pass on every new surface
- **R-87**: Reduced motion & keyboard paths on all new interactive UI
- **R-88**: One runnable assert-based check per non-trivial helper
- **R-89**: Designed empty, loading and error states everywhere new
- **R-90**: Mobile QA matrix at 360px for the admin form, cart, comparison and tabs

> **Note on Groups I–M:** SPEC §9 schedules R-54, R-56, R-68, R-70, R-71, R-72, R-74,
> R-75, R-77, R-78, R-79, R-80, R-86 and R-87 into phases carrying no approval gate,
> contradicting §7's own header. This roadmap takes the stricter reading and gates
> them. See PROJECT.md **Open Item 2**.

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public / buyer accounts and login | R-05 restates "no accounts — auth is out of scope"; the shortlist lives in `localStorage` |
| MLS / IDX live sync | Carried forward from `PROJECT_OVERVIEW.md`; untouched by the SPEC |
| Multi-language i18n | Carried forward; untouched by the SPEC |
| Dark mode | Still undecided per `CLAUDE.md` — do not build or assume it |
| Landing-page, motion-system or brand-token redesign | SPEC §8 freezes all three. R-01/R-02/R-03/R-06 change content and one component's styling, not the system |
| Component library, form library, state manager, date picker, second ORM | SPEC §8 guardrail — native HTML + Tailwind + Drizzle |
| GSAP / scroll animation in the admin panel | SPEC §8 guardrail — the admin is a tool, not a showcase |
| Wildcarded `images.remotePatterns` | SPEC §4.6 — `/_next/image` becomes an SSRF proxy |
| Naming the CRM table `deals` | Taken by Deal of the Week; the SPEC calls the collision "a real trap" |
| Renaming the `(site)` route group to `(marketing)` | `(site)` is shipped truth; the `(marketing)` references in `TECH_STACK.md` and `SITE_ARCHITECTURE.md` are stale and get corrected by GAP-03 |

---

## Traceability

Owning phase = the phase whose Done-when ticks the requirement. **Also advanced in**
= phases that must deliver part of it, because the SPEC's §9 plan is layered
(taxonomy → admin → public) while requirements are vertical. `/gsd-plan-phase` should
read both columns.

| Requirement | Phase (owner) | Also advanced in | Status |
|-------------|---------------|------------------|--------|
| R-01 | Phase 7 | — | Pending |
| R-02 | Phase 7 | Phase 0 (intake) | Pending |
| R-03 | Phase 7 | Phase 0 (intake) | Pending |
| R-04 | Phase 4 | Phase 1 (collection map) | Pending |
| R-05 | Phase 5 | Phase 4 (card redesign) | Pending |
| R-06 | Phase 7 | Phase 0 (intake) | Pending |
| R-07 | Phase 2 | Phase 1 (columns + projections), Phase 4 (visibility) | Pending |
| R-08 | Phase 4 | Phase 1 (`lib/locations.ts`), Phase 2 (admin entry) | Pending |
| R-09 | Phase 4 | Phase 1 (fixed list + migration), Phase 2 (admin templates) | Pending |
| R-10 | Phase 1 | Phase 2 (form), Phase 4 (filters) | Pending |
| R-11 | Phase 1 | Phase 2 (form), Phase 4 (render + sort) | Pending |
| R-12 | Phase 3 | Phase 2 (conditional sections), Phase 4 (project inventory table) | Pending |
| R-13 | Phase 2 | Phase 1 (schema + charges table), Phase 4 (public gating) | Pending |
| R-14 | Phase 1 | Phase 2 (templates), Phase 4 (render) | Pending |
| R-15 | Phase 2 | Phase 1 (`property_owners`) | Pending |
| R-16 | Phase 1 | Phase 2 (form), Phase 4 (render) | Pending |
| R-17 | Phase 1 | Phase 4 (public filter) | Pending |
| R-18 | Phase 1 | Phase 4 (filter + card badge) | Pending |
| R-19 | Phase 1 | Phase 4 (filter) | Pending |
| R-20 | Phase 1 | Phase 2 (form), Phase 4 (public strip) | Pending |
| R-21 | Phase 1 | Phase 4 (public legal strip) | Pending |
| R-22 | Phase 1 | Phase 3 (project-level split), Phase 4 (grouped render) | Pending |
| R-23 | Phase 1 | Phase 4 (card render) | Pending |
| R-24 | Phase 1 | Phase 2 (uploads per item) | Pending |
| R-25 | Phase 1 | Phase 4 (spec table) | Pending |
| R-26 | Phase 3 | — | Pending |
| R-27 | Phase 4 | Phase 3 (project fields, tower data) | Pending |
| R-28 | Phase 2 | Phase 4 (public gallery tabs) | Pending |
| R-29 | Phase 2 | Phase 1 (`property_documents`) | Pending |
| R-30 | Phase 6 | Phase 5 (lead → client conversion path) | Pending |
| R-31 | Phase 6 | — | Pending ⚠️ per-agent split gated on R-54 |
| R-32 | Phase 5 | Phase 1 (`leads` table) | Pending |
| R-33 | Phase 2 | Phases 3, 5, 6, 7 (as destinations land) | Pending |
| R-34 | Phase 2 | — | Pending |
| R-35 | Phase 6 | — | Pending |
| R-36 | Phase 7 | Phase 1 (`site_settings`) | Pending |
| R-37 | Phase 7 | Phase 0 (intake) | Blocked ⚠️ Open Item 1 |
| R-38 | Phase 7 | Phase 0 (intake) | Blocked ⚠️ Open Item 1 |
| GAP-01 | Phase 2 | — | Pending |
| GAP-02 | Phase 1 | Every phase (leak gate) | Pending |
| GAP-03 | Phase 9 | Phase 1 (schema comment), Phase 4 (sidebar copy) | Pending |

**Coverage:**
- v1 requirements: 41 total (38 client-originated R-01…R-38 + 3 repo-originated GAP items)
- Mapped to phases: 41
- Unmapped: 0 ✓
- Of the 41, **2 are Blocked** (R-37, R-38 — no acceptance criteria exist in the source)
  and **1 is partially gated** (R-31's per-agent split depends on unapproved R-54)

**Phases owning zero v1 requirements** — intentional, matching the SPEC's §9 plan:
- **Phase 0** is a client-intake gate; it produces the answers that unblock R-02, R-03, R-06, R-36, R-37 and R-38 in Phase 7
- **Phase 8** is entirely `[ADDED]` Group H, gated on client approval

### v2 provisional routing

Not counted in coverage. Shown so an approval decision has a destination.

| Requirement group | Would land in | Gate |
|---|---|---|
| R-39 … R-53 (Group H) | Phase 8 | Client picks from §11 item 25 |
| R-54 … R-69 (Group I) | Phase 6 | Client answers §11 items 17 and 26; **R-54 first — R-31 depends on it** |
| R-70 … R-74 (Group J) | Phase 9 | Client + counsel; §11 items 24 and 30 |
| R-75 … R-80 (Group K) | Phase 9 | Client approval; R-78 is the data-loss one |
| R-81 … R-85 (Group L) | Phase 9 | R-81 additionally blocked on R-72 |
| R-86 … R-90 (Group M) | Phase 9 | Client approval |

---
*Requirements defined: 2026-08-20*
*Last updated: 2026-08-20 after `/gsd-ingest-docs` synthesis and codebase map*
