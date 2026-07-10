# Design References

Per-site research, in priority order. **aaronkirman.com is the north star** — feel, pacing, typography. The other six are secondary: each contributes specific techniques, not a wholesale aesthetic.

Research method note: live browser inspection (Claude in Chrome) was unavailable this session for all 7 sites; findings come from direct HTML/CSS/JS source inspection (curl + grep of computed styles, CSS custom properties, and script bundles) rather than rendered screenshots. Values below are real tokens/measurements pulled from source, not visual approximation — motion classification (GSAP vs. Framer-shaped) is inferred from library signatures found in the bundles.

---

## 1. aaronkirman.com — PRIMARY REFERENCE

Built on Luxury Presence (real-estate-specific CMS), not a bespoke build — explains the dated motion stack (WOW.js) despite the premium visual result. The lesson is in the visual/typographic system, not the implementation.

- **Layout:** centered header/logo, listings and press in horizontal sliders (Splide/Slick) rather than static grids. Section rhythm: hero → stats → listings → bio → press → newsletter → footer.
- **Typography:** `Didot LT Std` (display serif) + `Prata` (secondary serif) + `Gilroy` (sans headings/UI) + `Roboto` (body fallback). H1 44px mobile / ~64px desktop, tight `line-height: 1.2`. Eyebrow labels: 14px, weight 300, uppercase, 2px tracking.
- **Color:** near-black ink `#141414` (not pure black), muted antique gold `#9E8B63` used sparingly (accent only — dividers, icons, labels), greys `#919191`→`#646464` for secondary text, off-white `#FAFAFA`/`#F3F3F3` section backgrounds.
- **Hero:** full-bleed autoplay looped muted video, multi-slide "opening slider." Header logo swaps light/dark variant over hero vs. white sections.
- **Motion:** staggered fade-up reveals on scroll entry (0.1s increment delays per card), image hover zoom (`scale(1.1)`), auto-scrolling press/logo marquee, slide-in side-menu nav. **Classified: viewport-reveal-shaped** (closer to Framer Motion's enter/exit model than GSAP ScrollTrigger's scrub/pin — no pinning or parallax found).
- **Navigation:** hamburger → slide-in side menu (not full-page overlay); hover dropdowns for sub-nav; built-in search.
- **Imagery:** Cloudflare-optimized, card-based listings (thumbnail + address + price), hover zoom.
- **Take:** near-black/white/gold-accent monochrome system (map directly to navy/white/gold); tracked uppercase eyebrows above serif headlines; tight headline leading; staggered card reveals; image hover zoom; press marquee for credibility; video hero with scroll-aware nav.
- **Reject:** the WOW.js/jQuery/Slick stack itself (build reveals with GSAP/Framer instead); dense 5+-item dropdown mega-nav (too much for a single-brokerage site); `rotateY` flip-card gimmick (dated); slider-only primary listings grid (hurts scannability — use a real grid, reserve sliders for press/testimonials).

## 2. sobharealty.com

- **Layout:** Bootstrap 5 grid, `.container` max-widths 1185/1600/1009px. Hero is `position: fixed` (content scrolls up over a static hero image — not true parallax, just a pin trick).
- **Typography:** `Chronicle Display` (serif headings, incl. a "Semi" and "XLight" weight) + `Ringside` (sans body/UI). H1 52px/62px line-height desktop → 36px/44px mobile. Eyebrows: uppercase, 1.5–4.5px tracking.
- **Color:** near-monochrome black/white base; single warm taupe-gold accent `#c8a487`–`#cfaf8f`. No solid dark-navy sections — darkness achieved via gradient scrims over hero imagery.
- **Hero:** full-bleed fixed-position image/video, frosted-glass pill CTA (`backdrop-filter: blur(12px)`, translucent white), bounce-animated scroll-cue icon, multi-slide rotator.
- **Motion — confirmed GSAP + ScrollTrigger:** a signature full-viewport image starts at `scale(.65)` with an arch-shaped `border-radius` mask, scrubbed to `scale(1)`/square as the user scrolls past it — an "unveiling" reveal. Also AOS-style (viewport-reveal, Framer-shaped) fade-ups on secondary carousels. Gold corner-frame button hover (two pseudo-elements drawing an L-shaped stroke with staggered delays) is pure CSS, no JS.
- **Navigation:** mega-menu dropdowns, height-based CSS transition (not JS timeline).
- **Take:** the arch/scale scrubbed reveal on one signature feature image per major property page — elegant, on-brand for "unveiling" a landmark property; frosted-glass pill CTA over hero imagery; gold corner-frame button hover translates directly to `#C9992E` on navy/white.
- **Reject:** blanket `img:hover{scale(1.2)}` applied indiscriminately, even to icons/logos (feels cheap when overused — reserve zoom for property photography only); fixed-position hero (z-index/stacking risk, blocks true parallax — use `position: sticky` or a GSAP-scrubbed transform instead, see [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md)).

