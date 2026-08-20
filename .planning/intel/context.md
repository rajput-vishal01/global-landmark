# Context

Running notes from the six docs classified `type: DOC`, keyed by topic, with source
attribution. Where a DOC is superseded by the precedence-0 SPEC or by its own
self-superseding banner, the note records the current position and flags the stale
portion rather than dropping it.

Docs in this bucket: `docs/PROJECT_OVERVIEW.md` (prec 2), `docs/BRAND_GUIDELINES.md`
(prec 2), `docs/DESIGN_LANGUAGE.md` (prec 2), `docs/ANIMATION_GUIDELINES.md` (prec 2),
`docs/SITE_ARCHITECTURE.md` (prec 3), `docs/CONTENT_MODEL.md` (prec 3).

---

## Brand identity and positioning
- source: docs/PROJECT_OVERVIEW.md
- Global Landmark Realty Group is a luxury real-estate brokerage brand. Logo: gold skyscraper cluster inside a gold ring, navy wordmark — signals high-rise/international luxury property, not residential-suburban. The site is the brand's primary marketing and lead-generation surface.
- What is being built: a luxury real-estate marketing website (Next.js 16, App Router), editorial-modern aesthetic, rich but tasteful scroll/interaction design (GSAP + Framer Motion), built to convert high-net-worth visitors into inquiries — "not a transactional listings portal (no MLS search-engine feel, no dense filter grids up front)."
- **Tension flag:** the Aug 2026 SPEC adds collection tabs (R-04), location tabs (R-08), configuration tabs (R-09), an admin CRM (R-30) and brokerage tracking (R-31). See INGEST-CONFLICTS.md INFO entries — the SPEC wins on precedence, but §8 simultaneously forbids redesigning the landing page or motion system, so the luxury-editorial posture holds on the brand surfaces while discovery surfaces gain density.

## Target audiences
- source: docs/PROJECT_OVERVIEW.md
- **Luxury buyers** — HNW individuals/families, often relocating or buying second/investment homes. Expect polish, restraint, and credibility signals (press, notable sales, agent pedigree) over bargain-hunting UX.
- **Luxury sellers** — owners evaluating which brokerage best presents their property; the site must double as a pitch deck ("list with us").
- **Investors** — interested in yield, off-plan and portfolio properties; want data (stats, ROI framing) presented with the same visual weight as lifestyle imagery.
- **Referral network** — other agents/brokerages sizing up credibility before referring clients.
- All four audiences are described as size-conscious: the site itself is a proof point of taste and competence, not just a catalogue.

## Goals and success criteria
- source: docs/PROJECT_OVERVIEW.md
- Goals: (1) establish credibility on first scroll — hero plus press/stats within view 1; (2) convert visits into qualified inquiries (property inquiry, valuation request, agent contact) with minimal friction; (3) present listings with editorial-grade imagery and detail without becoming a generic MLS clone; (4) support agent/team presence, since luxury real estate sells on relationship and trust; (5) be a technical showcase — animation quality itself functions as a credibility signal.
- Success criteria: visual/motion quality reads as tier-equivalent to aaronkirman.com on first impression · Core Web Vitals stay healthy despite rich animation (LCP unaffected by hero video/motion, no scroll jank) · every primary CTA reachable in ≤2 clicks from any page · listings and property-detail pages support real photography at editorial-grade crops without layout breakage · reduced-motion and keyboard/screen-reader users get a fully functional, non-broken experience (animation is enhancement, never the only path to content).

## Original scope boundaries (pre-Aug-2026)
- source: docs/PROJECT_OVERVIEW.md
- In: marketing site — home, listings, property detail, communities, about, agents, services, journal/insights, contact, list-with-us.
- Out (for now): MLS/IDX live sync, **transaction/CRM backend**, buyer portal/login, multi-language i18n, dark mode (undecided). Content assumed CMS-fed or static-authored later; that phase defined the data shape only.
- **Superseded in part:** the SPEC adds a CRM (R-30) and brokerage tracking (R-31). MLS/IDX sync, buyer portal/login and multi-language remain out; the SPEC's R-05 restates "no accounts — auth is out of scope" for public visitors, so the buyer-portal exclusion still holds. Dark mode remains undecided and unbuilt per CLAUDE.md.

