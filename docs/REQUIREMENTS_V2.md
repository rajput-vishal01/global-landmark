# Requirements V2 — CFF Field Form + Client Update Round (Aug 2026)

**Status:** requirement register + build prompt. Nothing here is built yet.

**Sources:** (1) the client's `CFF 2` field document, (2) the client update list
relayed after the voice notes, (3) requirements added by us that the client's
list implies but does not state — every one of those is tagged **[ADDED]** so
the client-originated scope stays separable at sign-off.

**Read before acting:** [CLAUDE.md](../CLAUDE.md), [TECH_STACK.md](TECH_STACK.md),
[DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md), [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md),
[lib/db/schema.ts](../lib/db/schema.ts), [lib/attributes.ts](../lib/attributes.ts),
[lib/data.ts](../lib/data.ts), [lib/db/queries.ts](../lib/db/queries.ts).

---

## 1. How to use this document

This is the brief handed to the implementing agent. It defines **what must exist
and what must be true when it is done**. It does not pre-write the code — file
layout, component split, query shapes and form ergonomics are the implementer's
call, made against the conventions already in this repo (ponytail ladder, Server
Components by default, Drizzle, Tailwind v4 `@theme` tokens, GSAP for
scroll-driven motion, Framer Motion for state-driven motion).

Rules for the implementing session:

- **Nothing in §2 may be dropped.** Every CFF field must be storable, editable in
  the admin, and either rendered publicly or explicitly marked internal. §10 is
  the coverage checklist — it comes back fully ticked or the work is not done.
- **The public/internal boundary in §4.1 is a hard security rule.** Owner phone
  numbers, brokerage figures, circle rates and legal documents reaching a public
  page or a client bundle is a project-ending defect.
- Where an item says **CONFIRM**, the answer is not known yet. Build the default
  named there, leave a `// ponytail:` comment naming the ceiling, and put the
  question on the client follow-up list (§11).
- Work in the phases in §9. Each phase ends green: `npm run lint && npm run build`,
  plus the leak check in §4.1.
- Existing behaviour not mentioned here stays exactly as it is. Do not redesign
  the landing page, the motion system, or the brand tokens.
- **[ADDED]** items are scoped and buildable but are ours, not theirs — get a yes
  before spending a phase on one.

---

## 2. The requirements, verbatim

### 2.1 Client update list (relayed after the voice notes)

> 1. On the hero page, the text "Sale, Purchase, Lease, Invest" needs to be placed
>    inside boxes so that it is clearly visible.
> 2. Scrolling down, the "850 Crore Plus" figure needs to be changed to a more
>    realistic number, and Indian elements must be added. List three to four
>    properties to improve the site's visibility. Remove the India Gate image.
>    The black-and-white photos are fine but need to be showcased properly.
> 3. At the bottom, their proper office address, phone numbers and social media
>    links should appear.
> 4. In the listings section, create different cardholders: **Kothi (Villa/House),
>    Plot, Projects, Flats, Land, Commercial** (resale is dropped). Categorised
>    like that.
> 5. Inside those, a slightly different design where all details are visible. As
>    soon as they view the property there should be an "add to cart" style button,
>    so adding it instantly generates an inquiry.
> 6. Ask for their office photos tomorrow. Upload the office photos and photos of
>    both Ashu ji and Divya ji.
> 7. For every property listed, a property ID should be generated next to it, like
>    an SQ ID. It should show when it was listed, when it was last updated, and who
>    added it — Global Landmark themselves, a dealer's property, or a direct
>    owner's property. It should also show property status: Available, Reserved,
>    Token, Under Agreement, Sold, Rented, Hold. **All of this goes inside the
>    admin panel and is visible internally only; no one outside sees it.**
> 8. Under property type, include all the variables provided, for flexibility to
>    list whatever is wanted.
> 9. Wherever properties are listed, they have sent location filters. Turn those
>    location filters into **tabs**, so that clicking a location tab auto-selects
>    that location.
> 10. If a project is being added, there should be an option to add builder
>     details — e.g. for "Green Lotus Saksham": the builder, the builder's name,
>     where the builder is from, the project name, RERA number, possession status,
>     launch date, possession date — all categorised under that builder. So a
>     column in the admin panel called **"Builder Linked With Project"**. The
>     benefit: when pitching a project, the builder's details pull straight from
>     the CRM.
> 11. Wherever inventory is added there should be multiple options for area —
>     plot size, built-up area, super area, carpet area, front, depth, PLC, park
>     facing, corner property, etc. All possible additional options.
> 12. Society buildings will have more features than kothis and plots, which are
>     single listings. For towers there can be multiple listings — e.g. 10 flats
>     available within a single building.
> 13. Price details for every inventory should be mentioned, specifying all
>     charges included. Same for the society section — demand price, whether it's
>     negotiable, PLC, club charges, parking charges, etc. All these variables
>     must be included.
> 14. For configuration (1 BHK, 2 BHK, 3, 4, 5, 2+1, 3+1) create clickable tabs so
>     selecting a tab automatically sets the configuration. Pre-built, predefined
>     templates.
> 15. In the legal section, a button to upload documents — **these documents are
>     only visible internally, not to the public**.
> 16. Brokerage: whenever a deal is ongoing it should be updated in the CRM. They
>     need a CRM to manage clients, where they can select from their listed
>     properties and set brokerage percentage, current commission, paid brokerage
>     and pending brokerage, so everything can be tracked.
> 17. A gallery option to upload media — cover photos, interior photos, exterior
>     photos, video links, drone links. All under "Media" in the property listing
>     section, with predefined categories (exterior photos, interior photos, drone
>     links, Google links, etc.).
> 18. Everything from the entire CFF 2 list must be included.
> 19. Follow up first thing in the morning for all the details.

### 2.2 CFF 2 — the field form, reproduced in full

Grouped exactly as the client wrote it. Duplicates in the original (property type
listed twice, "Microwave" twice, "4 plus 1" twice) are de-duplicated; nothing
else is altered or dropped.

**1. Basic Details** — Property ID (auto) · Listing Date · Last Updated ·
Added By (Global Landmark / Dealer / Owner) · Property Status: Available,
Reserved, Token Received, Under Agreement, Sold, Rented, Hold

**2. Property Type** — Residential Plot · Independent House · Villa ·
Flat/Apartment · Penthouse · Builder Floor · Studio Apartment · Farm House ·
SCO · Booth · Shop · Office Space · Showroom · Warehouse · Industrial Plot ·
Industrial Shed · Commercial Plot · Hotel · Hospital · School Site ·
Institutional Plot · Mixed Use Property · R Zone Land · Lease ·
Pre-Leased Property · Investment Property

**3. Location Filters** — Country (India / Dubai / Australia) · City · Locality ·
Sector.
Examples given: Chandigarh, Panchkula, Panchkula Extension, Zirakpur, Mohali,
New Chandigarh, Derabassi, Kharar, Mullanpur, Airport Road, IT City, PR-7 Road,
PR-8, PR-4, Sector Number, GMADA Area, HUDA Area, MC Area.
Then: Sector · Block · Society · Tower · Floor · Unit Number

**4. Builder Details** — Builder Name · Belongs To · Project Name · RERA Number ·
Possession Status · Launch Date · Possession Date · Price Appreciation ·
Old Projects Details

**5. Area** — Plot Size · Built-up Area · Super Area · Carpet Area · Front ·
Depth · PLC · Park Facing · Corner Property · Green Belt Facing · Main Road
Facing · Highway Facing · Lake View · Hill View · Golf Course Facing · Garden
Facing · Number-of-Floors PLC · Number of Floors · Number of Towers ·
Total Units · Green Area.
Units: Sq.Ft · Sq.Yard · Marla · Kanal · Acre · Biswa · Bigha

**6. Price Details** — Demand Price · Negotiable · Circle Rate · Per Sq.Ft Rate ·
Maintenance · PLC · IFMS · Club Charges · Parking Charges · IDC · EDC · GST ·
Registry Charges · Transfer Charges · Other Charges

**7. Configuration** — 1 BHK · 2 BHK · 3 BHK · 4 BHK · 5 BHK · 2+1 · 3+1 · 4+1 ·
3+2 · Duplex · Triplex · Studio · Bedrooms · Bathrooms · Balconies ·
Servant Room · Study Room · Store Room · Pooja Room · Terrace · Roof Rights

**8. Ownership** — Owner Name · Seller Category (Owner / Builder / Investor /
NRI / Bank) · Number of Owners · Mobile · Alternate Mobile · Address ·
Owner Type (Individual / Builder / Investor / NRI)

**9. Furnishing** — Unfurnished · Semi Furnished · Fully Furnished ·
Luxury Furnished.
Inventory items: AC · Beds · Sofa · Dining Table · Wardrobes · Refrigerator ·
Washing Machine · Chimney · RO · Microwave · Curtains · TV · Geyser · Mixer ·
Other

**10. Facing** — North · South · East · West · North-East · North-West ·
South-East · South-West

**11. Possession Status** — Ready to Move · Under Construction · Soft Launch ·
Possession in 6 Months · Possession in 1 Year · Other

**12. Property Age** — New · Less than 1 Year · 1–5 Years · 5–10 Years ·
More than 10 Years

