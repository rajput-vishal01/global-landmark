# Component Inventory

Implied by [SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md) + [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md). Grouped by the `components/ui` vs `components/sections` split from [TECH_STACK.md](TECH_STACK.md#folder-structure) — build only what's used; ponytail applies (no speculative variants).

## `components/ui` — primitives

| Component | Notes |
|---|---|
| `Button` | Primary (navy fill/gold outline-draw hover per omniyat.com pattern), secondary (outline), ghost. |
| `EyebrowLabel` | The tracked-uppercase micro-label used above every headline — small enough to be a primitive, used everywhere. |
| `Badge` | Status tags: "New," "Under Offer," "Sold," "Off-Plan." |
| `Divider` | Gold hairline, horizontal/vertical variants. |
| `Input` / `Select` / `Textarea` | Form primitives — inquiry, valuation, newsletter forms. |
| `Logo` | Light/dark variants per [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md#logo-usage). |
| `IconButton` | Gallery nav arrows, lightbox close, menu toggle. |
| `StatCounter` | Animated count-up number + label — used standalone in `CredibilityBand`. |

## `components/sections` — composites

| Component | Where used | Notes |
|---|---|---|
| `Header` | Global | Transparent-over-hero → solid on scroll, direction-aware hide/show, mobile nav trigger. |
| `MobileNavOverlay` | Global | Framer Motion slide-in, staggered nav items. |
| `Hero` | Home, Communities, Services | Full-bleed image/video, headline sequence (GSAP timeline), scroll cue. Variant props for image vs. video background, not separate components. |
| `CredibilityBand` | Home | Stats row + optional press-logo marquee. |
| `ListingGrid` | Properties, Home (featured), Community Detail, Agent Detail | Fixed-aspect-ratio `PropertyCard` grid, `ScrollTrigger.batch()` stagger-in. |
| `PropertyCard` | Within ListingGrid | Image, price, beds/baths/sqft, location, status badge, hover zoom. |
| `FilterBar` | Properties | Price range, beds, location, status — collapsible on mobile. |
| `SignatureReveal` | Property Detail, Community Detail | The scrubbed arch/scale image reveal — one per page, per [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md). |
| `PropertySpecSheet` | Property Detail | Metadata sidebar (price/beds/baths/sqft/status/agent) beside full-bleed photography — big.dk pattern. |
| `GalleryLightbox` | Property Detail | Framer Motion `AnimatePresence` + shared `layoutId` from thumbnail. |
| `FloorPlanViewer` | Property Detail | GSAP pinned/sticky panel if multiple floors/plans. |
| `MapEmbed` | Property Detail, Contact | Location context — property, office locations. |
| `AgentCard` | Agents index, Property Detail (listing agent), Sell page | Portrait, name, specialty, contact link. |
| `AgentBio` | Agent Detail | Full bio, active/sold listings, direct contact. |
| `CommunityTeaser` | Home | Grid/carousel teaser linking to `/communities`. |
| `CommunityHero` | Community Detail | Imagery-led, community stats. |
| `TestimonialBlock` | Home, Sell page | Portrait + quote, gold hairline divider. |
| `JournalCard` | Journal index, Home teaser | Article thumbnail, title, date, category. |
| `ArticleBody` | Journal Article | Reading-width, typographic content styles. |
| `CTABand` | End of every page | Full-bleed navy, centered headline, one primary CTA — animated-outline button hover. |
| `InquiryForm` | Property Detail, Contact | Property-context-aware (pre-fills property reference). |
| `ValuationForm` | Sell, List With Us | Multi-step or single-step property valuation request. |
| `NewsletterSignup` | Footer | Email capture. |
| `Footer` | Global | Sitemap, offices, social, legal, newsletter. |
| `PressMarquee` | Home (within CredibilityBand) | Auto-scrolling logo row. |