## Sitemap and route status
- source: docs/SITE_ARCHITECTURE.md
- **Self-superseding banner (July 2026):** shipped routes are `/`, `/about`, `/contact`, `/properties` (live DB data + category filter), `/properties/[slug]` and `/news`, under the `(site)` route group, plus the admin panel at `/admin` behind the password gate in `proxy.ts`. The rest of the sitemap is the longer-term target.
- Target-only, not built: `/communities`, `/communities/[slug]`, `/agents`, `/agents/[slug]`, `/services/buy`, `/services/sell`, `/services/invest`, `/journal`, `/journal/[slug]`, `/list-with-us`.
- Route rationale worth carrying forward: `/communities` exists because luxury buyers buy a location as much as a property; `/agents/[slug]` supports referral-network and seller audiences specifically; `/services/*` are persuasion surfaces distinct from `/properties` discovery; `/list-with-us` is kept top-level rather than under `/services/sell` because it is the primary seller CTA target from nav and footer.
- **Route-group discrepancy:** the sitemap table text says routes assume the `(marketing)` group from TECH_STACK.md; the banner and the shipped code say `(site)`. See INGEST-CONFLICTS.md.
- The SPEC adds routes not in this sitemap: `/projects/[slug]` (R-27, approved) and, as [ADDED] proposals only, `/builders/[slug]` (R-47) and locality landing pages (R-46). R-50's seller funnel maps onto the existing `/list-with-us` roadmap entry.

## Navigation structure
- source: docs/SITE_ARCHITECTURE.md
- Primary nav (header): Properties, Communities, Agents, About, Journal, Contact — six items max, flat, no deep dropdowns.
- Primary CTA always visible in the header with distinct styling: "List With Us" or "Contact an Agent" depending on page context.
- Footer: full sitemap, office locations, social, legal (privacy, fair housing/equal opportunity disclosures — noted as required for real estate), newsletter signup.
- Services reachable from the footer and contextual CTAs rather than cluttering the header.

## Not in scope this phase (architecture doc)
- source: docs/SITE_ARCHITECTURE.md
- MLS/IDX sync, buyer portal/login, saved-search/favorites (would need auth), multi-language routing.
- **Partially superseded:** the SPEC's R-49 proposes saved search with alerts keyed on a phone number specifically to avoid needing auth. R-49 is [ADDED] and not approved.

## Content model — entity shapes
- source: docs/CONTENT_MODEL.md
- **Self-superseding banner (July 2026):** the live schema is `lib/db/schema.ts` (PostgreSQL via Drizzle) — projects, properties (`kind: project|unit`, `category: sale|purchase|lease|invest`, **no price by client decision**), property_images (Cloudinary `publicId` or pasted URL), deals (date-windowed Deal of the Week queue). The shapes in the doc remain the reference only for entities not yet built.
- **Double supersession on price:** the banner's "no price by client decision — deals close over calls" is itself superseded by SPEC §3.1 — full price and charges are captured, public display gated by `showPricePublicly` defaulting to false. The doc, the schema comment and `PROPERTY_DETAIL.sidebarNote` are all named for update.
- Still-live reference shapes for unbuilt entities: `Agent` (slug, name, title, photo, bio, specialties, languages, phone, email, socialLinks, officeSlug), `Community` (slug, name, heroImage, gallery, description, stats {avgPrice, walkScore, propertyCount}, lat, lng), `Article` (slug, title, excerpt, category, coverImage, body, authorSlug, publishedAt), `Office` (slug, name, address, phone, lat, lng), `MediaAsset` (url, alt, width, height, aspectRatio "4:5"|"3:2").
- The `Inquiry` shape (type: property|valuation|general|newsletter, name, email, phone, message, propertySlug, submittedAt) is a form-submission shape, not content. The SPEC's `leads` table (R-32) is a superset of it — adding source, pageUrl, `propertyIds int[]`, UTM, status, assignedTo.
- Conventions worth preserving: FK-style fields are slugs, not numeric IDs, to keep content human-editable regardless of eventual CMS choice. `MediaAsset.aspectRatio` is a content-level cropping hint so authors crop consistently at source rather than relying on CSS `object-fit`. The doc's stated reason for `priceOnRequest` — ultra-luxury listings frequently withhold public pricing — is the same rationale the SPEC's `showPricePublicly` default-false preserves.
- The doc's closing note "No auth/user model — out of scope" refers to public/buyer auth; the SPEC's R-54 admin users are an internal admin concern and do not contradict it.

## Design principles
- source: docs/DESIGN_LANGUAGE.md
1. **Photography leads, typography frames.** On signature property shots imagery is the hero and type stays small; on brand/editorial moments large serif display type carries gravitas.
2. **Near-black, near-white, never pure.** Use `navy-90` (`#1C2B4D`) and `off-white` (`#FAF9F6`) as the working ink/base, reserving true `#14213D`/`#FFFFFF` for the most saturated moments (logo, primary CTA).
3. **Gold is punctuation, not paragraph.** Dividers, icon strokes, eyebrow-label colour, hover states, corner-frame details, active indicators — never a section background, never body text, never more than ~10% of any viewport's visual weight.
4. **Restraint over density.** Fewer, larger, whitespace-heavy blocks beat dense grids. "Real estate sells on the property, not on how much fits per screen."
5. **Motion confirms hierarchy, it doesn't create it.** Every reveal, hover and transition reinforces what is already visually primary — never used to disguise a weak layout.