**13. Loan** — Home Loan Available · Bank Approved · Banks on Panel ·
Market Value or Circle Rate · Other

**14. Legal** — RERA Registered · CLU Approved · Registry Available · Freehold ·
Mortgaged

**15. Amenities** — Club House · Swimming Pool · Gym · Lift · Power Backup ·
Security · CCTV · Gated Community · Children's Play Area · Park · Jogging Track ·
Sports Facilities · Community Hall · EV Charging · Smart Home · Wi-Fi ·
Visitor Parking · Theatre · Sauna · Steam · Pickleball Court · Tennis · Cricket ·
Squash · Badminton · Basketball · Salon · Day Care (Kids) · Pet Play Area ·
Intercom · Other

**16. Parking** — Covered Parking · Open Parking · Basement Parking ·
Stilt Parking · Two-Wheeler Parking · Visitor Parking · Number of Parking Slots

**17. Documentation** — Registry Available · Mutation Complete · Sale Deed
Available · Occupancy Certificate · Completion Certificate · Approved Layout
Plan · Electricity Connection · Water Connection · Property Tax Paid ·
NOC Available · 13 Sala · Bharmukt · GPA (if required) · Naksha · LOI/EOI · Other

**18. Brokerage** — Brokerage Percentage · Shared Commission · Brokerage Paid ·
Brokerage Pending

**19. Photos & Media** — Cover Photo · Interior Photos · Exterior Photos ·
Video Link · Drone Video Link · Virtual Tour Link · Google Map · Brochure ·
Floor Plan

**20. Property Specifications** — Facing · Floor Number · Total Floors · Corner ·
Park Facing · Road Width · Entrance Width · Ceiling Height · Possession ·
Age of Property

---

## 3. What already exists (build on this, do not rebuild it)

| Area | Current state | Files |
|---|---|---|
| Framework | Next.js 16.2.10 App Router, React 19.2.4, TypeScript, Tailwind v4 (`@theme` in `app/globals.css`), Prata + Manrope via `next/font/google` | `next.config.ts`, `app/layout.tsx`, `app/globals.css` |
| Public routes | `/`, `/about`, `/properties`, `/properties/[slug]`, `/news`, `/contact` under the `(site)` group | `app/(site)/**` |
| API | `/api/search` (ILIKE, rate-limited), `/api/health`, `/api/ig-thumb/[code]` | `app/api/**` |
| Admin | `/admin` behind an HMAC cookie; `proxy.ts` gate + `(panel)/layout.tsx` cookie check + `requireAdmin()` in every action. CRUD for properties, projects, deals (Deal of the Week), testimonial videos | `app/admin/**`, `lib/admin/*`, `proxy.ts` |
| Data layer | Postgres + Drizzle (`node-postgres` pool). Public reads go through a fail-soft + `unstable_cache` layer tagged `site-data`; admin mutations call `revalidatePublicSite()` | `lib/db/*`, `lib/admin/revalidate.ts` |
| Schema today | `projects`, `properties` (flat, no price by design), `property_images`, `testimonial_videos`, `deals` (Deal of the Week window) | `lib/db/schema.ts` |
| Taxonomy today | `PROPERTY_TYPES` (14), `FACINGS` (8), `POSSESSION_STATUSES` (3), `FURNISHINGS` (4), `AREA_UNITS` (5), `SUGGESTED_AMENITIES` (20) | `lib/attributes.ts` |
| Categories today | `sale · purchase · lease · invest` — hero rotator + `/properties` chips | `lib/categories.ts` |
| Images | Cloudinary signed direct-browser upload; cascade delete removes remote assets before the DB row; `next/image` allowlist = `res.cloudinary.com`, `images.unsplash.com`, mirrored by `IMAGE_HOSTS` in the property action | `lib/cloudinary.ts`, `app/admin/(panel)/properties/actions.ts`, `next.config.ts` |
| Copy/content | Every company-specific string lives in one file | `lib/data.ts` |
| Motion | `lib/gsap.ts` (ScrollTrigger + SplitText, `EASE_HEAVY`), global `ScrollReveals` (`data-reveal` / `data-reveal-img` / `data-unveil` / `data-drift`), Lenis on the GSAP ticker, Framer Motion via `LazyMotion strict` (`m.*` only) | `components/ScrollReveals.tsx`, `components/SmoothScroll.tsx`, `components/MotionProvider.tsx` |
| Leads | Contact form → server action → Gmail (admin mail + confirmation). **Nothing is persisted.** | `app/(site)/contact/actions.ts`, `lib/email.ts` |
| Security | CSP + security headers, in-memory rate limiting, honeypot, JSON-LD escaping, image host allowlist | `next.config.ts`, `lib/rate-limit.ts`, `lib/seo.ts` |

### 3.1 Decisions this round supersedes

| Old decision | Where written | New position |
|---|---|---|
| "No price by design — deals close over calls" | `lib/db/schema.ts`, `CONTENT_MODEL.md`, `PROPERTY_DETAIL.sidebarNote` | **Superseded.** Full price + charges captured (CFF §6). Public display gated by a per-property `showPricePublicly` flag, default `false`. Update the schema comment, the doc, and the sidebar copy. |
| Four categories are the only taxonomy | `lib/categories.ts` | Still true for *intent*. A second, orthogonal **collection** axis is added (Kothi / Plot / Projects / Flats / Land / Commercial), derived from property type — R-04. |
| `properties` is a flat, mostly-public table | `lib/db/schema.ts` | Split: public-safe columns stay; owner, money, legal, status data move to internal-only sibling tables — §4.1. |
| Admin is one shared password | `lib/admin/auth.ts` | Insufficient once brokerage and attribution exist — R-54. |

---

## 4. Cross-cutting architecture decisions

### 4.1 The public / internal boundary — hardest rule in this document

The client is explicit: property ID, dates, added-by, status, ownership,
brokerage and legal documents are **internal only**.

- **Separate tables, not flags.** Internal data lives in tables the public read
  layer never imports: `property_internal`, `property_owners`,
  `property_documents`, `crm_clients`, `crm_deals`, `crm_brokerage`. A public
  query that never references a table cannot leak it.
- **Explicit column allowlists in every public query.** `lib/db/queries.ts` uses
  `db.query.properties.findMany()` today, which returns *all* columns — that
  becomes a leak the moment internal columns land on `properties`. Every public
  query passes an explicit Drizzle `columns: { … }` allowlist. Missing allowlist
  = bug.
- **Two types, enforced.** `PublicProperty` (the only shape any `app/(site)/**`
  component may accept) and `AdminProperty` (full row). Public components must
  not accept the Drizzle row type — leaks become type errors.
- **Documents are never public URLs.** No public Cloudinary folder. Serve through
  an admin-gated route handler that calls `requireAdmin()` and streams the file
  (Cloudinary `type: "authenticated"` + short-TTL signed URL, or a private
  bucket). Never in `sitemap.ts`, JSON-LD, or an `<Image>` src.
- **Status governs publication.** Only `Available` (**CONFIRM**: and possibly
  `Reserved`) renders publicly. `Sold`, `Rented`, `Hold`, `Token Received`,
  `Under Agreement` are admin-only. The list query, the detail route and the
  sitemap all respect this.
- **Mandatory verification each phase:** render a property page, then grep the
  HTML *and* the client JS payload for a known owner phone number, a brokerage
  figure and a circle rate. Zero hits, or the phase is not done.

### 4.2 Schema strategy — columns vs. arrays vs. JSONB

The CFF adds ~150 fields. Do not create 150 columns; do not dump everything in
one JSON blob.

- **Real columns** for anything filtered, sorted, faceted or shown on a card:
  status, type, country/city/locality/sector, configuration, beds/baths, the four
  areas + units, demand price, possession, age, facing, `listedAt`, `updatedAt`,
  `addedBy`, `refCode`, `projectId`, `towerId`, floor, unit.
- **`text[]` arrays** for flat checklists validated against a taxonomy list:
  amenities, parking, PLC attributes, documentation, furnishing inventory, legal
  flags, banks on panel. Mirrors the existing `properties.amenities`; adding an
  option needs no migration.
- **JSONB** only for open-ended admin-authored content: the existing `extras`,
  other-charges breakdown, "Other" free text beside a checklist.
- **Sibling tables** for 1:N or internal data: media, documents, owners,
  brokerage, CRM, tower inventory, price history.
- Every list is defined **once** in `lib/attributes.ts` (or `lib/taxonomy/*.ts` if
  that file passes ~400 lines) and imported by both the admin form and the public
  renderer. Server actions validate against those lists exactly as
  `parseChoice`/`parseAmenities` do today; unknown values are dropped, not saved.

### 4.3 Migrations

- `npm run build` runs `drizzle-kit push` (`scripts/migrate.mjs`) — fine for
  additive change, dangerous for the table split.
- Generate real SQL migrations (`drizzle-kit generate`) for anything that moves
  or drops data; keep `push` for purely additive columns.
- `scripts/seed.mjs` must produce at least one fully-populated example of every
  new entity, so admin and public pages can be exercised without client data.

### 4.4 Caching and revalidation

