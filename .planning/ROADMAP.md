# Roadmap: Global Landmark Realty Group — CFF Expansion (Aug 2026)

## Overview

A shipped luxury real-estate site grows a brokerage's operating system inside it.
The journey runs foundation-first: the ~150-field CFF taxonomy and the public/internal
table split land before anything is built on top of them (Phase 1), because the
hardest rule in the SPEC — no owner phone, brokerage figure, circle rate or legal
document ever reaching a public page — is a schema property, not a review checklist.
From there the admin becomes capable of holding a real listing (Phase 2), then a real
builder/project/tower hierarchy (Phase 3). Only then does the public site get the
discovery density the client asked for (Phase 4), the enquiry cart that converts it
(Phase 5), and the CRM that turns those leads into tracked brokerage (Phase 6). The
brand pass (Phase 7) waits on the client's own photographs and numbers, which is why
it sits late despite being the most visible work. Growth features (Phase 8) and
compliance/hardening (Phase 9) both carry approval gates, because they are the
implementer's proposals, not the client's request.

**Phase structure is the SPEC's own §9 plan, P0–P9, unchanged.** It was not
re-decomposed: the client's sign-off, the §10 coverage checklist and the dependency
graph are all written against it. `Phase N` here maps 1:1 to the SPEC's `PN`.

---

## Universal Gates

Every phase's **Done when** carries all three. They are not optional and not
deferrable to the end.

| Gate | What it is |
|---|---|
| **G1 — coverage** | Every §10 coverage-checklist row this phase owns comes back ticked, and no previously-ticked row regresses. At Phase 9 this becomes the **full** checklist, fully ticked. |
| **G2 — leak check** | Render a property page, then grep the served HTML **and** the client JS payload for a known owner phone number, a brokerage figure and a circle rate. **Zero hits**, or the phase is not done. (SPEC §4.1) |
| **G3 — build** | `npm run lint && npm run build` green. |

Partial delivery is failure. G2 needs seeded internal data with known values to be
meaningful — that lands in Phase 1's seed, and Phase 0 records the pre-change
baseline.

---

## Phases

- [ ] **Phase 0: Client Intake** - Send §11 and collect every asset, number, key and decision the build waits on
- [ ] **Phase 1: Taxonomy & Schema Foundation** - Every CFF field gets a home and the public read layer physically cannot return an internal column
- [ ] **Phase 2: Admin Property Form Rebuild** - A broker enters a complete CFF listing from a phone without losing work
- [ ] **Phase 3: Builders, Projects & Tower Inventory** - Builder → Project → Tower → Unit, plus the one-screen pitch view
- [ ] **Phase 4: Public Listings Rework** - Collections, location and configuration tabs, redesigned cards, full detail and project pages
- [ ] **Phase 5: Enquiry Cart & Leads** - Shortlist several properties, send one enquiry, never lose it to a dead mail server
- [ ] **Phase 6: CRM & Brokerage** - Enquiry becomes client becomes deal becomes tracked brokerage, all internal
- [ ] **Phase 7: Landing & Brand Pass** - Every number, photograph and contact detail is real and client-editable
- [ ] **Phase 8: Growth Features [ADDED]** - Whichever Group H conversion features the client approves
- [ ] **Phase 9: Compliance & Hardening** - Doc sync committed; DPDP, RERA, performance, SEO and accessibility gated on approval

---

## Phase Details