## 3. omniyat.com

- **Layout:** full-bleed stacked sections, no strict 12-col grid — flex cards + horizontal scroll-snap for mobile filter rows.
- **Typography:** `OptimaLTPro Roman` (classical serif-adjacent display, uppercase, weight 400) + `Graphik` (geometric sans, Regular/Light). H1 `6rem`, one oversized display class at `20rem` for a scroll-driven word treatment. Tracking mostly normal except eyebrow labels at 4px.
- **Color:** `--rich-blue: #0a0a3d` (near-black navy — validates our navy-as-ink approach directly), muted bronze `--gold: #a18a6b`, sand `#dbc0a8`. White/light-grey base sections, dark hero/video sections with white text. Gold reserved for small accents only.
- **Hero:** full-bleed image/video, centered headline, dual CTAs, art-directed desktop/mobile image pairs (not just responsive resize — separate crops).
- **Motion — hand-rolled CSS transition + IntersectionObserver (explicitly not a JS animation library; source comment notes they avoided Webflow Interactions to prevent style conflicts):** full-screen slide-in side nav with per-item stagger; nav submenu swaps full-bleed background image per hovered link (0.8–1.2s crossfade); animated SVG-outline "draw-on" border on button hover (`stroke-dashoffset` over 2.5s) — a distinctive small motion signature. **Classified: Framer-Motion-shaped** (discrete state toggles, not scroll-scrubbed).
- **Navigation:** sticky/fixed header, translucent black scrim (`rgba(0,0,0,0.35)`) over hero for legibility.
- **Take:** navy/white/gold restraint validated independently of aaronkirman.com; large uppercase serif display for gravitas; translucent scrim header over hero imagery; animated-outline button as a distinctive, low-cost motion signature (candidate for our primary CTA hover).
- **Reject:** `20rem` display type (excessive for a listings-heavy site); OwlCarousel-era dependencies; deep nested submenu drill-down with per-item background swap (fits a large multi-project developer portfolio, overkill for a single-brokerage nav — aaronkirman's flatter nav is the better fit).

## 4. big.dk/projects/the-twist-2-1337

- **Layout:** Next.js/Tailwind v4, single-column vertical scroll, full-bleed imagery alternating with a fixed-width metadata sidebar (title/location/typology/size) — the spec-sheet-beside-photography pattern is directly reusable for property detail pages.
- **Typography:** single face, **Everett**, one weight only (400). Deliberately small/technical: H1 15–22px across breakpoints, not an airy luxury scale.
- **Color:** effectively monochrome (black/white/`#898989` grey) — zero accent color anywhere. Not a source for palette; source for restraint discipline only.
- **Hero:** no oversized headline — the architecture photograph *is* the hero, typography stays out of the way, small title/location block beside a tiny building-form icon.
- **Motion:** scroll-into-view opacity/translate reveals (IntersectionObserver + CSS transition — **Framer-Motion-shaped** in effect, though no framer-motion library detected); CSS-only checkbox-driven off-canvas nav/filter drawer (`peer-checked:`, zero JS cost); Embla Carousel for drag-enabled galleries with numbered indicators ("01/04"); custom drag-cursor via CSS `cursor` swap (no JS follower). No GSAP/ScrollTrigger/Lenis found — a genuinely lightweight site.
- **Navigation:** fixed thin header, CSS-peer-checked category panels (no JS mega-menu); footer uses a checkbox-driven accordion for office listings.
- **Take:** image-as-hero restraint (let photography carry the moment, keep typography secondary on signature property shots); metadata-sidebar pattern for spec sheets (price/sqft/beds/baths beside full-bleed imagery); CSS-only off-canvas nav (cheap, robust — no JS animation library needed for simple open/close); Embla for lightweight drag galleries.
- **Reject:** the type scale itself (too small/technical for a luxury hero — Global Landmark needs larger display type); total absence of accent color (won't serve a gold/navy identity); single-weight font (risks weak hierarchy for price/CTA emphasis).

## 5. buildinamsterdam.com/cases

- **Layout:** 2-column editorial grid for case cards (`repeat(2, calc(50% - gap/2))`), fully fluid spacing via `calc()` interpolation between 448/1024/1440px breakpoints — a real fluid-scale system, not fixed breakpoint jumps.
- **Typography:** `NHaasGroteskTXPro` (uppercase sans labels, heavy tracking) + `RecklessNeue-Book` (serif body/display, stylistic alternates enabled) — another serif+grotesque-sans pairing confirming the pattern.
- **Color:** off-white `#F2EFE6` base, terracotta `#C38133` single accent, dark-grey/black text. Four semantic color slots (`--primary/secondary/tertiary/quaternary`) reassigned per section with a 0.5s transition — smooth light↔dark swaps as the user scrolls between sections. **Directly reusable technique**, swap terracotta for gold, keep the semantic-slot structure.
- **Hero:** none on this listing page (pure index) — not a hero reference.
- **Motion:** SVG-letter logo stagger-reveal on load (GSAP-timeline-shaped); bottom-sheet menu panel sliding `translateY(100%→0%)` on state toggle (Framer-Motion-shaped); `position: sticky` for a pinned hero-like block — cheaper than a JS-driven pin; fixed floating circular menu-trigger button, rotates 90° on open; `mix-blend-mode: exclusion` on nav text over imagery for automatic legibility (CSS-native, no JS); every animated class has a `prefers-reduced-motion` override — **the strongest accessibility discipline found across all 7 sites, adopt wholesale**.
- **Take:** fluid clamp-based type/spacing scale; semantic color-slot theming for section-to-section transitions; blanket `prefers-reduced-motion` overrides on every animated rule; `position: sticky` as the default pin mechanism before reaching for a JS-driven pin.
- **Reject:** aspect-ratio-agnostic masonry grid (property photography needs dignified, consistent crops — fixed ratios only, see [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md#imagery-rules)); drag-scroll filter-chip rows (reads "tech agency," not real estate); terracotta/blue accent palette (swap for gold/navy).

## 6. locomotive.ca/en

- **Layout:** 12-col desktop → 8-col tablet → 4-col mobile, fluid spacing scale (micro→enormous custom properties) with separate mobile/desktop values.
- **Typography:** `LocomotiveNew` (custom display, headings/nav/CTAs, weights skew light/regular) + `HelveticaNowDisplay` (secondary/UI). Hero type is fully fluid: `7.64vw` desktop down to `40px` mobile — no fixed breakpoint jumps. Line-height very tight (0.85–1.2) on display type, `letter-spacing: 0` explicit.
- **Color:** near-monochrome black/white, dark-mode data-attribute toggle for whole sections. Contrast is dynamic via `mix-blend-mode: difference` rather than a fixed accent — no reusable palette guidance here.
- **Hero:** height `min(100vh, 80vw)` (avoids an overly tall mobile hero — good fluid pattern); background layer parallaxes at a fraction of scroll speed via a JS-driven CSS custom property (`--mapped-progress`); hero text sits at `mix-blend-mode: difference` to auto-invert against video.
- **Motion — confirmed GSAP-heavy (49 GSAP references, Observer, SplitText, ScrollTrigger, Barba.js for page transitions; zero Framer/spring signatures — a pure-GSAP site):** native smooth-scroll engine (Lenis-equivalent lerp/virtual-scroll); scroll-progress-driven parallax (scrubbed); `position: sticky` pinned visual panels for property-gallery-style sections; lerped custom cursor (rAF-based, not spring physics); direction-aware header show/hide (GSAP Observer plugin); two consistent cubic-bezier eases used throughout (`cubic-bezier(.215,.61,.355,1)` general, `cubic-bezier(.23,1,.32,1)` heavier reveals) — a restrained, consistent easing vocabulary worth adopting directly.
- **Navigation:** fixed header, slides off/on by scroll direction.
- **Take:** fluid `clamp()`-based type/spacing throughout; layered smooth-scroll + scrubbed parallax as a signature feel; direction-aware header hide/show; one consistent easing pair reused everywhere instead of ad hoc eases per animation; sticky-panel technique — strong fit for property galleries and floor-plan viewers.
- **Reject:** `mix-blend-mode: difference` as primary nav-contrast mechanism (experimental, hurts legibility — a trust-driven luxury brand needs guaranteed-legible nav, not a blend-mode gamble); monochrome-only palette (gold/navy must stay visible everywhere, not contextual); full page-transition library (Barba.js) and heavy SplitText char-reveals everywhere (agency flourish — reserve char-reveal for hero headline only, skip full AJAX page transitions unless a strong case emerges later).

## 7. makemepulse.com

- **Layout:** bespoke Tailwind-derived grid, `grid-cols-14`/`18` desktop, `max-w-1400` container, asymmetric column spans for editorial, unequal block widths.
- **Typography:** `Beatrice Display` (serif-flavored display, `.font-headline`) + `Biotif` (grotesque sans, body/UI). Hero type fluid via `clamp()`: ~105px–161px scaling with viewport, `-0.01em` tracking at large sizes. Body 18/24px.
- **Color:** ink `#0f0f0f` (near-black, not pure), base `#f2f2f2` (off-white, not pure white) — same "avoid true black/white" pattern as aaronkirman.com and omniyat.com, worth adopting for navy/white too (`navy-90`/`off-white` tokens already specified in [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md)). Two sitewide accents (violet/coral) used sparingly; `theme-light`/`theme-dark` classes toggle per section for an alternating light/dark rhythm.
- **Hero:** full-viewport two-column grid (headline text + video/image block), background pre-marked `gsap-hidden` in server-rendered markup for a JS-driven reveal-on-load.
- **Motion — confirmed GSAP (GreenSock license string in bundle; site is Nuxt/Vue, so Framer Motion is structurally absent):** `gsap-hidden`-class scroll/load reveals; custom cursor with video-play icon swap on hover (GSAP-shaped imperative DOM follow); scroll-aware floating nav offset.
- **Navigation:** fixed header, floats 20px from top on desktop vs. flush on mobile; `theme-light`/`theme-dark` swap as user scrolls under different section backgrounds.
- **Take:** fluid `clamp()` hero type scale with tight tracking; alternating light/dark section rhythm (matches the semantic-slot technique from buildinamsterdam.com); floating/offset nav as a refined alternative to a flush sticky bar; restrained accent-color use validates gold-as-rare-accent again.
- **Reject:** custom video-play cursor (agency flourish, gimmicky for a trust-driven property site); violet/coral accents (clash with gold/navy); dense 14–18-col showreel grid (too portfolio-dense for property pages — fewer, larger, whitespace-heavy blocks read more luxury).

---

## Cross-site synthesis (used to write [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md) and [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md))

**Confirmed independently by 5+ of 7 sites** — treat these as load-bearing, not stylistic preference:
- Serif display + grotesque/geometric sans body pairing.
- Near-black/near-white bases (never pure `#000`/`#fff`) with a single muted accent color used sparingly.
- Small uppercase tracked "eyebrow" labels above every headline.
- Full-bleed hero imagery/video with a legibility scrim or blend technique for the header.
- Fluid, `clamp()`-based type scale over fixed breakpoint jumps.
- Scroll-triggered reveal-on-enter as the baseline interaction (implementation varies: WOW.js, AOS, IntersectionObserver, or GSAP ScrollTrigger — we standardize on GSAP ScrollTrigger, see [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md)).

**GSAP-ScrollTrigger-shaped techniques worth adopting:** scrubbed arch/scale reveal for signature property images (sobharealty.com); scroll-progress parallax on hero background (locomotive.ca); pinned/sticky panels for gallery/floor-plan sections (locomotive.ca, buildinamsterdam.com); one consistent easing pair reused site-wide (locomotive.ca).

**Framer-Motion-shaped techniques worth adopting:** slide-in nav/menu panels with per-item stagger (aaronkirman.com, omniyat.com, buildinamsterdam.com); animated SVG-outline button hover (omniyat.com); card hover/zoom micro-interactions.

**Universally rejected:** custom cursor followers (only locomotive.ca and makemepulse.com use them, both flag it as a flourish, not core UX); blanket image-hover-zoom applied to non-gallery elements; masonry grids for property photography (needs consistent dignified crops, not aspect-ratio chaos); deep multi-level mega-nav (fits large developer portfolios, not a single-brokerage site).