- Every new public query joins the existing pattern: `unstable_cache` +
  `site-data` tag, wrapped in `failSoft`.
- Every new admin mutation calls `revalidatePublicSite()`.
- **Add every new public route** (collections, project pages, builder pages,
  locality pages) to `lib/admin/revalidate.ts`. A stale collection page after a
  status change is a visible, embarrassing bug.

### 4.5 Admin form ergonomics

The property form goes from ~15 fields to ~150. Do not ship one endless page.

- Section it into the CFF's own groups, each collapsible, header showing a
  filled/total count.
- **Conditional sections**, driven by one map keyed on property type: a
  Residential Plot never asks for balconies; a tower flat must ask for floor and
  unit. This is requirement R-12, not a nicety.
- **Draft state.** A half-entered listing is normal mid-call. `draft` saves
  without publishing; only `published` + `Available` reaches the public site.
- Keep the existing action shape: typed state, validation-first, honest errors,
  `requireAdmin()` first line, `revalidatePublicSite()` last.
- Native inputs only — `<input type="date">`, `<select>`, checkboxes. No date
  picker, form library or state manager. This is a ponytail repo.
- **Autosave drafts** every ~20s to survive a dropped connection mid-entry.

### 4.6 New third-party surfaces need config updates

- Any new image host needs **two** edits or the site 500s at render:
  `images.remotePatterns` in `next.config.ts` **and** `IMAGE_HOSTS` in the
  property server action.
- Google Maps embeds, virtual tours and drone video hosts need explicit
  `frame-src` entries in the CSP (currently only YouTube-nocookie and Instagram).
- Never widen with a wildcard — `/_next/image` becomes an SSRF proxy.

---

## 5. Target data model

Proposed shape. The implementer may restructure, provided every CFF field in §10
has a home and §4.1 holds.

### 5.1 Existing tables — changes

- **`projects`** — add `builderId` FK, `launchDate`, `possessionDate`,
  `possessionStatus`, `priceAppreciation`, `totalTowers`, `totalUnits`,
  `greenArea` + unit, `numberOfFloors`, project-level `amenities text[]`,
  `country/city/locality/sector`, `coverImage`. Keep `reraNumber`.
- **`properties`** — stays the public-safe listing record. Add: `refCode`
  (unique), `publicationState` (`draft|published|archived`), `listingStatus`,
  `addedBy`, `sourceName`, `country`, `city`, `locality`, `sector`, `block`,
  `society`, `towerId`, `floorNumber`, `totalFloors`, `unitNumber`, area quartet
  each with its own unit, `frontFeet`, `depthFeet`, `plcAttributes text[]`,
  `configuration`, `beds`, `baths`, `balconies`, `roomFlags text[]`, `facing`,
  `possessionStatus`, `propertyAge`, `furnishing`, `furnishingInventory text[]`,
  `amenities text[]`, `parkingTypes text[]`, `parkingSlots`, `roadWidth`,
  `entranceWidth`, `ceilingHeight`, `isCorner`, `isParkFacing`,
  `legalFlags text[]`, `documentationFlags text[]`, `loanFlags text[]`,
  `banksOnPanel text[]`, `demandPrice`, `perSqftRate`, `isNegotiable`,
  `showPricePublicly` (default false), plus existing `extras jsonb`.
- **`property_images`** — add `mediaKind` (`cover|interior|exterior|floor_plan|
  other`); exactly one `cover` per property, enforced in the action.
- **`deals`** — unchanged (Deal of the Week). **Do not reuse this name for the
  CRM.** The collision is a real trap.

### 5.2 New tables

| Table | Visibility | Key columns |
|---|---|---|
| `builders` | name public, contacts internal | `name` (unique), `belongsTo`, `about`, `website`, `logoUrl`, `contactName`, `contactPhone`, `pastProjects` |
| `towers` | public | `projectId`, `name`, `totalFloors`, `unitsPerFloor`, `totalUnits`, `notes` |
| `property_media` | public links | `propertyId`, `kind` (video / drone / virtual_tour / google_map / brochure), `url`, `label`, `sortOrder` |
| `property_documents` | **internal** | `propertyId`, `docType`, `storageKey`, `fileName`, `mimeType`, `sizeBytes`, `uploadedAt`, `uploadedBy` |
| `property_owners` | **internal** | `propertyId`, `name`, `sellerCategory`, `ownerType`, `ownerCount`, `mobile`, `altMobile`, `address`, `notes` |
| `property_charges` | internal, selectively public | `propertyId`, `chargeType`, `amount`, `basis` (lump_sum / per_sqft / percent), `isIncludedInDemand`, `publicVisible` |
| `property_internal` | **internal** | 1:1: `circleRate`, `marketValueNote`, `internalNotes`, `nextFollowUpAt` |
| `property_price_history` | **internal** | `propertyId`, `demandPrice`, `changedAt`, `changedBy`, `reason` — R-60 |
| `leads` | **internal** | `name`, `email`, `phone`, `interest`, `message`, `propertyIds int[]`, `pageUrl`, `source`, `status`, `assignedTo`, `createdAt` |
| `crm_clients` | **internal** | `name`, `phone`, `altPhone`, `email`, `type`, `source`, `requirementNotes`, `budgetMin/Max`, `preferredLocations text[]`, `preferredTypes text[]`, `assignedTo` |
| `crm_deals` | **internal** | `clientId`, `propertyId`, `stage`, `dealValue`, `brokeragePercent`, `brokerageAmount`, `sharedCommission`, `brokeragePaid`, `expectedCloseDate`, `closedAt`, `lostReason` |
| `crm_activities` | **internal** | `dealId`/`clientId`, `kind` (call/visit/note/whatsapp/email), `body`, `occurredAt`, `by` |
| `crm_tasks` | **internal** | `assignedTo`, `dueAt`, `subject`, `relatedTo`, `doneAt` — R-56 |
| `admin_users` | **internal** | `name`, `email`, `passwordHash`, `role` (owner/manager/agent), `isActive` — R-54 |
| `audit_log` | **internal** | `actorId`, `action`, `entity`, `entityId`, `before/after jsonb`, `at` — R-54 |
| `partners` | **internal** | Dealer/channel-partner registry: `name`, `firm`, `phone`, `city`, `notes` — R-66 |
| `site_settings` | admin-edited, public output | key/value overrides for contact details, stats, hero copy — R-36 |
| `saved_searches` | **internal** | `phone`, `filtersJson`, `channel`, `createdAt` — R-49 |

### 5.3 Derived, never stored

- `brokeragePending = brokerageAmount − brokeragePaid`.
- Collection group (Kothi / Plot / Projects / Flats / Land / Commercial) — mapped
  from `propertyType` + `kind`. No column.
- Days-on-market = `now − listedAt` for non-closed listings.

---

## 6. Requirement register — client-originated

Format per item: **Need** (what they asked for, in one line) · **Build**
(complete spec, bullets) · **Done when** (acceptance).

### Group A — Public site & brand

---

#### R-01 · Hero category boxes
**Need:** the four hero words get lost over photography; put them in visible boxes.

**Build**
- Wrap each of Sale / Purchase / Lease / Invest in a bordered box: translucent
  dark fill, hairline `border-gold/40`, `backdrop-blur-sm`.
- Active state: brighter fill + solid gold hairline; inactive: muted cream text.
- Keep them as links to `/properties?category=…`; keep hover-to-switch-slide;
  keep the `.hero-cats` step in the GSAP intro timeline.
- Must not wrap awkwardly at 360px — allow a 2×2 grid on narrow screens.
- Visible keyboard focus ring on the box, not just the label.

**Done when**
- All four are legible over all four slide images at 360 / 768 / 1440px.
- Reduced-motion path unchanged; keyboard focus visible; links still work.

---

#### R-02 · Realistic credibility numbers, Indian framing
**Need:** ₹850 Cr is not credible; use real numbers and Indian context.

**Build**
- Replace `CREDIBILITY` figures in `lib/data.ts` with the client's real numbers
  (**CONFIRM** — §11). Until they arrive, use defensible placeholders with a
  `// ponytail:` comment naming the source of truth.
- Format every figure in the Indian system — Lakh / Crore, `toLocaleString("en-IN")`
  digit grouping. One shared formatter, not per-component logic.
- "Indian elements" = name real micro-markets (Panchkula Extension, Zirakpur,
  Mohali, New Chandigarh, Derabassi, Kharar, Mullanpur, PR-7), reference
  RERA / GMADA / HUDA where factually true.
- Do not invent awards, press mentions or transaction volumes. The `PRESS` list
  in `lib/data.ts` currently names six national mastheads — remove any the client
  cannot evidence.

**Done when**
- No figure on the page is unattributable to something the client supplied.
- All currency renders in the Indian system, everywhere, including emails.

---

#### R-03 · Imagery pass
**Need:** drop the India Gate stock shot; showcase their black-and-white photos properly.

**Build**
- Remove `ARCH_REVEAL` India Gate image; replace with a real Tricity project shot.
- Replace every remaining Unsplash URL in `lib/data.ts` and `scripts/seed.mjs`
  once client photos land.
