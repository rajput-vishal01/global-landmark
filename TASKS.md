# Tasks — Phased Build Roadmap

Context-building phase produced all `.md` docs; the build is now underway.
Shipped since: landing page + subpages (earlier sessions), then the July 2026
feature expansion — PostgreSQL/Drizzle data layer, admin panel behind the
`/admin` route (properties/projects/deals CRUD, Cloudinary galleries with
cascade delete), live `/properties` + `[slug]` detail pages with category
filter, portfolio search, hero Sale/Purchase/Lease/Invest rotator, Deal of
the Week queue, scrolling testimonials, WhatsApp dock + inquiry pop-up,
activity ticker, `/news` via newsdata.io. See [README.md](README.md).

Outstanding from that expansion (client inputs): WhatsApp number, admin
domain + DNS, Cloudinary + newsdata.io keys, society naming
conventions, ticker style sign-off (marquee vs. quieter toast).

## Phase 0 — Open decisions (resolve before or at start of Phase 1)

- [ ] **Font selection.** [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md#typography-scale) specifies the register (Didot/Canela-class serif + Graphik/Söhne-class grotesque sans) but not final licensed families. Needs a decision + licensing check, then wire via `next/font`.
- [ ] **Dark mode — TBD.** Not designed, not scoped, not assumed anywhere in the current docs. Decide whether to build it; if yes, scope which sections (whole-site toggle vs. hero-only vs. none) and revisit [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) for dark-mode token equivalents.
- [ ] **CMS vs. static/MDX content.** [CONTENT_MODEL.md](CONTENT_MODEL.md) defines the shape; where it lives (headless CMS, MDX files, typed local dataset) is undecided and affects `lib/content/` implementation.
- [ ] **Component library confirmation.** [TECH_STACK.md](TECH_STACK.md#styling-approach) recommends hand-built components over shadcn/ui — confirm before Phase 1 so component work isn't redone.

## Phase 1 — Foundation

- [ ] Wire Tailwind v4 `@theme` tokens from [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) + [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md) (colors, fluid spacing scale, fluid type scale) into `globals.css`.
- [ ] Set up fonts via `next/font` once Phase 0 font decision lands.
- [ ] Install and register GSAP (`@gsap/react`, ScrollTrigger, SplitText) and Framer Motion; create `lib/gsap.ts` (plugin registration, shared eases/timing) per [TECH_STACK.md](TECH_STACK.md#gsap--framer-motion-integration).
- [ ] Build `components/ui` primitives (Button, EyebrowLabel, Badge, Divider, form inputs, Logo, IconButton, StatCounter) — see [COMPONENT_INVENTORY.md](COMPONENT_INVENTORY.md).
- [ ] Build global `Header` + `MobileNavOverlay` + `Footer`.

## Phase 2 — Home + core sections

- [ ] `Hero` (image/video variants, GSAP load-in sequence).
- [ ] `CredibilityBand` (StatCounter row + PressMarquee).
- [ ] `ListingGrid` + `PropertyCard` (with `ScrollTrigger.batch()` reveal).
- [ ] `CTABand`.
- [ ] Assemble `/` (home) page end to end.

## Phase 3 — Listings & property detail

- [ ] `/properties` — `ListingGrid` + `FilterBar`.
- [ ] `/properties/[slug]` — `PropertySpecSheet`, `GalleryLightbox`, `SignatureReveal`, `FloorPlanViewer`, `MapEmbed`, `InquiryForm`.

## Phase 4 — Communities, Agents, Services, Journal

- [ ] `/communities`, `/communities/[slug]`.
- [ ] `/agents`, `/agents/[slug]`.
- [ ] `/services/buy`, `/services/sell`, `/services/invest`.
- [ ] `/journal`, `/journal/[slug]`.

## Phase 5 — About, Contact, List With Us

- [ ] `/about`.
- [ ] `/contact` — `InquiryForm` (general type), office map.
- [ ] `/list-with-us` — `ValuationForm`.

## Phase 6 — Polish pass

- [ ] `prefers-reduced-motion` audit across every animated component (per [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md#accessibility)).
- [ ] Performance audit — Core Web Vitals, especially LCP on hero-heavy pages ([ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md#performance-rules)).
- [ ] Cross-device art-directed image check (mobile vs. desktop crops).
- [ ] Legal/compliance content — fair housing / equal opportunity disclosures in footer (real-estate requirement, not yet drafted anywhere).

## Backlog / not scheduled

- Dark mode (see Phase 0 — may never get scheduled if decision is "no").
- MLS/IDX integration.
- Buyer portal / saved searches (needs auth).
- Multi-language i18n.