### Phase 0: Client Intake (SPEC P0)
**Goal**: Every answer, asset and key the build waits on is in hand, so no later phase stalls on a person.
**Scope** (SPEC §9 P0): Send the §11 follow-up list, all 30 items. Collect office and team photographs, the black-and-white set at full resolution with property attribution, a real Tricity replacement for the India Gate shot, photos and full details for the first live listings, the full registered office address and hours, both phone numbers plus the WhatsApp business number, the real enquiry inbox, live social URLs, RERA registration number(s), real credibility figures with something to attribute them to, the press-masthead evidence decision, the product decisions in §11 items 13–24, the `[ADDED]` approval answers in items 25–26, and the accounts — Cloudinary keys (currently in paste-URL fallback), newsdata.io key, domain/DNS and hosting target.
**Depends on**: Nothing. Blocked on the client, not on us — this phase is outbound, then waiting.
**Requirements**: none owned — this is a gate phase
**Unblocks**: R-02, R-03, R-06, R-36, R-37, R-38 in Phase 7; Open Items 1, 2 and 3
**Success Criteria** (what must be TRUE):
  1. The §11 list has been sent and each of its 30 items has either an answer on file or a recorded "still waiting" with a date — no silent gaps.
  2. **Open Item 1 closed**: R-37 and R-38 have written Need / Build / Done-when blocks, and the first-listings count is confirmed as three or four.
  3. **Open Item 2 closed**: each of Groups I–M is marked committed or gated, with R-54 answered explicitly — approved R-31 depends on it.
  4. **Open Item 3 closed**: R-32, R-34, R-35 and R-36 are confirmed in scope or re-tagged `[ADDED]`.
  5. Cloudinary keys are live (paste-URL fallback retired), the newsdata.io key is set, and every delivered asset is filed where Phase 7 can pick it up.
**Done when**: **G1** no §10 row regresses (none are ticked yet) · **G2** the leak grep is run against the current production build to record a clean baseline, zero hits · **G3** `npm run lint && npm run build` green on a clean checkout · plus every Success Criterion above. This phase ships no code; the gates are run to establish the baseline the later phases are measured against, not skipped.
**Plans**: TBD

### Phase 1: Taxonomy & Schema Foundation (SPEC P1)
**Goal**: Every CFF field has a home in the database behind one canonical taxonomy list, and the public read layer physically cannot return an internal column.
**Scope** (SPEC §9 P1): Full CFF taxonomy in `lib/attributes.ts` and `lib/locations.ts`, splitting to `lib/taxonomy/*.ts` past ~400 lines, each list defined once and imported by both admin and public. The §5.2 new tables (18, of which 13 are internal-only) plus the §5.1 additive columns on `properties`, `projects` and `property_images`. Real `drizzle-kit generate` SQL migrations for anything that moves or drops data — `push` stays for purely additive columns only. `scripts/seed.mjs` producing one fully-populated example of every new entity. The `PublicProperty` / `AdminProperty` type split, and explicit Drizzle `columns:` allowlists on every public query **including every joined relation** (GAP-02).
**Depends on**: Nothing — runs in parallel with Phase 0
**Requirements**: R-10, R-11, R-14, R-16, R-17, R-18, R-19, R-20, R-21, R-22, R-23, R-24, R-25, GAP-02
**Also advances**: R-04 (collection map), R-07 (columns), R-08 (`lib/locations.ts`), R-09 (fixed list + migration of free-text values), R-13 (`property_charges`), R-15 (`property_owners`), R-29 (`property_documents`), R-32 (`leads`), R-36 (`site_settings`), GAP-03 (the `lib/db/schema.ts` price comment)
**Success Criteria** (what must be TRUE):
  1. `scripts/seed.mjs` produces at least one fully-populated row of every new entity, so both admin and public pages can be exercised with zero client data.
  2. Every §10 field group has a named home — real column, `text[]`, JSONB or sibling table — and each choice matches §4.2's rule for that kind of field. No 150-column table, no single JSON blob.
  3. Every public query passes an explicit `columns:` allowlist, and so does every `with: {…}` joined relation. Adding an internal column to `properties` **or** `projects` changes no public payload.
  4. Passing a raw Drizzle row into an `app/(site)/**` component is a TypeScript error, not something a reviewer has to catch.
  5. The table split shipped through generated SQL migrations committed under `drizzle/`; no destructive statement reached production through `push --force`.
**Done when**: **G1** every §10 row this phase owns ticked at the "storable" level, no regression · **G2** leak grep zero hits, now meaningful because the seed carries a known owner phone, brokerage figure and circle rate · **G3** `npm run lint && npm run build` green · plus every Success Criterion above.
**Plans**: TBD