- Treat the B&W set as a deliberate editorial series: full-bleed or large 4:5
  crops, generous whitespace, no shrunken thumbnails, no colour-tinted overlay
  fighting the monochrome, no mixing B&W and colour inside one grid.
- Keep existing motion (`data-reveal-img`, `ArchReveal`); only sources and crops
  change.
- Art-direct mobile vs desktop crops for hero-scale images.

**Done when**
- Zero Unsplash URLs remain in shipped code; every landing-page image is theirs.

---

#### R-04 · Listing collections ("cardholders")
**Need:** Kothi (Villa/House), Plot, Projects, Flats, Land, Commercial as browsable categories.

**Build**
- Add a **collection** axis, orthogonal to sale/purchase/lease/invest, derived
  from `propertyType` (+ `kind === "project"` for Projects) via one map. No new
  column, no re-tagging.
- Mapping (adjust with client): Kothi ← Independent House, Villa, Farm House ·
  Plot ← Residential Plot · Land ← R Zone Land, Industrial Plot, agricultural ·
  Flats ← Flat/Apartment, Builder Floor, Penthouse, Studio · Commercial ← SCO,
  Booth, Shop, Office, Showroom, Warehouse, Industrial Shed, Hotel, Hospital,
  School Site, Institutional, Mixed Use · Projects ← any `kind = project`.
- Surface twice: (a) a six-card grid at the top of `/properties` — image, name,
  live count; (b) a persistent tab row on the filtered view.
- `?group=` composes with `?category=`, `?city=`, `?type=` etc. — all
  server-filtered, all shareable, all back-button correct.
- Each collection card uses a representative photo from that collection, not a
  stock icon.

**Done when**
- Six collections render with correct live counts, compose with every other
  filter, survive refresh, and are reachable from header and menu.

---

#### R-05 · Card redesign + "add to enquiry" cart
**Need:** show all the details on the card; an add-to-cart button that instantly generates an enquiry.

**Build — card**
- Show: collection badge, configuration, primary area + unit, possession status,
  locality/sector, project/society name, PLC highlights (corner, park facing),
  price *or* "Price on request".
- Keep 4:5 crop, hover zoom cap 1.05, and the existing reveal batch behaviour.
- **CONFIRM** whether a public reference code appears on the card (default: no,
  per R-07).

**Build — enquiry cart**
- "Add to enquiry" button on card and detail page; toggles to "Added ✓".
- Shortlist persists in `localStorage` (no accounts — auth is out of scope).
- Floating dock shows the count, opens a panel listing shortlisted properties
  with thumbnails and remove buttons.
- One submit sends **one** enquiry containing all shortlisted properties: reuse
  `ContactForm` + `submitInquiry`, extend the payload with `propertyIds`.
- Persist a `leads` row (R-32) *before* sending mail, then send the existing
  branded admin + confirmation emails, now listing each property with ref code.
- "Instantly generates an inquiry" = adding one property opens the panel with a
  one-tap send; it must never send silently without a name and phone.
- Keep honeypot + rate limit; cap the shortlist (e.g. 20) to stop abuse.
- Empty state, removed-item undo, and a "clear all".

**Done when**
- Shortlist survives navigation and reload; the email lists every property with
  ref code; a `leads` row appears in the admin; spam protections still fire.

---

#### R-06 · Footer / contact truth
**Need:** real office address, phone numbers and social links at the bottom.

**Build**
- Update `COMPANY` in `lib/data.ts`: full office address (currently "Based in
  Panchkula"), both phones verified, real inbox (currently placeholder
  `inquiries@globallandmark.com`), real socials — X, LinkedIn, YouTube are `"#"`
  today and are silently filtered out of the footer.
- Add Facebook if they have one; the icon already exists in `Footer.tsx`.
- Feed the same data into `organizationJsonLd()` (`lib/seo.ts`) and the email
  templates (`lib/email.ts`).
- Add office hours and a Google Maps link/embed (needs the CSP `frame-src` update).
- Append the RERA registration number to the licence line.

**Done when**
- Footer, fullscreen menu, contact page, JSON-LD and transactional emails all
  show identical real details; no `#` links remain anywhere.

---

#### R-07 · Reference ID, dates, source, status — internal only
**Need:** an SQ-style property ID with listing date, last updated, who added it, and status — admin-only.

**Build**
- Ref code format `GL-<CITY>-<YY>-<seq>` (e.g. `GL-PKL-26-0142`), generated once
  on insert, unique, never reused after delete.
- Admin list and detail show: ref code, `listedAt`, `updatedAt`, `addedBy`
  (Global Landmark / Dealer / Owner) with `sourceName`, and `listingStatus`.
- Status values exactly as given: Available · Reserved · Token Received ·
  Under Agreement · Sold · Rented · Hold, each with a colour badge.
- Status controls public visibility (§4.1); changing status revalidates the
  public pages immediately.
- Status filter tabs + a legend on the admin list.
- **[ADDED]** log every status change to `audit_log` with actor and timestamp —
  "who marked this sold" is the first question asked when something goes wrong.

**Done when**
- Every property has a unique ref code; status changes flip public visibility
  within one revalidation; none of these five fields appear in public HTML/JSON.

---

#### R-08 · Location filters as tabs
**Need:** their location list becomes tabs; clicking one auto-selects that location.

**Build**
- Model the hierarchy: Country (India / Dubai / Australia) → City → Locality →
  Sector/Block, seeded with their named list (Chandigarh, Panchkula, Panchkula
  Extension, Zirakpur, Mohali, New Chandigarh, Derabassi, Kharar, Mullanpur,
  Airport Road, IT City, PR-7 Road, PR-8, PR-4) plus GMADA / HUDA / MC area
  classification.
- Keep it as a typed taxonomy in `lib/locations.ts` unless they need to add
  localities themselves (**CONFIRM** → then promote to a `locations` table with
  admin CRUD).
- `/properties`: city tab row; clicking sets `?city=` and auto-selects.
  Locality and sector become dependent selects that narrow with the city.
- URL is the state — server-filtered, shareable, back-button correct.
- Admin entry uses the same taxonomy, so filters and data cannot drift.
- Tabs scroll horizontally on mobile with edge fades; show counts per city.
- Empty cities either hide or show an explicit empty state with a CTA.

**Done when**
- Clicking a city filters instantly; deep links restore the exact tab state;
  admin and public share one location vocabulary.

---

#### R-09 · Configuration tabs / predefined templates
**Need:** 1/2/3/4/5 BHK, 2+1, 3+1 etc. as clickable tabs that auto-set the configuration.

**Build**
- Replace free-text `configuration` with a fixed list: 1–5 BHK, 2+1, 3+1, 4+1,
  3+2, Duplex, Triplex, Studio.
- Admin: tabs; selecting one pre-fills bedrooms / bathrooms / balconies from a
  predefined template, still hand-editable afterwards.
- Public: the same list as filter tabs on `/properties`.
- Migrate existing free-text values to the closest list entry; keep a free-text
  fallback for anything unmatched.

**Done when**
- Selecting "3+1" fills room counts; one list drives admin and public; no
  existing listing loses its configuration in migration.

---

### Group B — Property data model (the CFF)

---

#### R-10 · Full property-type list
**Need:** every type in the CFF must be selectable.

**Build**
- Extend `PROPERTY_TYPES` from 14 to the full list (§2.2 group 2).
- **Lease, Pre-Leased Property and Investment Property are not building types** —
  they are intent/deal attributes. Map: `Lease` → existing `lease` category;
  `Pre-Leased` and `Investment` → flags in a `dealAttributes text[]` that combine
  with any physical type.
- Write the mapping decision into the taxonomy file as a comment, and raise it on
  the call rather than silently modelling "Investment Property" as a building.

**Done when**
- All 26 entries are reachable somewhere sensible; the mapping is documented.

---

#### R-11 · Area block, all measures and units
**Need:** plot size, built-up, super, carpet, front, depth, PLC and every unit.

**Build**
- Four independent area values, **each with its own unit**.
- Front and Depth (running feet).
- PLC checklist: Park Facing · Corner · Green Belt · Main Road · Highway ·
  Lake View · Hill View · Golf Course · Garden · floor-based PLC.
- Extend `AREA_UNITS` with **Biswa** and **Bigha** (missing today); keep
  `formatArea()` as the only renderer.
- Project/tower level: Number of Floors, Number of Towers, Total Units, Green Area.
- One helper picks the *most meaningful* area per type (plot size for plots,
  super/carpet for flats) for cards and search results — not per-page logic.
- **[ADDED]** store a normalised `areaSqft` alongside the entered value so
  filtering and sorting across mixed units actually works.

**Done when**
- All seven units render with Indian digit grouping; a plot listing never shows
  an empty "Carpet Area" row; area sorting works across mixed units.

---

#### R-12 · Society / tower inventory vs. single listings
**Need:** kothis and plots are single listings; a tower can hold ten available flats.

**Build**
- Hierarchy: Builder → Project → Tower → Unit.
- `towers` table; units link by `towerId` + `floorNumber` + `unitNumber`.
- "Duplicate unit" action clones shared fields so adding the 2nd–10th flat in a
  tower takes only floor, unit, area, price, status.
- Conditional form sections by type (§4.5) — societies get amenities, tower,
  floor, maintenance; plots get front/depth/PLC; kothis get plot + built-up.
