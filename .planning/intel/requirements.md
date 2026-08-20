# Requirements

No doc in the ingest set is classified `type: PRD`. Every requirement below is
extracted from `docs/REQUIREMENTS_V2.md` (classified SPEC, precedence 0), which
carries an explicit requirement register in Need / Build / Done-when form and is
described by its own header as the signed scope contract for the Aug 2026 round.

**Two approval states, kept strictly separate:**

- **approved-client-originated** — §6, R-01 to R-36. Sourced from the client's
  CFF 2 field document and the client update list relayed after the voice notes.
- **proposed-not-approved** — §7, R-39 to R-90, tagged `[ADDED]` in the source.
  The SPEC states these are "ours, not the client's… Get a yes before building"
  and "**[ADDED]** items are scoped and buildable but are ours, not theirs — get a
  yes before spending a phase on one." They are **not** committed scope and must
  not be planned as if they were.

`CONFIRM` markers are reproduced verbatim: the SPEC's stated default is the
decision to build; the question goes on the client follow-up list (§11). They are
open items, not blockers.

---

# Approved — client-originated (§6)

## Group A — Public site & brand

## REQ-r01-hero-category-boxes
- source: docs/REQUIREMENTS_V2.md R-01
- status: approved-client-originated
- description: The four hero words (Sale / Purchase / Lease / Invest) get lost over photography; wrap each in a visible bordered box — translucent dark fill, hairline `border-gold/40`, `backdrop-blur-sm`. Active state brighter fill + solid gold hairline, inactive muted cream text. Keep them as links to `/properties?category=…`, keep hover-to-switch-slide, keep the `.hero-cats` step in the GSAP intro timeline. Allow a 2x2 grid on narrow screens. Visible keyboard focus ring on the box, not just the label.
- acceptance: All four legible over all four slide images at 360 / 768 / 1440px; reduced-motion path unchanged; keyboard focus visible; links still work.
- scope: hero, categories, landing page, accessibility

## REQ-r02-credibility-numbers
- source: docs/REQUIREMENTS_V2.md R-02
- status: approved-client-originated
- description: Replace `CREDIBILITY` figures in `lib/data.ts` with the client's real numbers (CONFIRM — §11; until they arrive use defensible placeholders with a `// ponytail:` comment naming the source of truth). Format every figure in the Indian system — Lakh / Crore, `toLocaleString("en-IN")` grouping, one shared formatter. "Indian elements" means naming real micro-markets (Panchkula Extension, Zirakpur, Mohali, New Chandigarh, Derabassi, Kharar, Mullanpur, PR-7) and referencing RERA / GMADA / HUDA where factually true. Do not invent awards, press mentions or transaction volumes; remove any of the six `PRESS` mastheads the client cannot evidence.
- acceptance: No figure on the page is unattributable to something the client supplied; all currency renders in the Indian system everywhere, including emails.
- scope: landing page, credibility band, lib/data.ts, currency formatting, press claims

## REQ-r03-imagery-pass
- source: docs/REQUIREMENTS_V2.md R-03
- status: approved-client-originated
- description: Remove the `ARCH_REVEAL` India Gate image, replace with a real Tricity project shot. Replace every remaining Unsplash URL in `lib/data.ts` and `scripts/seed.mjs` once client photos land. Treat the black-and-white set as a deliberate editorial series — full-bleed or large 4:5 crops, generous whitespace, no shrunken thumbnails, no colour-tinted overlay fighting the monochrome, no mixing B&W and colour inside one grid. Keep existing motion (`data-reveal-img`, `ArchReveal`); only sources and crops change. Art-direct mobile vs desktop crops for hero-scale images.
- acceptance: Zero Unsplash URLs remain in shipped code; every landing-page image is the client's.
- scope: imagery, landing page, editorial photography, lib/data.ts, scripts/seed.mjs

## REQ-r04-listing-collections
- source: docs/REQUIREMENTS_V2.md R-04
- status: approved-client-originated
- description: Add a **collection** axis orthogonal to sale/purchase/lease/invest, derived from `propertyType` (plus `kind === "project"` for Projects) via one map — no new column, no re-tagging. Mapping (adjust with client): Kothi ← Independent House, Villa, Farm House · Plot ← Residential Plot · Land ← R Zone Land, Industrial Plot, agricultural · Flats ← Flat/Apartment, Builder Floor, Penthouse, Studio · Commercial ← SCO, Booth, Shop, Office, Showroom, Warehouse, Industrial Shed, Hotel, Hospital, School Site, Institutional, Mixed Use · Projects ← any `kind = project`. Surface twice: a six-card grid at the top of `/properties` (image, name, live count) and a persistent tab row on the filtered view. `?group=` composes with `?category=`, `?city=`, `?type=` etc., all server-filtered and shareable. Each collection card uses a representative photo, not a stock icon.
- acceptance: Six collections render with correct live counts, compose with every other filter, survive refresh, and are reachable from header and menu.
- scope: taxonomy, collections, /properties, filtering, URL state

## REQ-r05-card-redesign-and-enquiry-cart
- source: docs/REQUIREMENTS_V2.md R-05
- status: approved-client-originated
- description: Card shows collection badge, configuration, primary area + unit, possession status, locality/sector, project/society name, PLC highlights (corner, park facing), and price *or* "Price on request"; keep 4:5 crop, hover zoom cap 1.05, existing reveal batch behaviour. CONFIRM whether a public reference code appears on the card (default: no, per R-07). Enquiry cart: "Add to enquiry" button on card and detail page toggling to "Added ✓"; shortlist persists in `localStorage` (no accounts — auth is out of scope); floating dock shows count and opens a panel with thumbnails and remove buttons; one submit sends **one** enquiry containing all shortlisted properties, reusing `ContactForm` + `submitInquiry` with a `propertyIds` payload extension. Persist a `leads` row (R-32) *before* sending mail, then send the existing branded admin + confirmation emails listing each property with ref code. "Instantly generates an inquiry" means adding one property opens the panel with a one-tap send; it must never send silently without a name and phone. Keep honeypot + rate limit; cap the shortlist (e.g. 20). Empty state, removed-item undo, clear all.
- acceptance: Shortlist survives navigation and reload; the email lists every property with ref code; a `leads` row appears in the admin; spam protections still fire.
- scope: property card, enquiry cart, shortlist, leads, conversion, localStorage

