@AGENTS.md

# Global Landmark Realty Group — Master Context

Luxury real-estate marketing site. Read this first; it links every other doc.

## Phase discipline

This repo is in **build phase** (context-building ended; landing page, subpages, the July 2026 feature expansion — DB, admin panel at /admin, live listings, news — and the Aug–Sep 2026 rounds — CFF property form, projects, CRM, redesigned detail page — are shipped and live at https://globallandmarkrealty.com; see [README.md](README.md) and [TASKS.md](docs/TASKS.md)). Rules:
- Every coding session starts by reading this file + the linked docs below.
- Next.js in this repo is v16 (App Router, `proxy.ts` not `middleware.ts` — see [TECH_STACK.md](docs/TECH_STACK.md)). Check `node_modules/next/dist/docs/` for anything that looks unfamiliar before writing code — do not assume prior Next.js training data holds.

## Docs index

| Doc | Contents |
|---|---|
| [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | What we're building, audience, goals, success criteria |
| [BRAND_GUIDELINES.md](docs/BRAND_GUIDELINES.md) | Palette, typography direction, logo usage, voice & tone |
| [DESIGN_LANGUAGE.md](docs/DESIGN_LANGUAGE.md) | Synthesized aesthetic — principles, spacing, layout system, section patterns |
| [DESIGN_REFERENCES.md](docs/DESIGN_REFERENCES.md) | Per-site breakdown of the 7 reference sites — what we take, what we reject |
| [ANIMATION_GUIDELINES.md](docs/ANIMATION_GUIDELINES.md) | GSAP + Framer Motion patterns, scroll-animation catalogue, perf/a11y rules |
| [TECH_STACK.md](docs/TECH_STACK.md) | Next.js setup, styling approach, folder structure, images, SEO, email, production deploy, ponytail code conventions |
| [SITE_ARCHITECTURE.md](docs/SITE_ARCHITECTURE.md) | Sitemap + routes |
| [COMPONENT_INVENTORY.md](docs/COMPONENT_INVENTORY.md) | Components implied by architecture + design language (design-time plan) |
| [CONTENT_MODEL.md](docs/CONTENT_MODEL.md) | Data shape — the live listing/project model, plus the design-time shapes |
| [ADMIN_DESK.md](docs/ADMIN_DESK.md) | Admin panel UI contract and its current screens |
| [TASKS.md](docs/TASKS.md) | Phased build roadmap, and what has shipped |
| [REQUIREMENTS_V2.md](docs/REQUIREMENTS_V2.md) | **Current scope** — CFF field form + Aug 2026 client update round, full requirement register and build prompt |
| [handout.md](docs/handout.md) | Context transfer — what is built, what re-breaks easily, what waits on the client |
| [CLIENT_DETAILS_NEEDED.md](docs/CLIENT_DETAILS_NEEDED.md) | Udyam-certificate identity the site publishes (Meta verification), and what is still outstanding |
| [CLIENT_HANDOVER_MESSAGE.md](docs/CLIENT_HANDOVER_MESSAGE.md) | The message to the client: site, admin, demo data, what we need from them |
| [scripts/seed-demo/README.md](scripts/seed-demo/README.md) | Demo data seed — commands, how demo rows are recognised, `--remove` |

## Skills to use going forward

- **ponytail** (full) — lazy-but-correct code. Conventions locked in [TECH_STACK.md](docs/TECH_STACK.md#ponytail-conventions).
- **caveman** — terse responses, every session.
- **gsap-core / gsap-scrolltrigger / gsap-timeline / gsap-react / gsap-performance / gsap-plugins** — scroll timelines, pinning, parallax, SplitText reveals. See [ANIMATION_GUIDELINES.md](docs/ANIMATION_GUIDELINES.md).
- Framer Motion — component enter/exit, layout animation, hover/tap micro-interactions. No dedicated skill installed; follow official Framer Motion docs + patterns in [ANIMATION_GUIDELINES.md](docs/ANIMATION_GUIDELINES.md).

## Palette (full detail in BRAND_GUIDELINES.md)

| Role | Hex |
|---|---|
| Gold highlight | `#F5D98B` |
| Gold primary (accent) | `#C9992E` |
| Gold deep (shadow) | `#8A5A22` |
| Navy (ink) | `#14213D` |
| White (base) | `#FFFFFF` |

Gold is an accent — dividers, hover, emphasis — never a fill. Navy carries text and dark sections. White/space carries the luxury feel.

These are the brand (logo) colours. The site's UI tokens were warmed in the Sep 2026 redesign and live in the `@theme` block of `app/globals.css`: ink `#1d1a16`, a warm graphite `navy` `#332e28` for dark bands, cream/ivory grounds, and a yellow `cta` fill. The admin pins its own neutral palette (`.admin-root`).

**Dark mode: undecided.** Logged as a maybe in [TASKS.md](docs/TASKS.md). Do not build or assume it.