- Public project page groups available units by tower in a compact inventory
  table (config · area · floor · price/on-request · status).
- **[ADDED]** unit-level availability rolls up to a project-level "X units
  available" badge that updates when a unit is marked sold.

**Done when**
- Adding a second unit to a tower takes under 10 fields; the project page shows
  live availability grouped by tower.

---

#### R-13 · Price and all charges
**Need:** demand price plus every charge, for units and societies.

**Build**
- Capture: Demand Price, Negotiable, Circle Rate (**internal only**), Per Sq.Ft
  Rate, plus Maintenance, PLC, IFMS, Club, Parking, IDC, EDC, GST, Registry,
  Transfer, Other.
- Each charge records amount + basis (lump sum / per sq.ft / percent) + whether
  it is already included in the demand price.
- Admin shows a computed **all-in** figure and a per-sq.ft derived rate.
- Public display gated by `showPricePublicly`, default off ⇒ "Price on request",
  preserving current brand copy.
- **[ADDED]** price bands for public filtering even when exact price is hidden
  (e.g. ₹1–2 Cr) — buyers filter by budget, and this keeps that possible without
  publishing the number.
- **[ADDED]** every price edit writes a `property_price_history` row (R-60).

**Done when**
- Admin all-in total is correct; public shows a formatted Indian price or "Price
  on request"; circle rate appears nowhere public.

---

#### R-14 · Configuration & rooms
**Need:** room detail beyond the BHK label.

**Build**
- Bedrooms, Bathrooms, Balconies as counts.
- Room flags checklist: Servant Room · Study · Store · Pooja Room · Terrace ·
  Roof Rights.
- Fed by the R-09 template but individually editable.

**Done when**
- A 3+1 listing shows 3 bedrooms + servant room without double-entry.

---

#### R-15 · Ownership block — internal only
**Need:** owner and seller contact details, kept private.

**Build**
- `property_owners`: Owner Name, Seller Category (Owner / Builder / Investor /
  NRI / Bank), Number of Owners, Owner Type, Mobile, Alternate Mobile, Address,
  notes.
- Support **multiple owners** per property — joint ownership is the norm.
- Click-to-call and click-to-WhatsApp from the admin row.
- Phone numbers must never reach a public component. This is the most sensitive
  field group on the site.
- **[ADDED]** duplicate detection on owner phone: warn if the same number already
  has a listing (R-58).

**Done when**
- Owner data is editable in admin, appears in no public query, and the §4.1 leak
  grep is clean.

---

#### R-16 · Furnishing + inventory checklist
**Need:** furnishing level plus what's actually included.

**Build**
- Levels: Unfurnished · Semi · Fully · Luxury Furnished.
- Item checklist: AC · Beds · Sofa · Dining Table · Wardrobes · Refrigerator ·
  Washing Machine · Chimney · RO · Microwave · Curtains · TV · Geyser · Mixer ·
  Other (+ free text).
- **CONFIRM** whether per-item counts matter ("AC ×3"); default is presence only.
- Public renders the list only for furnished listings.

**Done when**
- Checklist round-trips and renders cleanly on the detail page.

---

#### R-17 · Facing
**Need:** all eight compass options.
**Build:** verify South-West is present (the CFF text truncates as "Sout"); keep
`FACINGS` as the single source; expose as a public filter (Vastu matters here).

---

#### R-18 · Possession status
**Need:** more than the current three options.
**Build:** Ready to Move · Under Construction · Soft Launch · Possession in 6
Months · Possession in 1 Year · Other. Keep New Launch if still used (**CONFIRM**).
Public filter + card badge.

---

#### R-19 · Property age
**Need:** how old the property is.
**Build:** New · <1 Year · 1–5 · 5–10 · >10 Years. **CONFIRM** whether to store a
construction year and derive the band instead (better long-term; default is the
band as given).

---

#### R-20 · Loan block
**Need:** financing information buyers ask for.

**Build**
- Home Loan Available · Bank Approved · Banks on Panel (multi-select, free-add) ·
  Market Value vs Circle Rate note (**internal**) · Other.
- Public shows "Home loan available · Bank approved · Panel: HDFC, SBI…" as a
  selling point; the circle-rate comparison stays internal.
- **[ADDED]** feeds the EMI calculator (R-41).

---

#### R-21 · Legal block
**Need:** legal standing of the property.

**Build**
- RERA Registered (+ number) · CLU Approved · Registry Available · Freehold —
  **public** (RERA number is expected in Indian property advertising).
- **Mortgaged — internal only.**
- Public renders as a compact "Legal status" strip, not buried in a table.

---

#### R-22 · Amenities
**Need:** the full amenity list, society-grade.

**Build**
- Grow `SUGGESTED_AMENITIES` to all 31 CFF entries (incl. Theatre, Sauna, Steam,
  Pickleball, Tennis, Cricket, Squash, Badminton, Basketball, Salon, Kids' Day
  Care, Pet Play Area, Intercom, Other).
- Keep the existing free-typed-amenity behaviour.
- **Split project-level amenities from unit-level ones** — a flat inherits its
  society's club/pool/gym instead of re-entering them.
- Group by theme (Recreation · Safety · Convenience · Sport) with icons on the
  public page.

**Done when**
- A unit shows its own + its project's amenities, de-duplicated, grouped.

---

#### R-23 · Parking
**Need:** parking types and count.
**Build:** Covered · Open · Basement · Stilt · Two-Wheeler · Visitor + number of
slots. Public card shows slot count for units where it matters.

---

#### R-24 · Documentation checklist
**Need:** the paperwork status of each property.

**Build**
- Registry · Mutation · Sale Deed · OC · CC · Approved Layout Plan · Electricity ·
  Water · Property Tax Paid · NOC · 13 Sala · Bharmukt · GPA (if required) ·
  Naksha · LOI/EOI · Other.
- **Internal by default.**
- **CONFIRM:** offer a trimmed public version ("Registry available · OC received")
  — it is a genuine trust signal and costs nothing to render.
- Each checklist item can carry an uploaded file (R-29) and a note.

---

#### R-25 · Property specifications
**Need:** the physical specifics.
**Build:** Floor Number · Total Floors · Corner · Park Facing · Road Width ·
Entrance Width · Ceiling Height (plus Facing / Possession / Age from above).
Render as a two-column spec table on the detail page.

---

### Group C — Builder, project, and the pitch

---

#### R-26 · Builders as first-class records ("Builder Linked With Project")
**Need:** a builder column linked to projects, so a pitch pulls builder details straight from the CRM.

**Build**
- `builders` table + admin CRUD; builder selector on the project form — literally
  the "Builder Linked With Project" column requested.
- Builder fields: Name, Belongs To (city/region), about, website, logo, internal
  contact, past/old projects, price-appreciation track record.
- Project gains: RERA Number (exists), Possession Status, Launch Date, Possession
  Date, Price Appreciation notes.
- **Pitch view** (the payoff they named): an admin project page showing builder
  profile, RERA, dates, appreciation history, and *every other project by the
  same builder*, on one screen.
- **[ADDED]** one-tap "share pitch" that generates a clean PDF/WhatsApp summary
  of the project + builder (R-43).
- **CONFIRM:** a public "Developed by …" line and builder page (R-47).

**Done when**
- Creating "Green Lotus Saksham" and selecting builder "Green Lotus" shows all
  builder details and lists their other projects in one place.

---

#### R-27 · Project public pages
**Need:** societies deserve their own page, not just unit cards.

**Build**
- `/projects/[slug]`: hero, builder line, RERA number, possession status + dates,
  project amenities, tower/unit availability (R-12), gallery, location map,
  enquiry CTA, brochure download.
- Add to `sitemap.ts`, `revalidatePublicSite()`, and the search index.
- JSON-LD as an appropriate schema.org type with the RERA identifier.

---

### Group D — Media and documents

---

#### R-28 · Media gallery with predefined categories
**Need:** cover, interior, exterior photos plus video, drone and map links, under one "Media" section.

**Build**
- File media: Cover Photo (exactly one, enforced), Interior Photos, Exterior
  Photos, Floor Plan — all through the existing signed direct-to-Cloudinary path
  with the cascade-delete guarantee.
- Link media: Video Link, Drone Video Link, Virtual Tour Link, Google Map,
  Brochure — validated and stored in `property_media`.
- Embedding any link requires the CSP `frame-src` update (§4.6); unvalidated URLs
  must never reach an iframe.
- Public detail page: gallery tabbed by category (Interior / Exterior / Floor
  Plan) with a media strip for video / drone / tour.
- **[ADDED]** drag-to-reorder, bulk upload, per-image alt text (SEO +
  accessibility), and optional logo watermarking on upload (R-62).

**Done when**
- A property carries cover + interior set + exterior set + floor plan + four link
  types; delete still removes every remote asset first.

---

#### R-29 · Legal document vault — internal
**Need:** upload documents in the legal section; visible internally only.

**Build**
- Upload button per documentation item; PDFs and images.
- Private storage (§4.1) — never the public Cloudinary folder.
- Serving goes through an admin-gated route that calls `requireAdmin()` and
  streams with `Content-Disposition: attachment`.