### Phase 2: Admin Property Form Rebuild (SPEC P2)
**Goal**: A broker can enter a complete CFF property from a phone at a site visit without losing work, and every internal field they type stays internal.
**Scope** (SPEC §9 P2): The property form sectioned into the CFF's own 20 groups, each collapsible with a filled/total count, with conditional sections driven by one map keyed on property type. Draft publication state plus ~20s autosave. Ref-code generation, listing status, added-by and source name. Media categories (exactly one cover per property, enforced). The internal document vault behind an admin-gated stream route calling `requireAdmin()`. Multiple owners per property. Charges with amount, basis and included-in-demand, plus the computed all-in figure. The admin property list at scale and the navigation IA that hosts it. GAP-01 lands here because §4.5's autosave makes the unfiltered slug scan acute.
**Depends on**: Phase 1
**Requirements**: R-07, R-13, R-15, R-28, R-29, R-33, R-34, GAP-01
**Also advances**: R-08 (admin location entry from the same taxonomy), R-09 (configuration templates pre-filling room counts), R-10, R-11, R-14, R-16, R-20, R-24 (form sections), R-12 (the conditional-section map)
**Success Criteria** (what must be TRUE):
  1. Every CFF field is editable in admin, sectioned into the CFF's own 20 groups with a filled/total count per header — and no single page carries all ~150 fields.
  2. A Residential Plot never asks for balconies; a tower flat always asks for floor and unit — one map keyed on property type drives it.
  3. A half-entered listing survives a dropped connection mid-call: drafts autosave ~every 20s, and only `published` + `Available` reaches the public site.
  4. Every property gets a unique `GL-<CITY>-<YY>-<seq>` ref code on insert, never reused after a delete; the admin list filters by status with a colour legend, and none of ref code / dates / added-by / status appears in public HTML or JSON.
  5. An unauthenticated request for a legal document returns 401/404 with no redirect leak, and no document URL reaches a sitemap, JSON-LD or public bundle.
  6. Admin save latency does not scale with total inventory — no unfiltered table scan remains on the write path (GAP-01).
**Done when**: **G1** every §10 row this phase owns ticked at the "editable in admin" level, no regression · **G2** leak grep zero hits — owner phone and circle rate now exist in real admin-entered rows, so this is the first phase where G2 has teeth · **G3** green · plus every Success Criterion above. **Carve-out**: R-34 is one of the four "implied" requirements in PROJECT.md Open Item 3. It ships on the §6 reading; if the client re-tags it `[ADDED]`, it is dropped without disturbing criteria 1–5, and its pagination folds into Phase 9's R-75.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Builders, Projects & Tower Inventory (SPEC P3)
**Goal**: The brokerage can model Builder → Project → Tower → Unit, and pitch a builder's whole track record from one screen.
**Scope** (SPEC §9 P3): A `builders` table with admin CRUD and the builder selector on the project form — literally the "Builder Linked With Project" column the client asked for. Project fields: launch date, possession date, possession status, price appreciation, total towers, total units, green area, number of floors, project-level amenities, location quartet, cover image. A `towers` table with units linked by `towerId` + `floorNumber` + `unitNumber`. The duplicate-unit clone action. The admin pitch view.
**Depends on**: Phase 2
**Requirements**: R-12, R-26
**Also advances**: R-22 (project-level vs unit-level amenity split), R-27 (project data the public page renders), R-33 (nav gains Builders and Towers/Inventory)
**Success Criteria** (what must be TRUE):
  1. Creating "Green Lotus Saksham" and selecting builder "Green Lotus" shows the builder profile, RERA, dates, appreciation history and every other project by that builder on one admin screen.
  2. Adding the second-to-tenth flat in a tower takes under 10 fields — the duplicate-unit action clones everything shared, leaving floor, unit, area, price and status.
  3. A flat inherits its society's club / pool / gym instead of re-entering them; unit and project amenities de-duplicate on render.
  4. Builder name is public where the SPEC says it is; builder contact name and phone are not, and the leak grep proves it.