## REQ-r06-footer-contact-truth
- source: docs/REQUIREMENTS_V2.md R-06
- status: approved-client-originated
- description: Update `COMPANY` in `lib/data.ts` with the full office address (currently "Based in Panchkula"), both phones verified, the real inbox (currently placeholder `inquiries@globallandmark.com`), and real socials — X, LinkedIn and YouTube are `"#"` today and are silently filtered out of the footer. Add Facebook if they have one; the icon already exists in `Footer.tsx`. Feed the same data into `organizationJsonLd()` (`lib/seo.ts`) and the email templates (`lib/email.ts`). Add office hours and a Google Maps link/embed (needs the CSP `frame-src` update). Append the RERA registration number to the licence line.
- acceptance: Footer, fullscreen menu, contact page, JSON-LD and transactional emails all show identical real details; no `#` links remain anywhere.
- scope: footer, contact details, JSON-LD, email templates, RERA, lib/data.ts

## REQ-r07-reference-id-dates-source-status
- source: docs/REQUIREMENTS_V2.md R-07
- status: approved-client-originated
- description: Ref code format `GL-<CITY>-<YY>-<seq>` (e.g. `GL-PKL-26-0142`), generated once on insert, unique, never reused after delete. Admin list and detail show ref code, `listedAt`, `updatedAt`, `addedBy` (Global Landmark / Dealer / Owner) with `sourceName`, and `listingStatus`. Status values exactly as given — Available · Reserved · Token Received · Under Agreement · Sold · Rented · Hold — each with a colour badge. Status controls public visibility (§4.1); changing status revalidates public pages immediately. Status filter tabs plus a legend on the admin list. Includes an [ADDED] sub-item: log every status change to `audit_log` with actor and timestamp.
- acceptance: Every property has a unique ref code; status changes flip public visibility within one revalidation; none of these five fields appear in public HTML/JSON.
- scope: ref code, listing status, admin, public/internal boundary, audit

## REQ-r08-location-filters-as-tabs
- source: docs/REQUIREMENTS_V2.md R-08
- status: approved-client-originated
- description: Model the hierarchy Country (India / Dubai / Australia) → City → Locality → Sector/Block, seeded with the client's named list (Chandigarh, Panchkula, Panchkula Extension, Zirakpur, Mohali, New Chandigarh, Derabassi, Kharar, Mullanpur, Airport Road, IT City, PR-7 Road, PR-8, PR-4) plus GMADA / HUDA / MC area classification. Keep it as a typed taxonomy in `lib/locations.ts` unless they need to add localities themselves (CONFIRM → then promote to a `locations` table with admin CRUD). On `/properties`, a city tab row sets `?city=` and auto-selects; locality and sector are dependent selects that narrow with the city. URL is the state — server-filtered, shareable, back-button correct. Admin entry uses the same taxonomy so filters and data cannot drift. Tabs scroll horizontally on mobile with edge fades and show per-city counts. Empty cities either hide or show an explicit empty state with a CTA.
- acceptance: Clicking a city filters instantly; deep links restore the exact tab state; admin and public share one location vocabulary.
- scope: location taxonomy, filter tabs, /properties, URL state, lib/locations.ts

## REQ-r09-configuration-tabs
- source: docs/REQUIREMENTS_V2.md R-09
- status: approved-client-originated
- description: Replace free-text `configuration` with a fixed list — 1–5 BHK, 2+1, 3+1, 4+1, 3+2, Duplex, Triplex, Studio. Admin gets tabs; selecting one pre-fills bedrooms / bathrooms / balconies from a predefined template, still hand-editable afterwards. Public gets the same list as filter tabs on `/properties`. Migrate existing free-text values to the closest list entry, keeping a free-text fallback for anything unmatched.
- acceptance: Selecting "3+1" fills room counts; one list drives admin and public; no existing listing loses its configuration in migration.
- scope: configuration taxonomy, admin form templates, public filters, migration

## Group B — Property data model (the CFF)

## REQ-r10-full-property-type-list
- source: docs/REQUIREMENTS_V2.md R-10
- status: approved-client-originated
- description: Extend `PROPERTY_TYPES` from 14 to the full CFF list (§2.2 group 2). Lease, Pre-Leased Property and Investment Property are **not building types** — they are intent/deal attributes: map `Lease` to the existing `lease` category, and `Pre-Leased` / `Investment` to flags in a `dealAttributes text[]` combinable with any physical type. Write the mapping decision into the taxonomy file as a comment and raise it on the call rather than silently modelling "Investment Property" as a building.
- acceptance: All 26 entries are reachable somewhere sensible; the mapping is documented.
- scope: property type taxonomy, lib/attributes.ts, deal attributes

## REQ-r11-area-measures-and-units
- source: docs/REQUIREMENTS_V2.md R-11
- status: approved-client-originated
- description: Four independent area values, each with its own unit. Front and Depth in running feet. PLC checklist: Park Facing · Corner · Green Belt · Main Road · Highway · Lake View · Hill View · Golf Course · Garden · floor-based PLC. Extend `AREA_UNITS` with Biswa and Bigha (missing today); keep `formatArea()` as the only renderer. Project/tower level gains Number of Floors, Number of Towers, Total Units, Green Area. One helper picks the most meaningful area per type (plot size for plots, super/carpet for flats) for cards and search results — not per-page logic. [ADDED] sub-item: store a normalised `areaSqft` alongside the entered value so filtering and sorting across mixed units works.
- acceptance: All seven units render with Indian digit grouping; a plot listing never shows an empty "Carpet Area" row; area sorting works across mixed units.
- scope: area fields, units, PLC, formatArea, sorting

## REQ-r12-tower-inventory-vs-single-listings
- source: docs/REQUIREMENTS_V2.md R-12
- status: approved-client-originated
- description: Hierarchy Builder → Project → Tower → Unit. A `towers` table; units link by `towerId` + `floorNumber` + `unitNumber`. A "Duplicate unit" action clones shared fields so adding the 2nd–10th flat in a tower takes only floor, unit, area, price, status. Conditional form sections by type (§4.5) — societies get amenities, tower, floor, maintenance; plots get front/depth/PLC; kothis get plot + built-up. The public project page groups available units by tower in a compact inventory table (config · area · floor · price/on-request · status). [ADDED] sub-item: unit-level availability rolls up to a project-level "X units available" badge that updates when a unit is marked sold.
- acceptance: Adding a second unit to a tower takes under 10 fields; the project page shows live availability grouped by tower.
- scope: towers, inventory, project pages, conditional admin form

