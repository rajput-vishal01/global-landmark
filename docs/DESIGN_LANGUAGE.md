# Design Language

Distilled aesthetic system for Global Landmark Realty Group. Synthesized from [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) — this doc is the "what to build," references doc is the "why/where it came from."

## Principles

1. **Photography leads, typography frames.** On signature property shots, imagery is the hero — type stays small and out of the way (big.dk). On brand/editorial moments (homepage hero, about), large serif display type carries gravitas (aaronkirman.com, omniyat.com, makemepulse.com).
2. **Near-black, near-white, never pure.** Every reference site avoids `#000`/`#fff` as literal values. Use `navy-90` (`#1C2B4D`) and `off-white` (`#FAF9F6`) as the working ink/base, reserving true `#14213D`/`#FFFFFF` for the most saturated moments (logo, primary CTA).
3. **Gold is punctuation, not paragraph.** Dividers, icon strokes, eyebrow-label color, hover states, corner-frame details, active indicators. Never a section background, never body text, never more than ~10% of any viewport's visual weight.
4. **Restraint over density.** Fewer, larger, whitespace-heavy blocks beat dense grids (rejected pattern: makemepulse.com's 14–18-col showreel grid). Real estate sells on the property, not on how much fits per screen.
5. **Motion confirms hierarchy, it doesn't create it.** Every scroll reveal, hover, and transition should reinforce what's already visually primary — never used to disguise a weak layout.

## Spacing scale

Fluid, `clamp()`-based — confirmed pattern across locomotive.ca, buildinamsterdam.com, makemepulse.com. Define as CSS custom properties / Tailwind theme extension, not fixed px per breakpoint:

| Token | Range (mobile → desktop) | Usage |
|---|---|---|
| `space-3xs` | 4px → 6px | icon gaps, tight inline spacing |
| `space-2xs` | 8px → 12px | label-to-value gaps |
| `space-xs` | 12px → 20px | card internal padding (tight) |
| `space-sm` | 20px → 32px | card internal padding, form field gaps |
| `space-md` | 32px → 56px | component-to-component gaps |
| `space-lg` | 56px → 96px | section-internal rhythm (heading to content) |
| `space-xl` | 96px → 160px | section-to-section gap |
| `space-2xl` | 160px → 240px | hero-to-first-section, major editorial breaks |

Implement with CSS `clamp(min, vw-based-preferred, max)` per token so spacing scales continuously rather than jumping at breakpoints.

## Typography scale

Display serif for H1/H2/hero, grotesque sans for everything else (body, UI, nav, buttons). Fluid via `clamp()`.

| Level | Size range | Line-height | Tracking | Weight |
|---|---|---|---|---|
| Eyebrow label | 11px → 14px | 1.2 | +0.15em–0.25em, uppercase | 500 |
| H1 / Hero | 42px → 96px | 1.05–1.15 | -0.01em | 400 (serif) |
| H2 | 32px → 56px | 1.1–1.2 | normal | 400 (serif) |
| H3 | 24px → 36px | 1.2 | normal | 400–500 (serif or sans) |
| H4 | 18px → 24px | 1.3 | normal | 500 (sans) |
| Body | 16px → 18px | 1.5–1.7 | normal | 400 (sans) |
| Small / meta | 13px → 14px | 1.4 | normal | 400 (sans) |
| Button / nav label | 13px → 15px | 1 | +0.05em–0.1em, uppercase for buttons | 500 |

Exact font family selection is an **open decision** — logged in [TASKS.md](TASKS.md). Candidates to evaluate: a Didot/Canela-class serif for display, a Graphik/Söhne-class grotesque for body — matching the register found across the reference sites without directly copying any single licensed face.

## Color usage by context

- **Light section (default):** `off-white`/`white` background, `navy`/`navy-90` text, gold only in labels/dividers/hover.
- **Dark section (hero, footer, feature moments):** `navy`/`navy-90` background, `white`/`off-white` text, gold accent unchanged (gold reads on both — confirmed across all references).
- **Photography-heavy section:** scrim or gradient overlay for text legibility over images — never `mix-blend-mode: difference` as the primary contrast mechanism (locomotive.ca uses it and it's flagged as a legibility risk; use a translucent navy scrim instead, as omniyat.com and sobharealty.com do).
- **Section-to-section transitions:** consider the semantic color-slot technique from buildinamsterdam.com — a small set of CSS custom properties (`--section-bg`, `--section-fg`, `--section-accent`) reassigned per section and transitioned (0.3–0.5s) as the user scrolls between them, rather than a hard cut.

## Layout system

- Base grid: 12 columns desktop, 8 tablet, 4 mobile (locomotive.ca pattern) with fluid gutters (`space-sm`–`space-md`).
- Container max-width: ~1440–1600px for full-bleed sections, ~1100–1200px for reading-width content (bio, journal articles) — mirrors sobharealty.com's dual-container approach (1600px wide / 1009px narrow).
- Property spec sheets: fixed-width metadata sidebar (price/beds/baths/sqft/status) beside full-bleed photography, per big.dk's pattern — this is the primary property-detail layout.
- Section pacing: hero → credibility (stats/press) → primary content → secondary content → CTA band → footer. Every major page follows this rhythm; see [SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md) for per-page detail.

## Section patterns

- **Hero:** full-bleed image or muted looped video, centered or left-aligned serif headline, eyebrow label above, one or two calm CTAs, scroll-cue indicator. Header nav transparent-over-hero with a scrim, swaps to solid on scroll past hero.
- **Credibility band:** stats (years, sales volume, properties sold) or auto-scrolling press-logo marquee — directly after hero, establishes trust before any pitch.
- **Listing grid:** real CSS grid (not slider-only) with fixed-aspect-ratio cards (4:5 or 3:2 — never masonry, per the rejected pattern from buildinamsterdam.com). Hover: subtle image zoom (`scale(1.04–1.08)`, not `1.2` — reserve stronger zoom for lightbox/gallery only).
- **Signature reveal:** one scrubbed arch-or-mask image reveal per major page (property detail, community page) — sobharealty.com's technique, used sparingly as a moment, not a default.
- **Agent/testimonial:** portrait + quote, minimal chrome, gold hairline divider.
- **CTA band:** full-bleed navy section, centered serif headline, one primary CTA — used before the footer on every page.
- **Footer:** navy background, structured columns (nav, offices/contact, social, legal), gold hairline dividers between columns.

## Imagery rules

- **Fixed aspect ratios only** for listing/gallery grids — 4:5 (portrait, primary) or 3:2 (landscape, secondary). No masonry/aspect-ratio-agnostic grids (rejected: buildinamsterdam.com's approach — great for an agency portfolio, wrong for property photography, which needs dignified consistent crops).
- Art-directed desktop/mobile image pairs for hero and major feature moments, not just responsive resizing (omniyat.com pattern) — commission or crop separately for portrait mobile vs. landscape desktop.
- Hover zoom on gallery/listing images only, capped at `scale(1.04–1.08)` over 0.6–0.8s ease — never applied to icons, logos, or UI chrome (rejected pattern from sobharealty.com's blanket `img:hover{scale(1.2)}`).
- Serve via Next.js `<Image>` with responsive `sizes`, lazy-load below the fold, eager + high fetch-priority for the LCP hero image only.
- Video hero: muted, looped, `playsinline`, poster image fallback, capped file size/bitrate — never autoplay with sound, never block LCP on video load (see [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md#performance-rules)).
