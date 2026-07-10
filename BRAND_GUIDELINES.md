# Brand Guidelines

## Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Accent — highlight | Gold highlight | `#F5D98B` | Lightest gold; hover glow, subtle gradients, light-on-dark accents |
| Accent — primary | Gold primary | `#C9992E` | The gold. Dividers, icons, active states, key CTAs, eyebrow labels, corner-frame details |
| Accent — shadow/deep | Gold deep | `#8A5A22` | Pressed/active states, gold-on-white contrast edge cases, gradient shadow stop |
| Ink / primary text | Navy | `#14213D` | Body copy, headlines, dark section backgrounds, nav |
| Base / surface | White | `#FFFFFF` | Primary background, negative space |

**Gold is an accent, not a fill.** Every reference site validates this independently — Aaron Kirman's `#9E8B63`, Sobha's `#c8a487`, Omniyat's `#a18a6b` are all muted, minority-use golds against near-monochrome bases (see [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md)). Use gold for: thin dividers, icon strokes, corner-frame button details, hover underlines, eyebrow-label color, active nav indicator, small emphasis. Never use gold as a large background fill, a body-text color, or a dominant hero-section color — it reads cheap at scale and every reference site avoids it.

### Derived neutrals (define as tokens, not ad hoc)

Real-estate photography needs a neutral scale to sit next to without competing:

| Token | Approx. hex | Usage |
|---|---|---|
| `navy-90` | `#1C2B4D` | Slightly lighter navy for large dark sections (pure `#14213D` at full-bleed can feel flat) |
| `ink-muted` | `#4A5468` | Secondary/muted text on white |
| `grey-border` | `#D8D9DE` | Hairline dividers, card borders |
| `off-white` | `#FAF9F6` | Alternate section background (warmer than pure white, matches reference sites' `#FAFAFA`/`#F2EFE6` pattern) |

Derive further tints/shades from navy and gold via consistent HSL lightness steps rather than picking arbitrary greys — keeps the palette coherent.

## Typography direction

Serif display + grotesque sans body is the pattern across every reference site (Didot/Chronicle/Optima/Reckless + Gilroy/Ringside/Graphik/Everett). For Global Landmark:

- **Display/headline face:** a refined serif (Didot-, Chronicle-, or Canela-adjacent) for H1/H2 and hero type. Carries the "landmark/gravitas" read.
- **Body/UI face:** a geometric or grotesque sans for body copy, nav, buttons, labels — legibility and modernity contrast against the serif.
- **Eyebrow/label pattern:** small uppercase sans, letter-spacing 1.5–4px, 11–14px, weight 400–500 — used above every headline across all 7 references. Adopt as a signature Global Landmark micro-pattern.
- Full type scale, weights, and line-heights are specified in [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md#typography-scale). Exact font family is an **open decision** — see [TASKS.md](TASKS.md).

## Logo usage

- Logo is full-color (gold gradient mark + navy wordmark) on white/light backgrounds by default.
- On dark navy or photography-heavy sections, use a light/white variant of the wordmark with the gold mark unchanged (gold reads on both light and dark — confirmed pattern from Aaron Kirman's `--dark`/`--light` logo variants).
- Maintain clear space around the mark equal to the height of the "G" in "GLOBAL." Never crop the ring or compress the skyscraper cluster.
- Minimum size: mark must stay legible at 32px height (favicon/mobile nav) — simplify to mark-only (no wordmark) below that.
- Do not recolor the gold mark for hover/active states; recolor surrounding UI instead.

## Voice & tone

Refined, confident, understated luxury — never salesy, never exclamatory.

- **Do:** declarative sentences, specific detail (address, square footage, provenance) over adjectives; confidence without hype ("A landmark on the coastline" not "Amazing luxury dream home!!").
- **Don't:** exclamation points, ALL CAPS for emphasis (reserve caps for tracked eyebrow labels only, which is a typographic device, not shouting), stock real-estate clichés ("won't last long," "must see"), emoji.
- Headlines are short and declarative. Body copy is informative, not persuasive-pushy — let the imagery and stats persuade.
- CTAs are calm and specific: "Request a Private Viewing," "Speak with an Agent," "Request a Valuation" — not "Buy Now" or "Click Here."