## REQ-r13-price-and-charges
- source: docs/REQUIREMENTS_V2.md R-13
- status: approved-client-originated
- description: Capture Demand Price, Negotiable, Circle Rate (**internal only**), Per Sq.Ft Rate, plus Maintenance, PLC, IFMS, Club, Parking, IDC, EDC, GST, Registry, Transfer and Other charges. Each charge records amount + basis (lump sum / per sq.ft / percent) + whether it is already included in the demand price. Admin shows a computed all-in figure and a per-sq.ft derived rate. Public display gated by `showPricePublicly`, default off ⇒ "Price on request", preserving current brand copy. [ADDED] sub-items: price bands for public filtering even when the exact price is hidden (e.g. ₹1–2 Cr); every price edit writes a `property_price_history` row (R-60).
- acceptance: Admin all-in total is correct; public shows a formatted Indian price or "Price on request"; circle rate appears nowhere public.
- scope: pricing, charges, showPricePublicly, public/internal boundary

## REQ-r14-configuration-and-rooms
- source: docs/REQUIREMENTS_V2.md R-14
- status: approved-client-originated
- description: Bedrooms, Bathrooms and Balconies as counts. Room flags checklist: Servant Room · Study · Store · Pooja Room · Terrace · Roof Rights. Fed by the R-09 template but individually editable.
- acceptance: A 3+1 listing shows 3 bedrooms + servant room without double-entry.
- scope: rooms, configuration, admin form

## REQ-r15-ownership-block-internal
- source: docs/REQUIREMENTS_V2.md R-15
- status: approved-client-originated
- description: `property_owners` holds Owner Name, Seller Category (Owner / Builder / Investor / NRI / Bank), Number of Owners, Owner Type, Mobile, Alternate Mobile, Address, notes. Support **multiple owners** per property — joint ownership is the norm. Click-to-call and click-to-WhatsApp from the admin row. Phone numbers must never reach a public component; the SPEC calls this the most sensitive field group on the site. [ADDED] sub-item: duplicate detection on owner phone, warning if the same number already has a listing (R-58).
- acceptance: Owner data is editable in admin, appears in no public query, and the §4.1 leak grep is clean.
- scope: ownership, PII, internal-only tables, public/internal boundary

## REQ-r16-furnishing-and-inventory
- source: docs/REQUIREMENTS_V2.md R-16
- status: approved-client-originated
- description: Levels Unfurnished · Semi · Fully · Luxury Furnished. Item checklist: AC · Beds · Sofa · Dining Table · Wardrobes · Refrigerator · Washing Machine · Chimney · RO · Microwave · Curtains · TV · Geyser · Mixer · Other (+ free text). CONFIRM whether per-item counts matter ("AC ×3"); default is presence only. Public renders the list only for furnished listings.
- acceptance: Checklist round-trips and renders cleanly on the detail page.
- scope: furnishing, inventory checklist, property detail

## REQ-r17-facing
- source: docs/REQUIREMENTS_V2.md R-17
- status: approved-client-originated
- description: All eight compass options. Verify South-West is present (the CFF text truncates as "Sout"); keep `FACINGS` as the single source; expose as a public filter — Vastu matters in this market.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: facing, taxonomy, public filters

## REQ-r18-possession-status
- source: docs/REQUIREMENTS_V2.md R-18
- status: approved-client-originated
- description: More than the current three options — Ready to Move · Under Construction · Soft Launch · Possession in 6 Months · Possession in 1 Year · Other. Keep New Launch if still used (CONFIRM). Public filter plus card badge.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: possession status, taxonomy, public filters, card badge

## REQ-r19-property-age
- source: docs/REQUIREMENTS_V2.md R-19
- status: approved-client-originated
- description: New · <1 Year · 1–5 · 5–10 · >10 Years. CONFIRM whether to store a construction year and derive the band instead — better long-term; the default is the band as given.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: property age, taxonomy

## REQ-r20-loan-block
- source: docs/REQUIREMENTS_V2.md R-20
- status: approved-client-originated
- description: Home Loan Available · Bank Approved · Banks on Panel (multi-select, free-add) · Market Value vs Circle Rate note (**internal**) · Other. Public shows "Home loan available · Bank approved · Panel: HDFC, SBI…" as a selling point; the circle-rate comparison stays internal. [ADDED] sub-item: feeds the EMI calculator (R-41).
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: loan, financing, public/internal boundary

## REQ-r21-legal-block
- source: docs/REQUIREMENTS_V2.md R-21
- status: approved-client-originated
- description: RERA Registered (+ number) · CLU Approved · Registry Available · Freehold are **public** — a RERA number is expected in Indian property advertising. **Mortgaged is internal only.** Public renders as a compact "Legal status" strip, not buried in a table.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: legal flags, RERA, public/internal boundary