- MIME allowlist + size cap + virus-scan consideration; delete remote object
  before the DB row, matching the image rule.
- Show uploader and timestamp; log downloads to `audit_log`.

**Done when**
- An unauthenticated request for a document gets 401/404 with no redirect leak;
  documents appear in no sitemap, JSON-LD or public bundle.

---

### Group E — Enquiry, leads & conversion

---

#### R-32 · Lead persistence
**Need:** implied by the CRM — enquiries must be records, not just emails.

**Build**
- Every enquiry (contact page, WhatsApp modal, property page, enquiry cart,
  site-visit request) writes a `leads` row **and** sends the existing emails.
- Persist first, then send — an SMTP failure must never lose a lead.
- Capture source, page URL, shortlisted property IDs, UTM parameters.
- Admin inbox: unread counts, status (new / contacted / converted / dropped),
  assignment, one-click convert to `crm_client`, CSV export.
- **[ADDED]** instant notification to the assigned agent (R-65).

**Done when**
- Killing SMTP still leaves a complete record of every enquiry.

---

### Group F — CRM, brokerage & operations

---

#### R-30 · CRM core
**Need:** manage clients, pick from their listed properties, track the deal.

**Build**
- `/admin/crm` with: client list + search, client detail (requirement notes,
  budget, preferred locations/types, activity timeline), deal pipeline by stage.
- Stages: Enquiry → Site Visit → Negotiation → Token → Agreement → Registry →
  Closed / Lost (**CONFIRM** the exact ladder).
- A deal links one client to one property (**CONFIRM**: multiple properties per
  deal; default is one property, many deals per client).
- Website leads convert in one click, carrying shortlisted property IDs.
- Activity timeline: call, site visit, note, WhatsApp, email — with timestamps
  and author.
- **[ADDED]** requirement↔inventory matching (R-57) and follow-up tasks (R-56).

**Done when**
- A website enquiry can become a client, a deal and a closed transaction without
  leaving the admin.

---

#### R-31 · Brokerage tracking
**Need:** brokerage percentage, current commission, paid and pending, tracked per deal.

**Build**
- Per deal: Deal Value, Brokerage %, Brokerage Amount (computed, overridable),
  Shared Commission (with whom, how much), Brokerage Paid, Brokerage Pending
  (computed, never stored).
- Payment entries with date and mode, so partial receipts add up.
- Summary view: total pending, this month's closed value, per-stage counts,
  per-agent split.
- All figures **internal only**.
- **[ADDED]** a simple brokerage invoice / receipt PDF per deal (R-69).
- Depends on named people → R-54.

**Done when**
- 2% on a ₹1.2 Cr deal with ₹1 L received shows the correct pending figure
  everywhere; no brokerage number appears in any public payload.

---

### Group G — Admin panel

---

#### R-33 · Navigation and information architecture
**Need:** the panel must hold a real CRM, not four CRUD pages.

**Build**
- Nav: Dashboard · Properties · Projects · Builders · Towers/Inventory · Leads ·
  CRM (Clients · Deals · Brokerage) · Deal of the Week · Testimonials · Media ·
  Settings · Users.
- Keep the utilitarian styling — the admin is a tool. No scroll animation, no
  Lenis, no GSAP.
- Mobile-usable: brokers add listings from their phone at a site visit.

---

#### R-34 · Property list usability at scale
**Need:** implied — the current plain table dies at a few hundred listings.

**Build**
- Search by ref code, title, locality, project, owner name, owner phone.
- Filters: status, publication state, type, collection, city, project, added-by,
  agent.
- Sorting (newest, oldest, recently updated, days-on-market) + pagination.
- Row shows ref code, cover thumbnail, status badge, city, last-updated, agent.
- Bulk status change and bulk export (**CONFIRM**).

---

#### R-35 · Dashboard
**Need:** implied — three counters do not run a brokerage.

**Build**
- Active listings by status; new leads today / this week; deals by stage;
  brokerage pending; listings not updated in 30+ days; live Deal of the Week;
  today's follow-up tasks.
- Every tile links to its filtered list.

---

#### R-36 · Settings page
**Need:** implied by R-02/R-06 — contact details and stats should not need a code deploy.

**Build**
- Admin-editable: office address, phones, WhatsApp number, email, social links,
  credibility stats, hero copy, office hours.
- `site_settings` overrides; `lib/data.ts` remains the fallback default — extend
  the "one file holds every company string" property, do not break it.
- **CONFIRM** how much they want to self-serve; minimum is contact details +
  stats.

---

## 7. Additional requirements — proposed by us **[ADDED]**

Everything in this section is ours, not the client's. Each is scoped to be
independently droppable. Get a yes before building.

### Group H — Public-facing features that convert

- **R-39 · Property comparison** — select 2–4 properties, compare
  configuration, area, price, possession, amenities, location side by side.
  Shares state with the enquiry cart. High-intent buyers do this in a spreadsheet
  today.
- **R-40 · Area unit converter** — inline converter across Sq.Ft / Sq.Yard /
  Marla / Kanal / Acre / Biswa / Bigha. In this market buyers think in marla and
  developers quote in sq.ft; the conversion is the single most common friction in
  a Tricity property conversation. Cheap to build, disproportionately useful.
- **R-41 · EMI / loan calculator** — on the detail page, seeded from demand price
  and the loan block (R-20). Amount, rate, tenure → monthly EMI. Client-side only.
- **R-42 · Site-visit booking** — "Book a site visit" with preferred date and
  time-slot; writes a lead + a `crm_task` for the assigned agent; confirmation to
  the visitor by email/WhatsApp.
- **R-43 · Property / project sheet PDF** — server-generated one-page sheet with
  cover photo, ref code, specs, agent contact and QR to the listing. This is what
  brokers actually send on WhatsApp; also powers the R-26 pitch view.
- **R-44 · WhatsApp share** — share a property or a whole shortlist as a
  pre-composed WhatsApp message with title, locality, key specs and the link.
- **R-45 · Recently viewed + smarter similar** — "recently viewed" strip from
  `localStorage`; upgrade "Also Represented" from same-category to
  same-locality + similar-configuration + similar-budget.
- **R-46 · Locality landing pages** — `/properties/[city]/[locality]` style pages
  ("3 BHK flats in Zirakpur") generated from the location taxonomy, with an
  intro, live listings and local context. This is the highest-leverage organic
  search play available to a regional brokerage.
- **R-47 · Builder public profiles** — `/builders/[slug]` with profile, RERA
  history, current and past projects. Buyers search builder names constantly.
- **R-48 · NRI corner** — the CFF already has NRI as a seller category and lists
  Dubai and Australia as countries. A dedicated NRI section (remote buying
  process, documentation, POA, repatriation, time-zone-aware callbacks) matches a
  segment they already serve.
- **R-49 · Saved search + alerts** — visitor saves a filter set with their phone
  number; new matching inventory triggers a WhatsApp/email alert. No accounts
  needed. Turns a one-time visit into a pipeline.
- **R-50 · Sell / list-with-us funnel** — dedicated seller page with a valuation
  request form (property type, location, area, expectation) writing a lead tagged
  `seller`. Already on the site roadmap in `SITE_ARCHITECTURE.md`; the CRM makes
  it worth building now.
- **R-51 · Journal / market insights** — market reports and locality guides.
  Feeds R-46, feeds credibility, feeds the newsletter. Roadmap item.
- **R-52 · Careers / associate onboarding** — brokerages recruit continuously;
  a simple form writing to `leads` with type `career`.
- **R-53 · Reviews & social proof, honest version** — Google review embed or
  quoted reviews with attribution, replacing/supplementing the fabricated
  activity ticker (see R-74).

### Group I — Admin & operations depth

- **R-54 · Named admin users, roles, audit log** — `admin_users` with roles
  (owner / manager / agent), per-user login replacing the single shared password,
  and an `audit_log` of every create/update/delete/status change/document access.
  **Required** for R-31 attribution and for any dispute about who changed what.
  Keep the HMAC cookie mechanism; add identity to it.
- **R-55 · Lead assignment & SLA** — auto or manual assignment, "unassigned" and
  "untouched > 24h" queues, response-time tracking. The client's own promise on
  the site is "within one business day".
- **R-56 · Tasks & follow-up reminders** — `crm_tasks` with due dates, a Today
  view, and overdue highlighting. A brokerage lives or dies on follow-up.
- **R-57 · Requirement ↔ inventory matching** — given a client's budget,
  locations and type preferences, list matching available inventory; and in
  reverse, when a new listing is added, show which clients match it. This is the
  single highest-value CRM feature for a broker and falls out almost free from
  the structured data the CFF already demands.
- **R-58 · Duplicate detection** — warn when a listing matches an existing one on
  owner phone, or on project + tower + unit. Dealer-sourced inventory duplicates
  constantly.
- **R-59 · Inventory ageing / days-on-market** — per listing and as a report;
  flag stale listings for re-verification. Stale inventory is the main credibility
  risk for a property site.
- **R-60 · Price history** — every demand-price change logged with actor, date
  and reason; shown as a mini timeline in the admin. Supports negotiation.