## Spacing and typography scales
- source: docs/DESIGN_LANGUAGE.md
- Spacing is fluid and `clamp()`-based, defined as CSS custom properties / Tailwind theme extension rather than fixed px per breakpoint: `space-3xs` 4→6px · `space-2xs` 8→12px · `space-xs` 12→20px · `space-sm` 20→32px · `space-md` 32→56px · `space-lg` 56→96px · `space-xl` 96→160px · `space-2xl` 160→240px.
- Type scale, fluid via `clamp()`: Eyebrow label 11→14px / lh 1.2 / +0.15–0.25em uppercase / 500 · H1-Hero 42→96px / 1.05–1.15 / -0.01em / 400 serif · H2 32→56px / 1.1–1.2 / 400 serif · H3 24→36px / 1.2 / 400–500 · H4 18→24px / 1.3 / 500 sans · Body 16→18px / 1.5–1.7 / 400 sans · Small-meta 13→14px / 1.4 · Button/nav label 13→15px / lh 1 / +0.05–0.1em, uppercase for buttons / 500.
- Display serif for H1/H2/hero, grotesque sans for everything else. Exact font families are an **open decision** deferred to TASKS.md (outside this ingest set). Candidates named: a Didot/Canela-class serif for display, a Graphik/Söhne-class grotesque for body.

## Color usage by context
- source: docs/DESIGN_LANGUAGE.md, docs/BRAND_GUIDELINES.md
- Light section (default): `off-white`/`white` background, `navy`/`navy-90` text, gold only in labels, dividers and hover.
- Dark section (hero, footer, feature moments): `navy`/`navy-90` background, `white`/`off-white` text, gold accent unchanged — gold reads on both.
- Photography-heavy section: scrim or gradient overlay for text legibility, never `mix-blend-mode: difference` as the primary contrast mechanism — use a translucent navy scrim.
- Section-to-section transitions: consider semantic colour slots (`--section-bg`, `--section-fg`, `--section-accent`) reassigned per section and transitioned over 0.3–0.5s rather than a hard cut.
- Derived neutrals are to be defined as tokens, not ad hoc: `navy-90` `#1C2B4D`, `ink-muted` `#4A5468`, `grey-border` `#D8D9DE`, `off-white` `#FAF9F6`. Derive further tints/shades via consistent HSL lightness steps rather than arbitrary greys.

## Layout system and section patterns
- source: docs/DESIGN_LANGUAGE.md
- Base grid: 12 columns desktop, 8 tablet, 4 mobile, fluid gutters (`space-sm`–`space-md`). Container max-width ~1440–1600px for full-bleed, ~1100–1200px for reading-width content.
- **Property spec sheets: fixed-width metadata sidebar (price/beds/baths/sqft/status) beside full-bleed photography** — named the primary property-detail layout. Relevant to SPEC R-25's two-column spec table and R-13's price/on-request sidebar.
- Section pacing on every major page: hero → credibility (stats/press) → primary content → secondary content → CTA band → footer.
- Patterns: **Hero** full-bleed image or muted looped video, serif headline, eyebrow above, one or two calm CTAs, scroll cue; header nav transparent-over-hero with a scrim, solid on scroll past. **Credibility band** stats or auto-scrolling press marquee directly after hero. **Listing grid** real CSS grid (not slider-only) with fixed-aspect-ratio cards, hover zoom `scale(1.04–1.08)`. **Signature reveal** one scrubbed arch-or-mask image reveal per major page, used sparingly. **Agent/testimonial** portrait + quote, minimal chrome, gold hairline. **CTA band** full-bleed navy, centred serif headline, one primary CTA, before the footer on every page. **Footer** navy, structured columns, gold hairline dividers.

## Logo usage and voice
- source: docs/BRAND_GUIDELINES.md
- Logo is full-colour (gold gradient mark + navy wordmark) on white/light backgrounds by default; on dark navy or photography-heavy sections use a light/white wordmark variant with the gold mark unchanged. Clear space equal to the height of the "G" in "GLOBAL". Never crop the ring or compress the skyscraper cluster. Minimum 32px height — simplify to mark-only below that. Do not recolour the gold mark for hover/active states; recolour surrounding UI instead.
- Voice: refined, confident, understated luxury — never salesy, never exclamatory. Declarative sentences, specific detail (address, square footage, provenance) over adjectives. No exclamation points, no ALL CAPS except tracked eyebrow labels, no stock clichés ("won't last long", "must see"), no emoji. CTAs calm and specific: "Request a Private Viewing", "Speak with an Agent", "Request a Valuation" — not "Buy Now" or "Click Here".
- The eyebrow-label pattern (small uppercase sans, 1.5–4px tracking, 11–14px, weight 400–500) is adopted as a signature Global Landmark micro-pattern.

