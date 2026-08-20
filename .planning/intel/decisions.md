# Decisions

Synthesized from classified ADR-type docs, plus the explicit supersession decisions
declared by the precedence-0 SPEC (`docs/REQUIREMENTS_V2.md` §3.1 "Decisions this
round supersedes" and §4 "Cross-cutting architecture decisions").

Routing note: `docs/TECH_STACK.md` is the only doc classified `type: ADR`
(manifest override; classifier recorded `locked: false` because the doc carries no
`Status: Accepted` field). All entries below are therefore `status: proposed` even
where the source doc uses the word "locked" in its own prose — that prose is
reproduced in the `decision:` line rather than promoted to a locked status.

---

## ADR: Next.js 16 App Router, React 19, `proxy.ts` not `middleware.ts`
- source: docs/TECH_STACK.md
- status: proposed
- decision: App Router only, already scaffolded — no Pages Router is to be introduced. Next.js 16.2.10, React 19.2.4. `middleware.ts` is renamed `proxy.ts` (root-level, `export function proxy(request)` or default export), used for auth redirects, A/B rewrites and header injection — not slow data fetching or full session management. Before writing any route/layout/data-fetching code, check `node_modules/next/dist/docs/01-app/` rather than assuming pre-16 App Router behaviour.
- scope: framework, routing, App Router, proxy.ts, Next.js version

## ADR: Tailwind CSS v4 with CSS-based `@theme` token config
- source: docs/TECH_STACK.md
- status: proposed
- decision: Tailwind v4 is already installed (`@tailwindcss/postcss`, `postcss.config.mjs`); the doc states "this decision is made by the scaffold, not open". Design tokens from BRAND_GUIDELINES.md and DESIGN_LANGUAGE.md are defined as first-class Tailwind theme values in an `@theme` block in `globals.css` (colors `navy`, `navy-90`, `gold`, `gold-highlight`, `gold-deep`, `off-white`; fluid spacing scale; fluid type scale) rather than hardcoded hex/px in components.
- scope: styling, design tokens, Tailwind v4, globals.css

## ADR: No component library — hand-build against Tailwind + tokens
- source: docs/TECH_STACK.md
- status: proposed
- decision: Component library is explicitly undecided. Recommendation recorded in the doc is to hand-build components against Tailwind + the token system rather than adopting shadcn/ui or similar, because a luxury editorial site's visual signature (asymmetric layouts, custom motion, non-standard hover states) does not benefit from a general-purpose kit, and the ponytail ladder says not to add a dependency a few lines of Tailwind can replace. Revisit only if a specific need arises (e.g. a date picker for a booking form).
- scope: component library, dependency policy

## ADR: GSAP via `useGSAP()`, Framer Motion in client components only
- source: docs/TECH_STACK.md
- status: proposed
- decision: Use the `useGSAP()` hook from `@gsap/react` — never raw `useEffect` for GSAP setup. Register plugins once at app entry via a client-only `lib/gsap.ts`. All GSAP code is client-only, never called during SSR. Framer Motion uses standard `motion.*` components and hooks inside `"use client"` components only; Server Components stay animation-free by default. The two libraries must not duplicate the same interaction on the same element.
- scope: GSAP, @gsap/react, Framer Motion, client/server boundary

## ADR: Split-by-feature folder structure, shared code outside `app/`
- source: docs/TECH_STACK.md
- status: proposed
- decision: Split-by-feature inside `app/`, route-specific files colocated (`_components`, `_lib`), shared code in root-level `components/` (with `ui/` primitives vs `sections/` composites), `lib/`, `public/`. The doc's structure diagram names an `app/(marketing)/` route group — see INGEST-CONFLICTS.md INFO entry; the shipped code and the precedence-0 SPEC both use `(site)`.
- scope: folder structure, route groups, components/ui vs components/sections

## ADR: Ponytail conventions locked for all repo code
- source: docs/TECH_STACK.md
- status: proposed
- decision: The doc states these are "locked in for all future code in this repo". Run the ladder before writing anything (needs to exist → reuse what's in the codebase → native platform/CSS → installed dependency → one line → minimum code). No speculative abstraction. Shortest working diff wins, but only after the design intent is understood. `// ponytail:` comments for deliberate shortcuts with a named ceiling. One runnable check per non-trivial piece of logic, no test framework. Default to Server Components; add `"use client"` only where interactivity or animation genuinely requires it.
- scope: code conventions, ponytail ladder, Server Components default, runnable checks

---

# Supersession decisions declared by the SPEC (precedence 0)

These are recorded here, not only in `constraints.md`, because `docs/REQUIREMENTS_V2.md`
§3.1 is titled "Decisions this round supersedes" and functions as a decision record
that overrides earlier positions. Source is a SPEC, not an ADR; none is locked.

## SPEC-3.1-a: Price is captured in full; public display is flag-gated
- source: docs/REQUIREMENTS_V2.md §3.1, §4.1, R-13
- status: proposed
- decision: Supersedes "No price by design — deals close over calls" as written in `lib/db/schema.ts`, `docs/CONTENT_MODEL.md` and `PROPERTY_DETAIL.sidebarNote`. Full price and all charges (CFF §6) are captured. Public display is gated by a per-property `showPricePublicly` flag defaulting to `false`, so the default public rendering remains "Price on request" and current brand copy is preserved. Circle rate is internal only under every configuration. The schema comment, the doc and the sidebar copy are all to be updated.
- scope: pricing, showPricePublicly, public/internal boundary, CONTENT_MODEL.md supersession

## SPEC-3.1-b: Collection axis added orthogonal to the four categories
- source: docs/REQUIREMENTS_V2.md §3.1, R-04, §5.3
- status: proposed
- decision: Supersedes "four categories are the only taxonomy" in `lib/categories.ts`. `sale · purchase · lease · invest` remains true as the *intent* axis. A second, orthogonal **collection** axis is added — Kothi / Plot / Projects / Flats / Land / Commercial — derived from `propertyType` (plus `kind === "project"` for Projects) via one map. Derived, never stored: no new column, no re-tagging. `?group=` composes with `?category=` and every other filter.
- scope: taxonomy, categories, collections, lib/categories.ts

## SPEC-3.1-c: `properties` splits — internal data moves to sibling tables
- source: docs/REQUIREMENTS_V2.md §3.1, §4.1, §5.1, §5.2
- status: proposed
- decision: Supersedes "`properties` is a flat, mostly-public table" in `lib/db/schema.ts`. Public-safe columns stay on `properties`; owner, money, legal and status data move to internal-only sibling tables (`property_internal`, `property_owners`, `property_documents`, `property_charges`, `property_price_history`, `crm_*`). Separation is by table, not by flag — "a public query that never references a table cannot leak it."
- scope: schema, table split, public/internal boundary, lib/db/schema.ts

## SPEC-3.1-d: Single shared admin password becomes insufficient
- source: docs/REQUIREMENTS_V2.md §3.1, R-54
- status: proposed
- decision: Supersedes "admin is one shared password" in `lib/admin/auth.ts`. Once brokerage figures and per-record attribution exist, a shared password cannot support them. Replaced by `admin_users` with roles (owner / manager / agent), per-user login, and an `audit_log` of every create/update/delete/status change/document access. The HMAC cookie mechanism is kept; identity is added to it. Note: R-54 sits in §7 [ADDED] but is marked "**Required**" by the SPEC for R-31 attribution and R-70 DPDP compliance, and §9 schedules it inside P6 — see INGEST-CONFLICTS.md WARNING.
- scope: admin auth, admin_users, roles, audit_log, lib/admin/auth.ts

## SPEC-4.1: The public/internal boundary is the hardest rule in the document
- source: docs/REQUIREMENTS_V2.md §4.1
- status: proposed
- decision: Separate tables, not flags. Explicit Drizzle `columns: {…}` allowlists in every public query — missing allowlist is a bug. Two enforced types: `PublicProperty` (the only shape any `app/(site)/**` component may accept) and `AdminProperty` (full row), so leaks become type errors. Documents are never public URLs — served through an admin-gated route handler calling `requireAdmin()`, never in `sitemap.ts`, JSON-LD or an `<Image>` src. Status governs publication: only `Available` (CONFIRM: possibly also `Reserved`) renders publicly. Mandatory per-phase verification: render a property page, grep the HTML *and* the client JS payload for a known owner phone number, a brokerage figure and a circle rate — zero hits or the phase is not done.
- scope: security, PII, public/internal boundary, column allowlists, document serving

## SPEC-4.2: Schema strategy — columns vs arrays vs JSONB vs sibling tables
- source: docs/REQUIREMENTS_V2.md §4.2
- status: proposed
- decision: ~150 CFF fields must not become 150 columns nor one JSON blob. Real columns for anything filtered, sorted, faceted or shown on a card. `text[]` arrays for flat checklists validated against a taxonomy list (amenities, parking, PLC attributes, documentation, furnishing inventory, legal flags, banks on panel). JSONB only for open-ended admin-authored content. Sibling tables for 1:N or internal data. Every list defined once in `lib/attributes.ts` (or `lib/taxonomy/*.ts` past ~400 lines) and imported by both the admin form and the public renderer; server actions validate against those lists and drop unknown values rather than saving them.
- scope: schema design, taxonomy, lib/attributes.ts

## SPEC-4.3: Real SQL migrations for anything that moves or drops data
- source: docs/REQUIREMENTS_V2.md §4.3
- status: proposed
- decision: `npm run build` runs `drizzle-kit push` via `scripts/migrate.mjs` — acceptable for additive change, dangerous for the table split. Generate real SQL migrations with `drizzle-kit generate` for anything that moves or drops data; keep `push` for purely additive columns. `scripts/seed.mjs` must produce at least one fully-populated example of every new entity.
- scope: migrations, drizzle-kit, seed data

## SPEC-4.4: New public routes must join the existing cache/revalidate pattern
- source: docs/REQUIREMENTS_V2.md §4.4
- status: proposed
- decision: Every new public query joins the existing `unstable_cache` + `site-data` tag pattern wrapped in `failSoft`. Every new admin mutation calls `revalidatePublicSite()`. Every new public route (collections, project pages, builder pages, locality pages) is added to `lib/admin/revalidate.ts` — a stale collection page after a status change is called out as a visible, embarrassing bug.
- scope: caching, revalidation, unstable_cache, site-data tag

## SPEC-4.5: Admin property form is sectioned, conditional and draft-capable
- source: docs/REQUIREMENTS_V2.md §4.5
- status: proposed
- decision: The property form goes from ~15 to ~150 fields and must not ship as one endless page. Sectioned into the CFF's own groups, each collapsible with a filled/total count header. Conditional sections driven by one map keyed on property type (this is R-12, "not a nicety"). Draft publication state — only `published` + `Available` reaches the public site. Existing action shape kept: typed state, validation-first, honest errors, `requireAdmin()` first line, `revalidatePublicSite()` last. Native inputs only — no date picker, form library or state manager. Autosave drafts every ~20s.
- scope: admin form, form ergonomics, draft state, autosave

## SPEC-4.6: New third-party surfaces require paired config updates
- source: docs/REQUIREMENTS_V2.md §4.6
- status: proposed
- decision: Any new image host needs two edits or the site 500s at render — `images.remotePatterns` in `next.config.ts` **and** `IMAGE_HOSTS` in the property server action. Google Maps embeds, virtual tours and drone video hosts need explicit `frame-src` entries in the CSP (currently only YouTube-nocookie and Instagram). Never widen with a wildcard — `/_next/image` becomes an SSRF proxy.
- scope: CSP, image hosts, next.config.ts, SSRF

## SPEC-9: Phased build plan, P0–P9
- source: docs/REQUIREMENTS_V2.md §9
- status: proposed
- decision: Nine phases, each independently shippable, each ending with `npm run lint && npm run build` green plus the §4.1 leak check. P0 Intake (send §11; only R-02/03/06/37/38 block on it) · P1 Taxonomy + schema foundation · P2 Admin property form rebuild (needs P1) · P3 Builders, projects, towers (needs P2) · P4 Public listings rework (needs P2, P3) · P5 Enquiry cart + leads (needs P4) · P6 CRM + brokerage (needs P5) · P7 Landing & brand pass (needs P0 assets) · P8 Growth features [ADDED] (needs P4) · P9 Compliance & hardening (needs all).
- scope: build sequencing, phases, dependencies
