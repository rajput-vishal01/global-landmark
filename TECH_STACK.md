# Tech Stack

## Next.js setup

**App Router.** Already scaffolded (`app/layout.tsx`, `app/page.tsx`) — no Pages Router in this repo, don't introduce one. Next.js **16.2.10**, React **19.2.4**.

Breaking changes from older Next.js knowledge, confirmed in `node_modules/next/dist/docs/`:
- **`middleware.ts` is now `proxy.ts`.** Same functionality, new file name/export (`export function proxy(request)` or default export), lives at project root. Use for auth redirects, A/B rewrites, header injection — not for slow data fetching or full session management.
- Routing files (`layout`, `page`, `loading`, `error`, `not-found`, `route`, `template`, `default`) and dynamic segments (`[slug]`, `[...slug]`, `[[...slug]]`) work as expected.
- Route groups `(group)` for organizing without affecting URL (e.g. `(marketing)`) and private folders `_folder` for non-routable colocated code.
- `next/font/google` and `next/font/local` for self-hosted, zero-layout-shift fonts — set on `<html className={font.className}>` in the root layout. Use this for both the display serif and body sans once selected (see [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md#typography-scale)).
- Before writing any route/layout/data-fetching code later, check the relevant doc under `node_modules/next/dist/docs/01-app/` — do not assume App Router behavior from pre-16 training data (per [AGENTS.md](AGENTS.md)).

## Styling approach

**Tailwind CSS v4**, already installed (`@tailwindcss/postcss`, `postcss.config.mjs`) — this decision is made by the scaffold, not open. Use Tailwind's CSS-based theme config (`@theme` in `globals.css`, v4-style) to define the design tokens from [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) and [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md) as first-class Tailwind theme values — colors (`navy`, `navy-90`, `gold`, `gold-highlight`, `gold-deep`, `off-white`, etc.), fluid spacing scale, fluid type scale — rather than hardcoding hex/px values in components.

No component library decided yet. Recommendation: hand-build components against Tailwind + the token system rather than pulling in shadcn/ui or similar — a luxury editorial site's visual signature (asymmetric layouts, custom motion, non-standard hover states) doesn't benefit from a general-purpose component kit, and ponytail's ladder says don't add a dependency a few lines of Tailwind can replace. Revisit only if a specific need arises (e.g. a date picker for a booking form).

## GSAP + Framer Motion integration

- `npm install gsap @gsap/react framer-motion` when code phase begins.
- GSAP: use the `useGSAP()` hook from `@gsap/react` (never raw `useEffect` for GSAP setup) — register `gsap.registerPlugin(useGSAP, ScrollTrigger, ...)` once, at app entry (e.g. a client-only `lib/gsap.ts` imported where needed). All GSAP code is client-only — never called during SSR.
- Framer Motion: standard `motion.*` components and hooks, used inside client components (`"use client"`) only. Server Components stay animation-free by default; a page is a Server Component unless it needs client interactivity.
- Both libraries coexist per the division of labor in [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md#division-of-labor) — do not duplicate the same interaction in both.

## Folder structure

Split-by-feature inside `app/`, project files colocated with routes where route-specific, shared code in root-level folders — matches the Next.js–recommended "store project files outside `app`, keep `app` for routing" strategy for shared code, with colocation (`_components`, `_lib`) for route-specific code:

```
app/
  (marketing)/                 route group — no URL segment
    page.tsx                   home
    properties/
      page.tsx                 listings
      [slug]/page.tsx          property detail
    communities/
      page.tsx
      [slug]/page.tsx
    about/page.tsx
    agents/
      page.tsx
      [slug]/page.tsx
    services/
      buy/page.tsx
      sell/page.tsx
      invest/page.tsx
    journal/
      page.tsx
      [slug]/page.tsx
    contact/page.tsx
    list-with-us/page.tsx
  layout.tsx                   root layout — fonts, global nav/footer
  globals.css                  Tailwind theme tokens (@theme block)
components/
  ui/                          primitive building blocks (Button, Badge, EyebrowLabel...)
  sections/                    section-level composites (Hero, CredibilityBand, CTABand...)
  listing/                     listing-grid, property-card, filter-bar
  gallery/                     lightbox, image-reveal, gallery-grid
lib/
  gsap.ts                      GSAP plugin registration, shared eases/timing constants
  motion.ts                    Framer Motion variants shared across components
  content/                     content-model types, fetch/query helpers (see CONTENT_MODEL.md)
public/
  fonts/                       local font files if not using next/font/google
proxy.ts                       (if/when needed — auth redirects etc.)
```

`components/ui` vs `components/sections` split matches ponytail's "no unrequested abstraction" — primitives stay dumb and reusable, section composites are the ones that actually encode design-language decisions (spacing, motion sequencing).

## Ponytail conventions

Locked in for all future code in this repo, per [CLAUDE.md](CLAUDE.md#skills-to-use-going-forward):

- **Ladder before writing anything:** does it need to exist → reuse what's already in the codebase → native platform/CSS → already-installed dependency → one line → minimum code. No new dependency when Tailwind/CSS/native HTML covers it (e.g. `<dialog>` or native `<details>` before a modal library, where suitable).
- **No speculative abstraction.** No prop for a variant that doesn't exist yet, no config object for a value that never changes, no `Card` component generalized for 4 use cases when 2 exist.
- **Shortest working diff wins**, but only once the problem (design intent from [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md), motion spec from [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md)) is actually understood — read the relevant doc before writing the component.
- **`// ponytail:` comments** for deliberate shortcuts with a named ceiling (e.g. hardcoded 3 featured listings until a CMS query exists — comment names the ceiling and the upgrade trigger).
- **One runnable check per non-trivial piece of logic** (filter/sort logic, content-model parsing, form validation) — no test framework/fixtures unless the project later adopts one.
- Default to Server Components; add `"use client"` only where interactivity/animation genuinely requires it (forms, GSAP/Framer-driven components, filter state).