**Done when**: **G1** the §10 Builder Details rows ticked at their stated visibility (name/RERA/dates **P**, price appreciation **I**, past projects **B**) · **G2** leak grep zero hits, extended to builder contact fields · **G3** green · plus every Success Criterion above.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Public Listings Rework (SPEC P4)
**Goal**: A buyer can find a property by collection, city and configuration and read a complete, honest listing page — with nothing internal on it.
**Scope** (SPEC §9 P4): Six-card collection grid at the top of `/properties` plus a persistent tab row on the filtered view, `?group=` composing with every other filter. City tab row with dependent locality and sector selects, horizontally scrollable on mobile with per-city counts. Configuration filter tabs. Card redesign — collection badge, configuration, primary area, possession, locality, project/society, PLC highlights, price or "Price on request", 4:5 crop and hover cap preserved. Expanded detail page: two-column spec table, legal strip, grouped amenities, furnishing, loan, parking, PLC, gallery tabbed by media category with a video/drone/tour strip. `/projects/[slug]` with tower availability. Every new route added to `sitemap.ts`, `lib/admin/revalidate.ts` and the search index.
**Depends on**: Phase 2, Phase 3
**Requirements**: R-04, R-08, R-09, R-27
**Also advances**: R-05 (card redesign half), R-11, R-16, R-17, R-18, R-19, R-20, R-21, R-22, R-23, R-25 (public render and filters), R-13 (public price gating and the `PROPERTY_DETAIL.sidebarNote` copy), R-28 (public gallery tabs), GAP-03 (sidebar copy)
**Success Criteria** (what must be TRUE):
  1. Six collections render with correct live counts, compose with `?category=`, `?city=`, `?type=` and every other filter, survive refresh and the back button, and are reachable from header and menu.
  2. Clicking a city tab filters instantly, locality and sector narrow with it, and a deep link restores the exact tab state — admin and public share one location vocabulary, so filters and data cannot drift.
  3. The detail page renders the whole public half of the CFF — spec table, legal strip, grouped amenities, furnishing, loan, parking, PLC — showing a formatted Indian price or "Price on request" per `showPricePublicly`.
  4. `/projects/[slug]` shows live per-tower unit availability, and marking a unit sold updates it within one revalidation.
  5. Every new public route is registered in `sitemap.ts`, `lib/admin/revalidate.ts` and the search index — no stale collection page after a status change.
**Done when**: **G1** every §10 row marked **P** ticked at the "rendered publicly" level, and every **I** row confirmed absent · **G2** the sharpest run of the whole project — grep every **new** public route's HTML and client JS payload, not just the property detail page, for the owner phone, brokerage figure and circle rate; zero hits · **G3** green · plus every Success Criterion above.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Enquiry Cart & Leads (SPEC P5)
**Goal**: A visitor can shortlist several properties and send one enquiry, and that enquiry survives even when the mail server does not.
**Scope** (SPEC §9 P5): "Add to enquiry" toggling to "Added ✓" on card and detail page. Shortlist in `localStorage`, capped around 20, with an empty state, removed-item undo and clear-all. Floating dock showing the count and opening a panel with thumbnails and remove buttons. One submit sending one enquiry covering every shortlisted property, reusing `ContactForm` + `submitInquiry` with a `propertyIds` payload extension. A `leads` row persisted **before** mail is sent, capturing source, page URL, shortlisted IDs and UTM parameters. Admin lead inbox with unread counts, status (new / contacted / converted / dropped), assignment, one-click convert to a CRM client, and CSV export. Honeypot and rate limiting preserved on the new path.
**Depends on**: Phase 4
**Requirements**: R-05, R-32
**Also advances**: R-30 (the lead → client conversion path the CRM consumes), R-33 (nav gains Leads)
**Success Criteria** (what must be TRUE):
  1. A shortlist survives navigation and a full reload; adding one property opens the panel with a one-tap send — and it never sends without a name and phone.
  2. One submit produces one enquiry email listing every shortlisted property with its ref code, plus the existing branded confirmation to the visitor.
  3. Killing SMTP still leaves a complete `leads` row for every enquiry — persistence happens first, sending second.
  4. The admin lead inbox shows unread counts and status, a lead can be assigned and exported to CSV, and no lead's phone number appears on any public surface.
  5. Honeypot and rate limiting still fire on the new combined-enquiry path.
**Done when**: **G1** §10 row "R-05 card + enquiry cart" and "R-32 lead persistence" ticked, no regression · **G2** leak grep zero hits, extended to the new lead surfaces · **G3** green · plus every Success Criterion above. **Two carve-outs**: (a) the SPEC's P5 scope line names "notifications", which is **R-65, an `[ADDED]` item** — it ships only with client approval (Open Item 2); without approval the inbox is polled rather than pushed, and a `// ponytail:` comment names that ceiling. (b) R-32 is one of the four "implied" requirements in Open Item 3; it is on the §10 client checklist so it ships regardless, but a re-tag would make the admin-inbox portion droppable.
**Plans**: TBD
**UI hint**: yes

