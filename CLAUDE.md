@AGENTS.md

# Global Landmark Realty Group — Master Context

Luxury real-estate marketing site. Read this first; it links every other doc.

## Phase discipline

This repo is in **context-building phase** until told otherwise. Rules:
- No app code, no scaffolding beyond what already exists (`app/layout.tsx`, `app/page.tsx`).
- Every future coding session starts by reading this file + the linked docs below.
- Next.js in this repo is v16 (App Router, `proxy.ts` not `middleware.ts` — see [TECH_STACK.md](TECH_STACK.md)). Check `node_modules/next/dist/docs/` for anything that looks unfamiliar before writing code — do not assume prior Next.js training data holds.

## Docs index

| Doc | Contents |
|---|---|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | What we're building, audience, goals, success criteria |
| [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) | Palette, typography direction, logo usage, voice & tone |
| [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md) | Synthesized aesthetic — principles, spacing, layout system, section patterns |
| [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) | Per-site breakdown of the 7 reference sites — what we take, what we reject |
| [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md) | GSAP + Framer Motion patterns, scroll-animation catalogue, perf/a11y rules |
| [TECH_STACK.md](TECH_STACK.md) | Next.js setup, styling approach, folder structure, ponytail code conventions |
| [SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md) | Sitemap + routes |
| [COMPONENT_INVENTORY.md](COMPONENT_INVENTORY.md) | Components implied by architecture + design language |
| [CONTENT_MODEL.md](CONTENT_MODEL.md) | Data shape — listings, agents, communities |
| [TASKS.md](TASKS.md) | Phased build roadmap |

## Skills to use going forward

- **ponytail** (full) — lazy-but-correct code. Conventions locked in [TECH_STACK.md](TECH_STACK.md#ponytail-conventions).
- **caveman** — terse responses, every session.
- **gsap-core / gsap-scrolltrigger / gsap-timeline / gsap-react / gsap-performance / gsap-plugins** — scroll timelines, pinning, parallax, SplitText reveals. See [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md).
- Framer Motion — component enter/exit, layout animation, hover/tap micro-interactions. No dedicated skill installed; follow official Framer Motion docs + patterns in [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md).

## Palette (full detail in BRAND_GUIDELINES.md)

| Role | Hex |
|---|---|
| Gold highlight | `#F5D98B` |
| Gold primary (accent) | `#C9992E` |
| Gold deep (shadow) | `#8A5A22` |
| Navy (ink) | `#14213D` |
| White (base) | `#FFFFFF` |

Gold is an accent — dividers, hover, emphasis — never a fill. Navy carries text and dark sections. White/space carries the luxury feel.

**Dark mode: undecided.** Logged as a maybe in [TASKS.md](TASKS.md). Do not build or assume it.