## Animation — division of labor
- source: docs/ANIMATION_GUIDELINES.md
- **GSAP (ScrollTrigger + timeline) owns:** scroll-scrubbed reveals tied to scroll position, pinned/sticky sections (property gallery, floor-plan viewer), multi-step sequenced timelines (hero load-in), SplitText character/line reveals (hero headline only — reserve, don't overuse), anything that must stay in sync with scroll position frame-by-frame.
- **Framer Motion owns:** component enter/exit (route transitions, modal/lightbox, mobile nav overlay), layout animation (`layout` prop) for filter/sort re-ordering on listing grids, hover/tap micro-interactions where the interaction is component-state-driven, anything inside a React component's own state machine.
- Rule of thumb: driven by scroll position → GSAP ScrollTrigger; driven by component/UI state → Framer Motion. Never both for the same element's same interaction.

## Animation — catalogues, easing, and no-build list
- source: docs/ANIMATION_GUIDELINES.md
- Scroll catalogue: staggered fade-up on grid entry via `ScrollTrigger.batch()` (`opacity 0, y 24` → `1, 0`, stagger 0.06–0.1s, `power2.out`) · arch/mask scrubbed reveal (`scrub: 1`, `scale(.65)` + arch radius → `scale(1)` + square), one signature image per property/community page · parallax hero background (`scrub: true`, background at ~0.3–0.5x foreground speed via `y` transform, not `background-position`) · pinned gallery/floor-plan panel (pin the wrapper, animate children only) · hero load-in timeline on mount (eyebrow → headline SplitText lines → subcopy → CTA → scroll cue, 0.1–0.15s stagger) · stat counter count-up (`toggleActions: "play none none none"`, `once: true`) · direction-aware header hide/show via the `Observer` plugin.
- Micro-interaction catalogue (Framer): nav overlay slide-in with staggered children · card hover lift `whileHover={{y: -4, scale: 1.02}}` spring · image zoom on gallery/listing images only, `scale(1.04–1.08)` over 0.6–0.8s · animated outline button (SVG `pathLength` draw-on over ~0.4–0.6s on hover) as a candidate primary-CTA signature · lightbox via `AnimatePresence` + shared-layout `layoutId` from thumbnail to full view · filter/sort re-order via the `layout` prop · route/page transition as fade + slight `y`, kept to 250–350ms.
- Easing picked once and reused sitewide: general transitions `power2.out` (GSAP) / `[0.215, 0.61, 0.355, 1]` (Framer); heavier reveals `power3.inOut` / `[0.23, 1, 0.32, 1]`. Durations: micro 0.2–0.4s, section reveals 0.5–0.8s, hero sequences 0.8–1.4s total, scrubbed animations tied to scroll distance with no fixed duration.
- Explicitly not built: custom cursor followers, full AJAX page-transition systems (Barba.js-style), `mix-blend-mode: difference` as a legibility mechanism, blanket image-hover-zoom on non-gallery elements, deep multi-level mega-nav motion.
- No dedicated Framer Motion skill is installed in this environment; its patterns follow official Framer Motion conventions.

## Reference-site lineage
- source: docs/DESIGN_LANGUAGE.md, docs/BRAND_GUIDELINES.md, docs/ANIMATION_GUIDELINES.md, docs/PROJECT_OVERVIEW.md
- All three design docs derive from `docs/DESIGN_REFERENCES.md`, a per-site breakdown of seven reference sites. **That doc is not in this ingest set** (not listed in `.planning/ingest-manifest.yaml`), so the "why/where it came from" rationale behind these decisions is unavailable to this synthesis. Every referenced conclusion is reproduced above from the citing doc.
- Named references and their adopted patterns: aaronkirman.com (primary quality bar, nav depth, multi-office footer, `--dark`/`--light` logo variants) · big.dk (metadata sidebar beside full-bleed photography; type small on signature shots) · sobharealty.com (arch/scale scrubbed unveil; dual-container widths 1600/1009; its blanket `img:hover{scale(1.2)}` is a rejected pattern) · omniyat.com (translucent scrim over photography, art-directed desktop/mobile image pairs, SVG `pathLength` outline-button hover) · locomotive.ca (12/8/4 grid, `clamp()` spacing, direction-aware header, two-cubic-bezier discipline; its `mix-blend-mode: difference` legibility mechanism, SplitText overuse and full AJAX page transitions are rejected) · buildinamsterdam.com (semantic per-section colour slots, blanket reduced-motion override pattern; its masonry/aspect-agnostic grid is rejected for property photography) · makemepulse.com (large serif display gravitas; its 14–18-column showreel density is rejected).