### Phase 6: CRM & Brokerage (SPEC P6)
**Goal**: A website enquiry becomes a client, a deal and a closed transaction with correct brokerage figures — without leaving the admin, and without any of it touching the public site.
**Scope** (SPEC §9 P6): `/admin/crm` with client list and search; client detail carrying requirement notes, budget range, preferred locations and types, and an activity timeline (call / site visit / note / WhatsApp / email, with timestamp and author). Deal pipeline by stage — Enquiry → Site Visit → Negotiation → Token → Agreement → Registry → Closed / Lost (**CONFIRM** the exact ladder, §11 item 19). One-click convert from a lead, carrying its shortlisted property IDs. Brokerage per deal: deal value, percent, amount (computed, overridable), shared commission, paid, and pending (derived, **never stored**), with dated payment entries so partial receipts add up. Summary view: total pending, this month's closed value, per-stage counts. The admin dashboard. **`[ADDED]` portion, gated**: R-54 named users + roles + audit log, R-56 tasks, R-68 reports.
**Depends on**: Phase 5 · **plus explicit client approval for the `[ADDED]` portion (R-54, R-56, R-68) — PROJECT.md Open Item 2**
**Requirements**: R-30, R-31, R-35
**Also advances**: R-33 (nav gains CRM: Clients · Deals · Brokerage, and Users if R-54 is approved)
**Success Criteria** (what must be TRUE):
  1. A website enquiry becomes a client, then a deal, then a closed transaction, entirely inside the admin.
  2. 2% on a ₹1.2 Cr deal with ₹1 L received shows the correct pending figure everywhere it appears, and partial receipts add up across dated payment entries.
  3. No brokerage number, deal value or client phone number appears in any public payload.
  4. The dashboard shows active listings by status, new leads today/this week, deals by stage, brokerage pending, listings not updated in 30+ days and the live Deal of the Week — every tile linking to its filtered list.
  5. The CRM tables are not named `deals`; Deal of the Week keeps working untouched.
**Done when**: **G1** §10 rows "R-30 CRM" and "R-31 brokerage" ticked, all Ownership (§8) and Brokerage (§18) rows confirmed **I** · **G2** leak grep zero hits, extended to every CRM route and the brokerage summary · **G3** green · plus every Success Criterion above — **with two carve-outs, neither of which may be silently assumed**:
  - **R-31 attribution is split (Open Item 2).** The brokerage maths, the summary view and criterion 3 are verifiable without R-54 and are inside this phase's gate. The **per-agent split and per-person attribution are NOT ticked** unless R-54 is approved and built. If R-54 is declined, the per-agent row is recorded as Deferred in the Progress table with the reason, and a `// ponytail:` comment names the ceiling — it is not quietly skipped, and R-31 is not reported complete.
  - **R-35 is one of the four "implied" requirements (Open Item 3).** It ships on the §6 reading; a re-tag drops it without touching R-30 or R-31.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Landing & Brand Pass (SPEC P7)