- **R-61 · Bulk import / export** — CSV or Excel import for existing inventory
  (they will have spreadsheets), with a dry-run validation report; export of
  listings, leads and deals.
- **R-62 · Media tooling** — bulk upload, drag reorder, per-image alt text,
  optional logo watermark on upload, automatic compression budget.
- **R-63 · Soft delete / archive / restore** — deleting a property today is
  irreversible *and* destroys Cloudinary assets. Archive first, purge later,
  with a restore window.
- **R-64 · Global admin search + saved filters** — one search box across
  properties, projects, builders, clients, deals; saved filter presets per user.
- **R-65 · Notifications** — new lead → email and/or WhatsApp to the assigned
  agent; daily digest of pending follow-ups. This is what makes the CRM get used.
- **R-66 · Dealer / channel-partner registry** — `partners` table, linked from
  `addedBy = dealer`, with contact and commission-share defaults. Feeds R-31's
  shared commission.
- **R-67 · Per-property SEO fields + scheduled publishing** — meta title,
  meta description, slug override, OG image; publish-at datetime.
- **R-68 · Reports** — pipeline value by stage, source attribution (which channel
  produced closed deals), agent performance, brokerage earned vs pending,
  month-over-month listing additions.
- **R-69 · Deal document checklist + brokerage invoice** — per-stage document
  checklist (token receipt, agreement, registry) and a generated brokerage
  invoice/receipt PDF per deal.

### Group J — Compliance, legal, data protection

- **R-70 · DPDP Act 2023 handling** — the moment owner mobile numbers, client
  phone numbers and lead records are stored, this is personal data under India's
  Digital Personal Data Protection Act, 2023. Needs: a purpose/consent notice on
  every form, purpose limitation, a retention policy, deletion on request, access
  restricted to named users (R-54), and an audit trail (R-54). Treat as
  non-optional once the CRM ships; confirm specifics with their counsel.
- **R-71 · RERA advertising compliance** — Indian real-estate advertising for
  RERA-registered projects is expected to carry the RERA registration number.
  Render it on every project and unit that has one, in the footer for the agency
  registration, and in generated PDFs (R-43). Have the client confirm their own
  agent registration number.
- **R-72 · Privacy policy, terms, disclaimer, cookie/consent** — none exist
  today. Required before analytics (R-81) and before collecting personal data at
  scale. The existing footer disclaimer is a start, not a policy.
- **R-73 · Data retention & subject requests** — retention window per record
  type, a documented process for deletion requests, and an export path.
- **R-74 · Activity ticker honesty review** — `SocialProofTicker` currently
  fabricates visitor activity from random name/event pools and presents it as
  real. India's CCPA dark-pattern guidance treats fabricated urgency and activity
  as a consumer-protection risk, and it directly undercuts a brand built on
  discretion. **Recommend** removing it, or driving it from real (anonymised)
  enquiry events. Client decision — flag it, do not quietly keep it.

### Group K — Performance, reliability, scale

- **R-75 · Pagination + indexes** — `/properties` currently loads every matching
  row and every admin list does too. Add pagination (or infinite scroll with a
  server cursor) and B-tree indexes on every new filter column
  (`listingStatus`, `city`, `locality`, `propertyType`, `configuration`,
  `demandPrice`, `projectId`, `towerId`), plus a composite for the common
  status+city+type query.
- **R-76 · Search upgrade** — the current multi-token `ILIKE` scan is fine at
  tens of rows and degrades badly at thousands. Move to Postgres full-text or
  `pg_trgm` with an index when the portfolio grows; add locality and ref-code
  matching.
- **R-77 · Distributed rate limiting** — `lib/rate-limit.ts` is in-memory per
  instance and resets on every deploy and scale event. Move to a shared store
  before any serious traffic or multi-instance deploy.
- **R-78 · Migrations, backups, restore drill** — real SQL migrations (§4.3),
  automated database backups, and an actually-tested restore. Once this holds the
  brokerage's client list and brokerage ledger, losing it is losing the business.
- **R-79 · Error monitoring & alerting** — errors are `console.error` today.
  Add centralised error reporting plus alerting on the existing `/api/health`.
- **R-80 · Image and LCP budget** — the detail page can now carry 20+ images plus
  video embeds. Enforce lazy-loading below the fold, one eager LCP image,
  `sizes` accuracy, and a page-weight budget. Keep Core Web Vitals green — it is
  a stated success criterion in `PROJECT_OVERVIEW.md`.

### Group L — SEO, analytics, growth

- **R-81 · Analytics + event tracking** — GA4 (behind consent, R-72) with events
  for: enquiry submitted, shortlist add, WhatsApp click, phone click, brochure
  download, site-visit request, filter use. Without this nobody can say which
  channel produced a deal — and R-68's source attribution depends on it.
- **R-82 · Structured data expansion** — keep the existing `RealEstateListing`
  JSON-LD, add breadcrumbs, project/builder schema, `FAQPage` on locality pages,
  and `LocalBusiness` details on contact.
- **R-83 · Sitemap & robots** — add collections, projects, builders, locality
  pages; exclude archived/sold; keep `/admin` and `/api` disallowed.
- **R-84 · Per-property OG images** — currently the first gallery image; generate
  a branded OG card with title, locality and key specs so WhatsApp/Facebook
  shares look intentional.
- **R-85 · Local SEO alignment** — NAP consistency between the site, JSON-LD and
  their Google Business Profile; embed reviews (R-53).

### Group M — Accessibility & quality

- **R-86 · WCAG 2.2 AA pass** on every new surface — tabs (proper `role="tablist"`
  semantics or links), the enquiry cart dock, gallery tabs, comparison table,
  admin forms. Labels, focus order, contrast (gold on cream is the risk area),
  error announcements.
- **R-87 · Reduced motion & keyboard** on all new interactive UI, matching the
  existing `gsap.matchMedia()` / `useReducedMotion()` discipline in
  `ANIMATION_GUIDELINES.md`.
- **R-88 · Runnable checks** — one assert-based check per non-trivial helper:
  ref-code generation, brokerage maths, area normalisation and conversion,
  collection mapping, status→visibility, charge totalling, price-band derivation.
  No framework, per repo convention.
- **R-89 · Empty, loading and error states** — every new list, filter combination
  and CRM view gets a designed empty state with a next action. "No results" with
  a dead end is the most common failure of listing sites.
- **R-90 · Mobile QA matrix** — the buyers are on phones and the brokers enter
  data on phones. Test the full admin property form, the enquiry cart, the
  comparison view and the filter tabs at 360px before calling anything done.

---

## 8. Guardrails — do not break these

- Keep the fail-soft wrapper and the `site-data` cache tag; a DB blip must still
  render the marketing site.