## REQ-r22-amenities
- source: docs/REQUIREMENTS_V2.md R-22
- status: approved-client-originated
- description: Grow `SUGGESTED_AMENITIES` to all 31 CFF entries (incl. Theatre, Sauna, Steam, Pickleball, Tennis, Cricket, Squash, Badminton, Basketball, Salon, Kids' Day Care, Pet Play Area, Intercom, Other). Keep the existing free-typed-amenity behaviour. **Split project-level amenities from unit-level ones** so a flat inherits its society's club/pool/gym instead of re-entering them. Group by theme (Recreation · Safety · Convenience · Sport) with icons on the public page.
- acceptance: A unit shows its own plus its project's amenities, de-duplicated and grouped.
- scope: amenities, taxonomy, project vs unit inheritance

## REQ-r23-parking
- source: docs/REQUIREMENTS_V2.md R-23
- status: approved-client-originated
- description: Covered · Open · Basement · Stilt · Two-Wheeler · Visitor, plus number of slots. Public card shows slot count for units where it matters.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: parking, taxonomy, property card

## REQ-r24-documentation-checklist
- source: docs/REQUIREMENTS_V2.md R-24
- status: approved-client-originated
- description: Registry · Mutation · Sale Deed · OC · CC · Approved Layout Plan · Electricity · Water · Property Tax Paid · NOC · 13 Sala · Bharmukt · GPA (if required) · Naksha · LOI/EOI · Other. **Internal by default.** CONFIRM: offer a trimmed public version ("Registry available · OC received") — a genuine trust signal that costs nothing to render. Each checklist item can carry an uploaded file (R-29) and a note.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: documentation checklist, internal-only, document vault

## REQ-r25-property-specifications
- source: docs/REQUIREMENTS_V2.md R-25
- status: approved-client-originated
- description: Floor Number · Total Floors · Corner · Park Facing · Road Width · Entrance Width · Ceiling Height, plus Facing / Possession / Age from the blocks above. Render as a two-column spec table on the detail page.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: specifications, property detail page

## Group C — Builder, project, and the pitch

## REQ-r26-builders-first-class
- source: docs/REQUIREMENTS_V2.md R-26
- status: approved-client-originated
- description: A `builders` table plus admin CRUD, with a builder selector on the project form — literally the "Builder Linked With Project" column the client requested. Builder fields: Name, Belongs To (city/region), about, website, logo, internal contact, past/old projects, price-appreciation track record. Project gains RERA Number (exists), Possession Status, Launch Date, Possession Date, Price Appreciation notes. **Pitch view** (the payoff they named): an admin project page showing builder profile, RERA, dates, appreciation history and every other project by the same builder on one screen. [ADDED] sub-item: one-tap "share pitch" generating a PDF/WhatsApp summary (R-43). CONFIRM: a public "Developed by …" line and builder page (R-47).
- acceptance: Creating "Green Lotus Saksham" and selecting builder "Green Lotus" shows all builder details and lists their other projects in one place.
- scope: builders, projects, CRM pitch view, admin

## REQ-r27-project-public-pages
- source: docs/REQUIREMENTS_V2.md R-27
- status: approved-client-originated
- description: `/projects/[slug]` with hero, builder line, RERA number, possession status + dates, project amenities, tower/unit availability (R-12), gallery, location map, enquiry CTA and brochure download. Add to `sitemap.ts`, `revalidatePublicSite()` and the search index. JSON-LD as an appropriate schema.org type carrying the RERA identifier.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: project pages, public routes, SEO, JSON-LD, sitemap

## Group D — Media and documents

## REQ-r28-media-gallery-categories
- source: docs/REQUIREMENTS_V2.md R-28
- status: approved-client-originated
- description: File media — Cover Photo (exactly one, enforced), Interior Photos, Exterior Photos, Floor Plan — all through the existing signed direct-to-Cloudinary path with the cascade-delete guarantee. Link media — Video Link, Drone Video Link, Virtual Tour Link, Google Map, Brochure — validated and stored in `property_media`. Embedding any link requires the CSP `frame-src` update (§4.6); unvalidated URLs must never reach an iframe. Public detail page gallery tabbed by category (Interior / Exterior / Floor Plan) with a media strip for video / drone / tour. [ADDED] sub-items: drag-to-reorder, bulk upload, per-image alt text, optional logo watermarking (R-62).
- acceptance: A property carries cover + interior set + exterior set + floor plan + four link types; delete still removes every remote asset first.
- scope: media, gallery, Cloudinary, CSP, property detail

## REQ-r29-legal-document-vault
- source: docs/REQUIREMENTS_V2.md R-29
- status: approved-client-originated
- description: Upload button per documentation item, PDFs and images. Private storage (§4.1) — never the public Cloudinary folder. Serving goes through an admin-gated route that calls `requireAdmin()` and streams with `Content-Disposition: attachment`. MIME allowlist + size cap + virus-scan consideration; delete the remote object before the DB row, matching the image rule. Show uploader and timestamp; log downloads to `audit_log`.
- acceptance: An unauthenticated request for a document gets 401/404 with no redirect leak; documents appear in no sitemap, JSON-LD or public bundle.
- scope: document vault, security, internal-only, admin-gated routes

## Group E — Enquiry, leads & conversion

## REQ-r32-lead-persistence
- source: docs/REQUIREMENTS_V2.md R-32
- status: approved-client-originated
- description: Every enquiry (contact page, WhatsApp modal, property page, enquiry cart, site-visit request) writes a `leads` row **and** sends the existing emails. Persist first, then send — an SMTP failure must never lose a lead. Capture source, page URL, shortlisted property IDs and UTM parameters. Admin inbox with unread counts, status (new / contacted / converted / dropped), assignment, one-click convert to `crm_client`, and CSV export. [ADDED] sub-item: instant notification to the assigned agent (R-65). Note: the source labels this "implied by the CRM"; it sits in the client-originated §6 register and is on the §10 client-update coverage checklist.
- acceptance: Killing SMTP still leaves a complete record of every enquiry.
- scope: leads, persistence, admin inbox, conversion

## Group F — CRM, brokerage & operations

## REQ-r30-crm-core
- source: docs/REQUIREMENTS_V2.md R-30
- status: approved-client-originated
- description: `/admin/crm` with client list + search, client detail (requirement notes, budget, preferred locations/types, activity timeline) and a deal pipeline by stage. Stages: Enquiry → Site Visit → Negotiation → Token → Agreement → Registry → Closed / Lost (CONFIRM the exact ladder). A deal links one client to one property (CONFIRM multiple properties per deal; default is one property, many deals per client). Website leads convert in one click, carrying shortlisted property IDs. Activity timeline covers call, site visit, note, WhatsApp and email with timestamps and author. [ADDED] sub-items: requirement↔inventory matching (R-57) and follow-up tasks (R-56).
- acceptance: A website enquiry can become a client, a deal and a closed transaction without leaving the admin.
- scope: CRM, clients, deals, pipeline, admin

## REQ-r31-brokerage-tracking
- source: docs/REQUIREMENTS_V2.md R-31
- status: approved-client-originated
- description: Per deal — Deal Value, Brokerage %, Brokerage Amount (computed, overridable), Shared Commission (with whom, how much), Brokerage Paid, Brokerage Pending (computed, never stored). Payment entries with date and mode so partial receipts add up. Summary view: total pending, this month's closed value, per-stage counts, per-agent split. All figures **internal only**. [ADDED] sub-item: a simple brokerage invoice / receipt PDF per deal (R-69). Depends on named people → R-54.
- acceptance: 2% on a ₹1.2 Cr deal with ₹1 L received shows the correct pending figure everywhere; no brokerage number appears in any public payload.
- scope: brokerage, commission, CRM, internal-only, depends on R-54

## Group G — Admin panel

## REQ-r33-admin-navigation-ia
- source: docs/REQUIREMENTS_V2.md R-33
- status: approved-client-originated
- description: Nav covering Dashboard · Properties · Projects · Builders · Towers/Inventory · Leads · CRM (Clients · Deals · Brokerage) · Deal of the Week · Testimonials · Media · Settings · Users. Keep the utilitarian styling — the admin is a tool: no scroll animation, no Lenis, no GSAP. Mobile-usable, because brokers add listings from their phone at a site visit.
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: admin navigation, information architecture, mobile

## REQ-r34-property-list-at-scale
- source: docs/REQUIREMENTS_V2.md R-34
- status: approved-client-originated
- description: Search by ref code, title, locality, project, owner name, owner phone. Filters for status, publication state, type, collection, city, project, added-by, agent. Sorting (newest, oldest, recently updated, days-on-market) plus pagination. Row shows ref code, cover thumbnail, status badge, city, last-updated, agent. Bulk status change and bulk export (CONFIRM). Source labels this "implied — the current plain table dies at a few hundred listings".
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: admin property list, search, filters, pagination

## REQ-r35-admin-dashboard
- source: docs/REQUIREMENTS_V2.md R-35
- status: approved-client-originated
- description: Active listings by status; new leads today / this week; deals by stage; brokerage pending; listings not updated in 30+ days; live Deal of the Week; today's follow-up tasks. Every tile links to its filtered list. Source labels this "implied — three counters do not run a brokerage".
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: admin dashboard, operational metrics

## REQ-r36-settings-page
- source: docs/REQUIREMENTS_V2.md R-36
- status: approved-client-originated
- description: Admin-editable office address, phones, WhatsApp number, email, social links, credibility stats, hero copy and office hours. `site_settings` provides overrides while `lib/data.ts` remains the fallback default — extend the "one file holds every company string" property, do not break it. CONFIRM how much they want to self-serve; the minimum is contact details + stats. Source labels this "implied by R-02/R-06 — contact details and stats should not need a code deploy".
- acceptance: (not stated separately in source — build spec is the acceptance)
- scope: settings, site_settings, lib/data.ts, content editing

## REQ-r37-office-and-team-photos
- source: docs/REQUIREMENTS_V2.md §9 (P0, P7), §10 coverage checklist ("R-37 office/team photos")
- status: approved-client-originated — **specification incomplete**
- description: Referenced by ID and title only. Derivable intent from the client update list §2.1 item 6 ("Ask for their office photos tomorrow. Upload the office photos and photos of both Ashu ji and Divya ji") and §11 items 1–2. No Need / Build / Done-when block exists in §6 or §7.
- acceptance: absent — no Done-when clause in the source. See INGEST-CONFLICTS.md WARNING.
- scope: imagery, office photos, team portraits, P0 intake, P7 landing pass

## REQ-r38-four-live-listings
- source: docs/REQUIREMENTS_V2.md §9 (P0, P7), §10 coverage checklist ("R-38 four live listings")
- status: approved-client-originated — **specification incomplete**
- description: Referenced by ID and title only. Derivable intent from the client update list §2.1 item 2 ("List three to four properties to improve the site's visibility") and §11 item 5. No Need / Build / Done-when block exists in §6 or §7. Note the count discrepancy: the client said "three to four", the checklist title says "four".
- acceptance: absent — no Done-when clause in the source. See INGEST-CONFLICTS.md WARNING.
- scope: seed listings, content, P0 intake, P7 landing pass

---

# Proposed, NOT approved — [ADDED] by the implementer (§7)

The SPEC is explicit: "Everything in this section is ours, not the client's. Each is
scoped to be independently droppable. Get a yes before building." Client sign-off
questions for these are §11 items 25–26. Do not schedule these as committed scope.

## Group H — Public-facing features that convert

## REQ-r39-property-comparison
- source: docs/REQUIREMENTS_V2.md R-39 [ADDED]
- status: proposed-not-approved
- description: Select 2–4 properties and compare configuration, area, price, possession, amenities and location side by side. Shares state with the enquiry cart. High-intent buyers do this in a spreadsheet today.
- acceptance: absent — §7 items carry rationale, not Done-when clauses
- scope: comparison, conversion, public site

## REQ-r40-area-unit-converter
- source: docs/REQUIREMENTS_V2.md R-40 [ADDED]
- status: proposed-not-approved
- description: Inline converter across Sq.Ft / Sq.Yard / Marla / Kanal / Acre / Biswa / Bigha. Buyers think in marla and developers quote in sq.ft; the conversion is named the single most common friction in a Tricity property conversation.
- acceptance: absent
- scope: area units, conversion utility, public site

## REQ-r41-emi-calculator
- source: docs/REQUIREMENTS_V2.md R-41 [ADDED]
- status: proposed-not-approved
- description: On the detail page, seeded from demand price and the loan block (R-20). Amount, rate, tenure → monthly EMI. Client-side only.
- acceptance: absent
- scope: EMI calculator, property detail, depends on R-13/R-20

## REQ-r42-site-visit-booking
- source: docs/REQUIREMENTS_V2.md R-42 [ADDED]
- status: proposed-not-approved
- description: "Book a site visit" with preferred date and time-slot; writes a lead plus a `crm_task` for the assigned agent; confirmation to the visitor by email/WhatsApp.
- acceptance: absent
- scope: site visit booking, leads, CRM tasks

## REQ-r43-property-sheet-pdf
- source: docs/REQUIREMENTS_V2.md R-43 [ADDED]
- status: proposed-not-approved
- description: Server-generated one-page sheet with cover photo, ref code, specs, agent contact and a QR to the listing. What brokers actually send on WhatsApp; also powers the R-26 pitch view.
- acceptance: absent
- scope: PDF generation, sales collateral, depends on R-26

## REQ-r44-whatsapp-share
- source: docs/REQUIREMENTS_V2.md R-44 [ADDED]
- status: proposed-not-approved
- description: Share a property or a whole shortlist as a pre-composed WhatsApp message with title, locality, key specs and the link.
- acceptance: absent
- scope: sharing, WhatsApp, conversion

## REQ-r45-recently-viewed-and-similar
- source: docs/REQUIREMENTS_V2.md R-45 [ADDED]
- status: proposed-not-approved
- description: "Recently viewed" strip from `localStorage`; upgrade "Also Represented" from same-category to same-locality + similar-configuration + similar-budget.
- acceptance: absent
- scope: recommendations, property detail, localStorage

## REQ-r46-locality-landing-pages
- source: docs/REQUIREMENTS_V2.md R-46 [ADDED]
- status: proposed-not-approved
- description: `/properties/[city]/[locality]` style pages ("3 BHK flats in Zirakpur") generated from the location taxonomy, with an intro, live listings and local context. Named the highest-leverage organic search play available to a regional brokerage.
- acceptance: absent
- scope: SEO, locality pages, depends on R-08

## REQ-r47-builder-public-profiles
- source: docs/REQUIREMENTS_V2.md R-47 [ADDED]
- status: proposed-not-approved
- description: `/builders/[slug]` with profile, RERA history, current and past projects. Buyers search builder names constantly. Cross-referenced by R-26's CONFIRM on a public "Developed by …" line.
- acceptance: absent
- scope: builder pages, SEO, depends on R-26

## REQ-r48-nri-corner
- source: docs/REQUIREMENTS_V2.md R-48 [ADDED]
- status: proposed-not-approved
- description: The CFF already has NRI as a seller category and lists Dubai and Australia as countries. A dedicated NRI section covering the remote buying process, documentation, POA, repatriation and time-zone-aware callbacks.
- acceptance: absent
- scope: NRI segment, content, public site

## REQ-r49-saved-search-and-alerts
- source: docs/REQUIREMENTS_V2.md R-49 [ADDED]
- status: proposed-not-approved
- description: A visitor saves a filter set with their phone number; new matching inventory triggers a WhatsApp/email alert. No accounts needed. Backed by the `saved_searches` table.
- acceptance: absent
- scope: saved search, alerts, pipeline

## REQ-r50-sell-list-with-us-funnel
- source: docs/REQUIREMENTS_V2.md R-50 [ADDED]
- status: proposed-not-approved
- description: Dedicated seller page with a valuation request form (property type, location, area, expectation) writing a lead tagged `seller`. Already on the site roadmap in `SITE_ARCHITECTURE.md`; the CRM makes it worth building now.
- acceptance: absent
- scope: seller funnel, valuation, leads

## REQ-r51-journal-market-insights
- source: docs/REQUIREMENTS_V2.md R-51 [ADDED]
- status: proposed-not-approved
- description: Market reports and locality guides. Feeds R-46, feeds credibility, feeds the newsletter. Existing roadmap item.
- acceptance: absent
- scope: journal, content marketing, SEO

## REQ-r52-careers-associate-onboarding
- source: docs/REQUIREMENTS_V2.md R-52 [ADDED]
- status: proposed-not-approved
- description: Brokerages recruit continuously; a simple form writing to `leads` with type `career`.
- acceptance: absent
- scope: careers, recruitment, leads

## REQ-r53-reviews-and-social-proof
- source: docs/REQUIREMENTS_V2.md R-53 [ADDED]
- status: proposed-not-approved
- description: Google review embed or quoted reviews with attribution, replacing or supplementing the fabricated activity ticker (see R-74).
- acceptance: absent
- scope: social proof, reviews, relates to R-74

## Group I — Admin & operations depth

## REQ-r54-named-admin-users-roles-audit
- source: docs/REQUIREMENTS_V2.md R-54 [ADDED]
- status: proposed-not-approved — but marked **Required** by the source; see INGEST-CONFLICTS.md WARNING
- description: `admin_users` with roles (owner / manager / agent), per-user login replacing the single shared password, and an `audit_log` of every create/update/delete/status change/document access. The source says "**Required** for R-31 attribution and for any dispute about who changed what." Keep the HMAC cookie mechanism; add identity to it. §3.1 lists the shared-password supersession as a decision of this round, and §9 schedules it inside P6.
- acceptance: absent
- scope: admin auth, roles, audit log, blocks R-31 and R-70

## REQ-r55-lead-assignment-and-sla
- source: docs/REQUIREMENTS_V2.md R-55 [ADDED]
- status: proposed-not-approved
- description: Auto or manual assignment, "unassigned" and "untouched > 24h" queues, response-time tracking. The client's own promise on the site is "within one business day".
- acceptance: absent
- scope: lead assignment, SLA, CRM

## REQ-r56-tasks-and-follow-up-reminders
- source: docs/REQUIREMENTS_V2.md R-56 [ADDED]
- status: proposed-not-approved
- description: `crm_tasks` with due dates, a Today view and overdue highlighting. A brokerage lives or dies on follow-up.
- acceptance: absent
- scope: CRM tasks, follow-up

## REQ-r57-requirement-inventory-matching
- source: docs/REQUIREMENTS_V2.md R-57 [ADDED]
- status: proposed-not-approved
- description: Given a client's budget, locations and type preferences, list matching available inventory; and in reverse, when a new listing is added, show which clients match it. Named the single highest-value CRM feature for a broker, falling out almost free from the structured CFF data.
- acceptance: absent
- scope: CRM matching, inventory, depends on structured taxonomy

## REQ-r58-duplicate-detection
- source: docs/REQUIREMENTS_V2.md R-58 [ADDED]
- status: proposed-not-approved
- description: Warn when a listing matches an existing one on owner phone, or on project + tower + unit. Dealer-sourced inventory duplicates constantly.
- acceptance: absent
- scope: data quality, duplicate detection, admin

## REQ-r59-inventory-ageing
- source: docs/REQUIREMENTS_V2.md R-59 [ADDED]
- status: proposed-not-approved
- description: Days-on-market per listing and as a report; flag stale listings for re-verification. Stale inventory is named the main credibility risk for a property site.
- acceptance: absent
- scope: reporting, inventory ageing, data quality

## REQ-r60-price-history
- source: docs/REQUIREMENTS_V2.md R-60 [ADDED]
- status: proposed-not-approved
- description: Every demand-price change logged with actor, date and reason; shown as a mini timeline in the admin. Supports negotiation. Backed by `property_price_history`; R-13 references it as a sub-item.
- acceptance: absent
- scope: price history, audit, admin

## REQ-r61-bulk-import-export
- source: docs/REQUIREMENTS_V2.md R-61 [ADDED]
- status: proposed-not-approved
- description: CSV or Excel import for existing inventory (they will have spreadsheets), with a dry-run validation report; export of listings, leads and deals. §11 item 23 asks for the existing spreadsheet, which would define the import format.
- acceptance: absent
- scope: bulk import, export, data migration

## REQ-r62-media-tooling
- source: docs/REQUIREMENTS_V2.md R-62 [ADDED]
- status: proposed-not-approved
- description: Bulk upload, drag reorder, per-image alt text, optional logo watermark on upload, automatic compression budget. R-28 references it as a sub-item.
- acceptance: absent
- scope: media tooling, admin, accessibility

## REQ-r63-soft-delete-archive-restore
- source: docs/REQUIREMENTS_V2.md R-63 [ADDED]
- status: proposed-not-approved
- description: Deleting a property today is irreversible *and* destroys Cloudinary assets. Archive first, purge later, with a restore window.
- acceptance: absent
- scope: data safety, soft delete, Cloudinary

## REQ-r64-global-admin-search-saved-filters
- source: docs/REQUIREMENTS_V2.md R-64 [ADDED]
- status: proposed-not-approved
- description: One search box across properties, projects, builders, clients and deals; saved filter presets per user.
- acceptance: absent
- scope: admin search, usability

## REQ-r65-notifications
- source: docs/REQUIREMENTS_V2.md R-65 [ADDED]
- status: proposed-not-approved
- description: New lead → email and/or WhatsApp to the assigned agent; daily digest of pending follow-ups. "This is what makes the CRM get used." R-32 references it as a sub-item.
- acceptance: absent
- scope: notifications, CRM adoption

## REQ-r66-dealer-partner-registry
- source: docs/REQUIREMENTS_V2.md R-66 [ADDED]
- status: proposed-not-approved
- description: `partners` table linked from `addedBy = dealer`, with contact and commission-share defaults. Feeds R-31's shared commission.
- acceptance: absent
- scope: partners, dealers, commission sharing

## REQ-r67-per-property-seo-and-scheduling
- source: docs/REQUIREMENTS_V2.md R-67 [ADDED]
- status: proposed-not-approved
- description: Meta title, meta description, slug override, OG image; publish-at datetime.
- acceptance: absent
- scope: SEO, scheduled publishing, admin

## REQ-r68-reports
- source: docs/REQUIREMENTS_V2.md R-68 [ADDED]
- status: proposed-not-approved
- description: Pipeline value by stage, source attribution (which channel produced closed deals), agent performance, brokerage earned vs pending, month-over-month listing additions. Source attribution depends on R-81.
- acceptance: absent
- scope: reporting, analytics, CRM

## REQ-r69-deal-documents-and-brokerage-invoice
- source: docs/REQUIREMENTS_V2.md R-69 [ADDED]
- status: proposed-not-approved
- description: Per-stage document checklist (token receipt, agreement, registry) and a generated brokerage invoice/receipt PDF per deal. R-31 references it as a sub-item.
- acceptance: absent
- scope: deal documents, invoicing, CRM

## Group J — Compliance, legal, data protection

## REQ-r70-dpdp-act-2023-handling
- source: docs/REQUIREMENTS_V2.md R-70 [ADDED]
- status: proposed-not-approved — but the source calls it "non-optional once the CRM ships"
- description: Once owner mobile numbers, client phone numbers and lead records are stored this is personal data under India's Digital Personal Data Protection Act, 2023. Needs a purpose/consent notice on every form, purpose limitation, a retention policy, deletion on request, access restricted to named users (R-54) and an audit trail (R-54). Confirm specifics with the client's counsel; §11 item 30 asks who signs off.
- acceptance: absent
- scope: DPDP compliance, PII, consent, depends on R-54

## REQ-r71-rera-advertising-compliance
- source: docs/REQUIREMENTS_V2.md R-71 [ADDED]
- status: proposed-not-approved
- description: Indian real-estate advertising for RERA-registered projects is expected to carry the RERA registration number. Render it on every project and unit that has one, in the footer for the agency registration, and in generated PDFs (R-43). Have the client confirm their own agent registration number (§11 item 10).
- acceptance: absent
- scope: RERA, advertising compliance, footer, PDFs

## REQ-r72-privacy-terms-disclaimer-consent
- source: docs/REQUIREMENTS_V2.md R-72 [ADDED]
- status: proposed-not-approved
- description: None exist today. Required before analytics (R-81) and before collecting personal data at scale. The existing footer disclaimer is a start, not a policy.
- acceptance: absent
- scope: legal pages, cookie consent, blocks R-81

## REQ-r73-data-retention-and-subject-requests
- source: docs/REQUIREMENTS_V2.md R-73 [ADDED]
- status: proposed-not-approved
- description: Retention window per record type, a documented process for deletion requests, and an export path.
- acceptance: absent
- scope: data retention, DPDP, subject requests

## REQ-r74-activity-ticker-honesty-review
- source: docs/REQUIREMENTS_V2.md R-74 [ADDED]
- status: proposed-not-approved — **client decision required**
- description: `SocialProofTicker` currently fabricates visitor activity from random name/event pools and presents it as real. India's CCPA dark-pattern guidance treats fabricated urgency and activity as a consumer-protection risk, and it directly undercuts a brand built on discretion. The source recommends removing it or driving it from real (anonymised) enquiry events, and says explicitly: "Client decision — flag it, do not quietly keep it." §11 item 24 says to raise it directly.
- acceptance: absent
- scope: compliance, dark patterns, brand integrity, live production risk

## Group K — Performance, reliability, scale

## REQ-r75-pagination-and-indexes
- source: docs/REQUIREMENTS_V2.md R-75 [ADDED]
- status: proposed-not-approved
- description: `/properties` currently loads every matching row and every admin list does too. Add pagination (or infinite scroll with a server cursor) and B-tree indexes on every new filter column (`listingStatus`, `city`, `locality`, `propertyType`, `configuration`, `demandPrice`, `projectId`, `towerId`), plus a composite for the common status+city+type query.
- acceptance: absent
- scope: performance, pagination, database indexes

## REQ-r76-search-upgrade
- source: docs/REQUIREMENTS_V2.md R-76 [ADDED]
- status: proposed-not-approved
- description: The current multi-token `ILIKE` scan is fine at tens of rows and degrades badly at thousands. Move to Postgres full-text or `pg_trgm` with an index when the portfolio grows; add locality and ref-code matching.
- acceptance: absent
- scope: search, performance, Postgres

## REQ-r77-distributed-rate-limiting
- source: docs/REQUIREMENTS_V2.md R-77 [ADDED]
- status: proposed-not-approved
- description: `lib/rate-limit.ts` is in-memory per instance and resets on every deploy and scale event. Move to a shared store before any serious traffic or multi-instance deploy.
- acceptance: absent
- scope: rate limiting, security, scalability

## REQ-r78-migrations-backups-restore-drill
- source: docs/REQUIREMENTS_V2.md R-78 [ADDED]
- status: proposed-not-approved
- description: Real SQL migrations (§4.3), automated database backups, and an actually-tested restore. "Once this holds the brokerage's client list and brokerage ledger, losing it is losing the business."
- acceptance: absent
- scope: migrations, backups, disaster recovery

## REQ-r79-error-monitoring-and-alerting
- source: docs/REQUIREMENTS_V2.md R-79 [ADDED]
- status: proposed-not-approved
- description: Errors are `console.error` today. Add centralised error reporting plus alerting on the existing `/api/health`.
- acceptance: absent
- scope: observability, monitoring, alerting

## REQ-r80-image-and-lcp-budget
- source: docs/REQUIREMENTS_V2.md R-80 [ADDED]
- status: proposed-not-approved
- description: The detail page can now carry 20+ images plus video embeds. Enforce lazy-loading below the fold, one eager LCP image, `sizes` accuracy, and a page-weight budget. Keep Core Web Vitals green — a stated success criterion in `PROJECT_OVERVIEW.md`.
- acceptance: absent
- scope: performance, Core Web Vitals, images

## Group L — SEO, analytics, growth

## REQ-r81-analytics-and-event-tracking
- source: docs/REQUIREMENTS_V2.md R-81 [ADDED]
- status: proposed-not-approved
- description: GA4 behind consent (R-72) with events for enquiry submitted, shortlist add, WhatsApp click, phone click, brochure download, site-visit request and filter use. Without this nobody can say which channel produced a deal, and R-68's source attribution depends on it.
- acceptance: absent
- scope: analytics, GA4, event tracking, depends on R-72

## REQ-r82-structured-data-expansion
- source: docs/REQUIREMENTS_V2.md R-82 [ADDED]
- status: proposed-not-approved
- description: Keep the existing `RealEstateListing` JSON-LD; add breadcrumbs, project/builder schema, `FAQPage` on locality pages, and `LocalBusiness` details on contact.
- acceptance: absent
- scope: SEO, JSON-LD, structured data

## REQ-r83-sitemap-and-robots
- source: docs/REQUIREMENTS_V2.md R-83 [ADDED]
- status: proposed-not-approved
- description: Add collections, projects, builders and locality pages; exclude archived/sold; keep `/admin` and `/api` disallowed.
- acceptance: absent
- scope: SEO, sitemap, robots

## REQ-r84-per-property-og-images
- source: docs/REQUIREMENTS_V2.md R-84 [ADDED]
- status: proposed-not-approved
- description: Currently the first gallery image; generate a branded OG card with title, locality and key specs so WhatsApp/Facebook shares look intentional.
- acceptance: absent
- scope: SEO, OG images, sharing

## REQ-r85-local-seo-alignment
- source: docs/REQUIREMENTS_V2.md R-85 [ADDED]
- status: proposed-not-approved
- description: NAP consistency between the site, JSON-LD and their Google Business Profile; embed reviews (R-53).
- acceptance: absent
- scope: local SEO, NAP consistency

## Group M — Accessibility & quality

## REQ-r86-wcag-22-aa-pass
- source: docs/REQUIREMENTS_V2.md R-86 [ADDED]
- status: proposed-not-approved
- description: WCAG 2.2 AA on every new surface — tabs (proper `role="tablist"` semantics or links), the enquiry cart dock, gallery tabs, comparison table, admin forms. Labels, focus order, contrast (gold on cream is the risk area), error announcements.
- acceptance: absent
- scope: accessibility, WCAG 2.2 AA

## REQ-r87-reduced-motion-and-keyboard
- source: docs/REQUIREMENTS_V2.md R-87 [ADDED]
- status: proposed-not-approved
- description: Reduced motion and keyboard support on all new interactive UI, matching the existing `gsap.matchMedia()` / `useReducedMotion()` discipline in `ANIMATION_GUIDELINES.md`.
- acceptance: absent
- scope: accessibility, reduced motion, keyboard

## REQ-r88-runnable-checks
- source: docs/REQUIREMENTS_V2.md R-88 [ADDED]
- status: proposed-not-approved
- description: One assert-based check per non-trivial helper — ref-code generation, brokerage maths, area normalisation and conversion, collection mapping, status→visibility, charge totalling, price-band derivation. No framework, per repo convention.
- acceptance: absent
- scope: testing, runnable checks, ponytail convention

## REQ-r89-empty-loading-error-states
- source: docs/REQUIREMENTS_V2.md R-89 [ADDED]
- status: proposed-not-approved
- description: Every new list, filter combination and CRM view gets a designed empty state with a next action. "No results" with a dead end is named the most common failure of listing sites.
- acceptance: absent
- scope: UX, empty states, error states

## REQ-r90-mobile-qa-matrix
- source: docs/REQUIREMENTS_V2.md R-90 [ADDED]
- status: proposed-not-approved
- description: Buyers are on phones and brokers enter data on phones. Test the full admin property form, the enquiry cart, the comparison view and the filter tabs at 360px before calling anything done.
- acceptance: absent
- scope: mobile QA, testing, admin form
