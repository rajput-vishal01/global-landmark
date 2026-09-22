# Tasks — Phased Build Roadmap

## Pending (Sep 2026) — do in this order

1. **Redesign the admin Create/Edit property form.** It is too complex for
   the client to use. Cut it to the essentials every listing needs, with the
   rest optional and out of the way. First, because the detail page can only
   show what this form reliably captures, and brokers are blocked on it now.
2. **Redesign the public property detail page** (`/properties/[slug]`),
   after a few real listings have gone in through the new form, and around
   the fields those listings actually carry: gallery, price and key facts,
   then optional sections that render only when filled.

Landing page redesign checkpoint: git tag `landing-v1` marks the landing
page as it was before the Sep 2026 redesign. That redesign (eed4754) was
tried and reverted (3321b66) at the client's call; the landing page is
back to landing-v1.

Context-building phase produced all `.md` docs; the build is now underway.
Shipped since: landing page + subpages (earlier sessions), then the July 2026
feature expansion — PostgreSQL/Drizzle data layer, admin panel behind the
`/admin` route (properties/projects/deals CRUD, filesystem-backed galleries with
cascade delete), live `/properties` + `[slug]` detail pages with category
filter, portfolio search, hero Sale/Purchase/Lease/Invest rotator, Deal of
the Week queue, scrolling testimonials, WhatsApp dock + inquiry pop-up,
activity ticker, `/news` via newsdata.io. See [README.md](../README.md).

Outstanding from that expansion (client inputs): WhatsApp number, admin
domain + DNS, newsdata.io key, society naming
conventions, ticker style sign-off (marquee vs. quieter toast).

**Since (Aug 2026):** [REQUIREMENTS_V2.md](REQUIREMENTS_V2.md)'s CFF field
expansion has shipped — taxonomy/schema foundation, the admin property form
rebuild, builders/projects/tower inventory, the public listings rework, the
enquiry cart, and the CRM — followed by the landing/brand pass, the local
Tricity imagery pass and PWA support. The build is complete and the app is
production-bound.

The old `.planning/` GSD scaffolding that used to track this was deleted in
the Sep 2026 audit: it had drifted badly (its STATE.md still read "0 of 10
phases, status: planning", and its codebase notes still described
Cloudinary, Lenis and ScrollTrigger, all long removed). Stale docs that
assert false things about the code are worse than no docs.
[REQUIREMENTS_V2.md](REQUIREMENTS_V2.md) is the requirement register;
this file's task list below predates the expansion and is not kept in
step with it line by line.

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

## Shipped — Sep 2026 final pass

- Property form cut down and regrouped; maps link instead of coordinates;
  document vault with multi-upload and preview.
- Builders and areas pages removed (redirected); projects pre-fill units.
- Property page redesigned: gallery with full-quality viewer, sticky jump
  bar, forms behind buttons, map beside the enquiry card; EMI calculator
  removed.
- Images served at uploaded quality everywhere.
- Email: visible failures, `mail:test`, `/sell` notifications, mail sent
  after the response; tour requests can be deleted.
- SEO: title template, canonicals, share images, JSON-LD, sitemap, robots,
  www redirect, per-listing titles and alt text.
- Responsive fixes (jump bar on phones, stacked overlays, deal board, hero
  overflow, 12px text floor); dead code removed.
- Demo data seed (`npm run db:seed-demo`, removable with `--remove`).

Open, waiting on the client: real photos to replace demo data, confirmation
of the WhatsApp number, whether commercial and rental listings are needed.