- No component library, form library, state manager, date picker or second ORM.
  Native HTML + Tailwind + Drizzle, per [TECH_STACK.md](TECH_STACK.md#ponytail-conventions).
- No GSAP or scroll animation in the admin panel.
- Never wildcard `images.remotePatterns`; add hosts explicitly, in both places.
- Never weaken the CSP to make an embed work; add the specific `frame-src` host.
- Never ship the property form as one 150-field page.
- Never use `db.query.*.findMany()` without a `columns` allowlist in a public
  query once internal columns exist.
- Never name the CRM table `deals` — taken by Deal of the Week.
- `prefers-reduced-motion` and keyboard paths work on every new surface.
- Every new non-trivial helper ships with one runnable check.

---

## 9. Phased build plan

Each phase is independently shippable and ends with `npm run lint && npm run build`
green plus the §4.1 leak check.

| Phase | Scope | Depends on |
|---|---|---|
| **P0 — Intake** | Send §11. Collect photos, numbers, address, socials, RERA, WhatsApp number, API keys. Only R-02/03/06/37/38 block on this. | — |
| **P1 — Taxonomy + schema foundation** | Full CFF taxonomy in `lib/attributes.ts` + `lib/locations.ts`; new tables; additive columns; migrations; seed coverage; public/internal projections and column allowlists. | — |
| **P2 — Admin property form rebuild** | Sectioned conditional form for every CFF group; draft + autosave; ref code; status; added-by; media categories; document vault; owners; charges. | P1 |
| **P3 — Builders, projects, towers** | Builder CRUD + linkage, project fields, tower inventory, duplicate-unit flow, admin pitch view. | P2 |
| **P4 — Public listings rework** | Collections, location tabs, configuration tabs, card redesign, expanded detail page, project pages. | P2, P3 |
| **P5 — Enquiry cart + leads** | Shortlist, dock, combined enquiry, lead persistence, admin inbox, notifications. | P4 |
| **P6 — CRM + brokerage** | Named users + audit log, clients, deals, activities, tasks, brokerage maths, dashboard, reports. | P5 |
| **P7 — Landing & brand pass** | Hero boxes, stats, imagery, footer truth, office + team photos, four seeded listings, settings page. | P0 assets |
| **P8 — Growth features [ADDED]** | Whichever of Group H the client approves — converter, EMI, comparison, PDF sheet, WhatsApp share, locality pages, saved searches. | P4 |
| **P9 — Compliance & hardening** | DPDP/consent/policies, RERA rendering, ticker decision, pagination + indexes, rate-limit store, backups, monitoring, accessibility, CWV, doc sync (`CONTENT_MODEL.md`, `SITE_ARCHITECTURE.md`, `TASKS.md`, `README.md`). | all |

---

## 10. Coverage checklist — every CFF field must be ticked

**P** = rendered publicly · **I** = admin/internal only · **B** = internal always,
public when a flag is on.

### 1. Basic Details
- [ ] Property ID (auto ref code) — I
- [ ] Listing Date — I
- [ ] Last Updated — I
- [ ] Added By: Global Landmark / Dealer / Owner — I
- [ ] Status: Available · Reserved · Token Received · Under Agreement · Sold · Rented · Hold — I (drives public visibility)

### 2. Property Type
- [ ] Residential Plot · Independent House · Villa · Flat/Apartment · Penthouse · Builder Floor · Studio Apartment · Farm House · SCO · Booth · Shop · Office Space · Showroom · Warehouse · Industrial Plot · Industrial Shed · Commercial Plot · Hotel · Hospital · School Site · Institutional Plot · Mixed Use Property · R Zone Land — P
- [ ] Lease · Pre-Leased Property · Investment Property (mapped as intent/flags, R-10) — P

### 3. Location
- [ ] Country (India / Dubai / Australia) — P
- [ ] City · Locality · Sector · Block — P
- [ ] Seeded list: Chandigarh, Panchkula, Panchkula Extension, Zirakpur, Mohali, New Chandigarh, Derabassi, Kharar, Mullanpur, Airport Road, IT City, PR-7, PR-8, PR-4 — P
- [ ] GMADA / HUDA / MC area classification — P
- [ ] Society · Tower · Floor · Unit Number — P (unit number **CONFIRM**, default I)

### 4. Builder Details
- [ ] Builder Name · Belongs To · Project Name · RERA Number — P
- [ ] Possession Status · Launch Date · Possession Date — P
- [ ] Price Appreciation — I · Old/Past Projects — B

### 5. Area
- [ ] Plot Size · Built-up · Super · Carpet (each with unit) — P
- [ ] Front · Depth — P
- [ ] PLC: Park Facing · Corner · Green Belt · Main Road · Highway · Lake View · Hill View · Golf Course · Garden · Floor-PLC — P
- [ ] Number of Floors · Number of Towers · Total Units · Green Area — P
- [ ] Units: Sq.Ft · Sq.Yard · Marla · Kanal · Acre · Biswa · Bigha — P

### 6. Price Details
- [ ] Demand Price — B · Negotiable — B · Per Sq.Ft Rate — B
- [ ] Circle Rate — **I only**
- [ ] Maintenance · PLC · IFMS · Club · Parking · IDC · EDC · GST · Registry · Transfer · Other Charges — B

### 7. Configuration
- [ ] 1–5 BHK · 2+1 · 3+1 · 4+1 · 3+2 · Duplex · Triplex · Studio — P (tabs)
- [ ] Bedrooms · Bathrooms · Balconies — P
- [ ] Servant · Study · Store · Pooja Room · Terrace · Roof Rights — P

### 8. Ownership — all **I**
- [ ] Owner Name · Seller Category (Owner/Builder/Investor/NRI/Bank) · Number of Owners · Owner Type · Mobile · Alternate Mobile · Address

### 9. Furnishing
- [ ] Unfurnished · Semi · Fully · Luxury Furnished — P
- [ ] AC · Beds · Sofa · Dining Table · Wardrobes · Refrigerator · Washing Machine · Chimney · RO · Microwave · Curtains · TV · Geyser · Mixer · Other — P

### 10. Facing
- [ ] N · S · E · W · NE · NW · SE · SW — P

### 11. Possession Status
- [ ] Ready to Move · Under Construction · Soft Launch · Possession in 6 Months · Possession in 1 Year · Other — P

### 12. Property Age
- [ ] New · <1 Year · 1–5 · 5–10 · >10 Years — P

### 13. Loan
- [ ] Home Loan Available · Bank Approved — P
- [ ] Banks on Panel — P · Market Value vs Circle Rate — I · Other — B

### 14. Legal
- [ ] RERA Registered (+ number) · CLU Approved · Registry Available · Freehold — P
- [ ] Mortgaged — **I only**

### 15. Amenities
- [ ] Club House · Swimming Pool · Gym · Lift · Power Backup · Security · CCTV · Gated Community · Children's Play Area · Park · Jogging Track · Sports Facilities · Community Hall · EV Charging · Smart Home · Wi-Fi · Visitor Parking · Theatre · Sauna · Steam · Pickleball · Tennis · Cricket · Squash · Badminton · Basketball · Salon · Kids' Day Care · Pet Play Area · Intercom · Other — P

### 16. Parking
- [ ] Covered · Open · Basement · Stilt · Two-Wheeler · Visitor · Number of Slots — P

### 17. Documentation — default **I**
- [ ] Registry · Mutation · Sale Deed · OC · CC · Approved Layout Plan · Electricity · Water · Property Tax Paid · NOC · 13 Sala · Bharmukt · GPA · Naksha · LOI/EOI · Other
- [ ] Uploaded document files, private storage — **I only**

### 18. Brokerage — all **I**
- [ ] Brokerage Percentage · Shared Commission · Brokerage Paid · Brokerage Pending

### 19. Photos & Media
- [ ] Cover Photo · Interior Photos · Exterior Photos · Floor Plan — P
- [ ] Video Link · Drone Video Link · Virtual Tour Link · Google Map · Brochure — P

### 20. Property Specifications
- [ ] Facing · Floor Number · Total Floors · Corner · Park Facing · Road Width · Entrance Width · Ceiling Height · Possession · Age of Property — P

### Client update list
- [ ] R-01 hero boxes · [ ] R-02 stats · [ ] R-03 imagery · [ ] R-04 collections
- [ ] R-05 card + enquiry cart · [ ] R-06 footer truth · [ ] R-07 ref/status internal
- [ ] R-08 location tabs · [ ] R-09 configuration tabs · [ ] R-12 tower inventory
- [ ] R-13 price + charges · [ ] R-26 builder linkage · [ ] R-27 project pages
- [ ] R-28 media categories · [ ] R-29 legal documents · [ ] R-30 CRM
- [ ] R-31 brokerage · [ ] R-32 lead persistence · [ ] R-37 office/team photos
- [ ] R-38 four live listings

---

## 11. Client follow-up list (send first thing)

**Assets and photography**
1. Office photographs — exterior, interior, reception, team at work.
2. Portraits of Ashu Goyal and Divya Goyal.
3. The black-and-white property set at full resolution, with the property each
   belongs to.
4. A replacement image for the removed India Gate shot — a real Tricity project.
5. Photos and full details for the three to four properties they want live first.

**Company details**
6. Full registered office address (and any second office) + office hours.
7. Both phone numbers confirmed, plus the WhatsApp business number.
8. The real enquiry inbox address.
9. Live social links — Instagram is set; X, LinkedIn, YouTube, Facebook are
   placeholders and currently do not render at all.
10. RERA registration number(s) for the footer licence line and project listings.
11. Real credibility figures — sales volume, properties transacted, years — with
    something we can attribute them to.
12. Confirm the six press mastheads currently listed can be evidenced, or remove
    them.

**Product decisions**
13. Does the demand price show publicly, or stay "price on request"?
14. Should the public property page show a reference code?
15. Should a trimmed documentation checklist ("Registry available", "OC received")
    show publicly as a trust signal?
16. Are `Reserved` properties publicly visible, or hidden with `Sold`/`Rented`?
17. Separate logins per person (Ashu, Divya, staff) for CRM attribution and
    brokerage, or one shared admin login?
18. Do they add localities/sectors themselves, or is a fixed list enough?
19. Confirm the deal pipeline: Enquiry → Site Visit → Negotiation → Token →
    Agreement → Registry → Closed.
20. Confirm "Lease / Pre-Leased / Investment Property" are deal attributes, not
    property types.
21. Society naming conventions (still outstanding from the July round).
22. Do they want per-item furnishing counts ("AC ×3") or presence only?
23. Existing inventory in a spreadsheet? If yes, get the file — it defines the
    bulk-import format (R-61).
24. Activity ticker: keep the scrolling marquee of placeholder activity, or
    replace it? **Raise directly:** the entries are fabricated and presented as
    real visitor activity. India's CCPA dark-pattern guidance treats fabricated
    urgency/activity as a consumer-protection risk, and it works against a brand
    built on discretion. Recommend removing it or driving it from real enquiries.

**Which [ADDED] features they want** (§7)
25. Area unit converter, EMI calculator, property comparison, PDF property sheet,
    WhatsApp share, saved-search alerts, locality landing pages, builder pages,
    NRI corner, sell/valuation funnel.
26. Requirement↔inventory matching and follow-up reminders in the CRM — the two
    features most likely to make the CRM get used daily.

**Accounts, legal and access**
27. Cloudinary account/keys (currently in paste-URL fallback mode).
28. newsdata.io key for `/news`.
29. Domain + DNS for launch, and the hosting target.
30. Who signs off the privacy policy and data-handling notice — once owner and
    client phone numbers are stored, DPDP Act 2023 obligations apply (R-70).