**Goal**: Every number, photograph and contact detail on the public site is real and the client's — and the ones that move are editable without a code deploy.
**Scope** (SPEC §9 P7): Hero category boxes — translucent dark fill, hairline `border-gold/40`, `backdrop-blur-sm`, active/inactive states, 2×2 on narrow screens, focus ring on the box, `.hero-cats` step in the GSAP intro timeline untouched. Real credibility figures through one shared Indian-system formatter (Lakh / Crore, `en-IN` grouping) used everywhere including emails, with unevidenced press mastheads removed. Imagery pass: India Gate removed, zero Unsplash URLs in shipped code, the black-and-white set treated as a deliberate editorial series at full-bleed or large 4:5 crops, art-directed mobile and desktop crops. Contact truth across `COMPANY` in `lib/data.ts`, footer, fullscreen menu, contact page, `organizationJsonLd()` and `lib/email.ts`, with office hours, a Maps link (and its CSP `frame-src` entry) and the RERA number on the licence line. Office and team photographs. The first live listings. The `site_settings` settings page with `lib/data.ts` as fallback default.
**Depends on**: **Phase 0 assets — this phase cannot start until the client delivers** · Phase 1 (`site_settings`) · Phase 4 (the listing surfaces R-38's listings publish onto)
**Requirements**: R-01, R-02, R-03, R-06, R-36, R-37 ⚠️, R-38 ⚠️
**Success Criteria** (what must be TRUE):
  1. All four hero category boxes are legible over all four slide images at 360 / 768 / 1440px, the reduced-motion path is unchanged, keyboard focus is visible on the box rather than only the label, and the links still work.
  2. No figure on the page is unattributable to something the client supplied, and every currency renders in the Indian system everywhere — page, JSON-LD and transactional email.
  3. Zero Unsplash URLs remain in shipped code (`lib/data.ts` and `scripts/seed.mjs` included), the India Gate shot is gone, and every landing-page image is the client's.
  4. Footer, fullscreen menu, contact page, JSON-LD and email templates all show identical real details, and no `#` link remains anywhere.
  5. Contact details, stats, hero copy and office hours change from the admin settings page without a deploy, with `lib/data.ts` still serving as the fallback default.
**Done when**: **G1** §10 rows R-01, R-02, R-03, R-06 ticked, no regression · **G2** leak grep zero hits · **G3** green · plus Success Criteria 1–5 — **with R-37 and R-38 explicitly excluded from this gate until Open Item 1 is resolved.** Neither has any acceptance criteria in the source, and the first-listings count is ambiguous ("three to four" in §2.1 versus "four" in §10). This phase closes green on criteria 1–5 alone; R-37 and R-38 tick only once the client supplies a written Done-when and a confirmed count, closing either here or in an inserted Phase 7.1. **They are never assumed satisfied, and the §10 client-update checklist cannot be reported complete while they are open.** R-36 additionally carries the Open Item 3 "implied — droppable" carve-out.
**Plans**: TBD
**UI hint**: yes

### Phase 8: Growth Features [ADDED] (SPEC P8)
**Goal**: Whichever high-intent conversion features the client picks from Group H are live, and nothing they did not pick was built.
**Scope** (SPEC §9 P8): Whichever of R-39 … R-53 the client approves — area unit converter, EMI calculator, property comparison, PDF property sheet, WhatsApp share, locality landing pages, saved-search alerts, builder public profiles, NRI corner, sell/valuation funnel, journal, careers form, honest reviews.
**Depends on**: Phase 4 · **plus explicit client approval — this entire phase is `[ADDED]`. SPEC §1: "get a yes before spending a phase on one." The sign-off question is §11 item 25.**
**Requirements**: none v1. Candidates, all proposed-not-approved: R-39, R-40, R-41, R-42, R-43, R-44, R-45, R-46, R-47, R-48, R-49, R-50, R-51, R-52, R-53
**Success Criteria** (what must be TRUE):
  1. Every approved Group H feature is live and reachable from the surface the SPEC names for it.
  2. Nothing unapproved was built — shipped scope matches the client's written pick, item for item.
  3. Features that share state with the enquiry cart (R-39 comparison, R-44 shortlist share) reuse the Phase 5 shortlist rather than standing up a second store.
  4. Any new public route (R-46 locality pages, R-47 builder profiles) is registered in `sitemap.ts`, `lib/admin/revalidate.ts` and the search index.
**Done when**: **G1** no §10 row regresses — Group H adds no CFF coverage rows · **G2** leak grep zero hits across every newly added public route, and the PDF sheet (R-43) is checked separately since it renders server-side from the full row · **G3** green · plus every Success Criterion above. **If the client approves nothing, this phase closes as Deferred with the reason recorded — an empty approved set is a valid outcome and does not block Phase 9.**
**Plans**: TBD
**UI hint**: yes

### Phase 9: Compliance & Hardening (SPEC P9)
**Goal**: The site is legally defensible now that it holds personal data, survives real inventory volume, and its documentation describes the code that actually exists.
**Scope — committed** (SPEC §9 P9, no R-number, not `[ADDED]`): doc sync across `CONTENT_MODEL.md`, `SITE_ARCHITECTURE.md`, `TASKS.md` and `README.md`, plus `TECH_STACK.md` — correcting the stale `(marketing)` route-group references in two docs, the superseded "no price by design" banner, the stale `navy` / `navy-90` / `off-white` token names (the real tokens are `ink`, `ink-muted`, `dark`, `dark-deep`, `gold`, `gold-highlight`, `gold-deep`, `cream`, `border`, `error`), the non-existent custom spacing scale, and the stale `motion.*` guidance (the repo uses `m.*` under `LazyMotion strict`).
**Scope — `[ADDED]`, each individually gated**: DPDP consent notices, retention and subject requests (R-70, R-72, R-73); RERA rendering on projects, units, footer and PDFs (R-71); the activity-ticker decision (R-74); pagination and B-tree indexes (R-75); search upgrade (R-76); shared rate-limit store (R-77); real migrations, automated backups and a tested restore drill (R-78); centralised error monitoring and `/api/health` alerting (R-79); image and LCP budget (R-80); the SEO group (R-81 … R-85); the accessibility and quality group (R-86 … R-90).
**Depends on**: all prior phases · **plus explicit client approval per `[ADDED]` item (Open Item 2)**. Additionally: **R-74 requires a direct client decision** (§11 item 24 — the ticker fabricates visitor activity in production today); **R-81 is blocked on R-72**; **R-70 is blocked on R-54**.
**Requirements**: GAP-03. Candidates, all proposed-not-approved: R-70 … R-90
**Success Criteria** (what must be TRUE):
  1. Every doc in the repo describes the shipped code — no `(marketing)` reference, no "no price by design" banner, no `navy` / `off-white` token names, no `motion.*` guidance, no claim that GSAP and Framer Motion are yet to be installed.
  2. The **full** §10 coverage checklist comes back ticked — all 20 CFF field groups and every client-update row, with P / I / B visibility honoured exactly as written.
  3. The §4.1 leak check passes on the finished site, not one page: rendered HTML and client JS payload for **every** public route, grepped for a known owner phone number, a brokerage figure and a circle rate — zero hits.
  4. Every `[ADDED]` item is either live or recorded as declined with a date — none left ambiguous. R-74's ticker decision is written down whichever way it goes.
**Done when**: **G1 is the full checklist here, not a slice** — fully ticked or the work is not done · **G2** the whole-site leak sweep in criterion 3 · **G3** green · plus every Success Criterion above. **If R-37 and R-38 still have no written acceptance (Open Item 1), the §10 client-update checklist cannot be honestly ticked and this phase does not close.** That is the intended behaviour, not an obstacle to route around.
**Plans**: TBD
**UI hint**: yes

---

## Progress

**Execution order:** Phases 0 and 1 run in parallel — Phase 0 is outbound-and-waiting
on the client, Phase 1 needs nothing from them. Everything from Phase 2 onward is
sequential on the dependency graph, except Phase 7 (waits on Phase 0 assets and
Phase 4) and Phase 8 (waits on Phase 4 and an approval), which can slot in wherever
their inputs land.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Client Intake | 0/TBD | Blocked (on client) | - |
| 1. Taxonomy & Schema Foundation | 0/TBD | Not started | - |
| 2. Admin Property Form Rebuild | 0/TBD | Not started | - |
| 3. Builders, Projects & Tower Inventory | 0/TBD | Not started | - |
| 4. Public Listings Rework | 0/TBD | Not started | - |
| 5. Enquiry Cart & Leads | 0/TBD | Not started | - |
| 6. CRM & Brokerage | 0/TBD | Not started | - |
| 7. Landing & Brand Pass | 0/TBD | Not started | - |
| 8. Growth Features [ADDED] | 0/TBD | Not started (awaiting approval) | - |
| 9. Compliance & Hardening | 0/TBD | Not started | - |

---

## Coverage

- v1 requirements: **41** (38 client-originated R-01 … R-38, plus GAP-01, GAP-02, GAP-03)
- Mapped to phases: **41** ✓
- Unmapped: **0** ✓
- Blocked: **2** — R-37 and R-38 have no acceptance criteria in the source (Open Item 1)
- Partially gated: **1** — R-31's per-agent attribution depends on unapproved R-54 (Open Item 2)
- Marked "implied — droppable": **4** — R-32, R-34, R-35, R-36 (Open Item 3)
- Proposed, not approved and **not** counted as scope: **52** (R-39 … R-90)

Full traceability table: [`REQUIREMENTS.md`](REQUIREMENTS.md#traceability).
Open Items in full: [`PROJECT.md`](PROJECT.md#open-items-blocking-clarifications).
