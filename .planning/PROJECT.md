# Global Landmark Realty Group — luxury real-estate site (Tricity, India)

## What This Is

A shipped luxury real-estate marketing site for a Tricity (Chandigarh / Panchkula /
Mohali / Zirakpur) brokerage, now receiving a large client-driven expansion. The
public site sells the brand and converts high-intent visitors into enquiries; the
`/admin` panel behind it is becoming the brokerage's actual operating tool —
~150-field CFF property intake, builder/project/tower inventory, a lead inbox, and
a CRM with brokerage tracking. Audience is two-sided: HNW buyers, sellers and
investors on the public side; Ashu Goyal, Divya Goyal and their staff on the
internal side.

This is a **brownfield** round. The landing page, subpages, database, admin panel,
live listings and news feed are already live. The scope contract for this round is
[`docs/REQUIREMENTS_V2.md`](../docs/REQUIREMENTS_V2.md) (the SPEC), which supersedes
the older `docs/*.md` context set wherever they disagree.

## Core Value

Owner phone numbers, brokerage figures, circle rates and legal documents never
reach a public page or a client JS bundle — while every one of the ~150 CFF fields
is still storable, editable and either rendered publicly or explicitly marked
internal.

Everything else on this site can be rebuilt. A single leak of that data is, in the
SPEC's own words, "a project-ending defect."

## Business Context

- **Customer**: Global Landmark Realty Group — a Tricity brokerage. Public visitors
  are HNW buyers, sellers, investors and referring agents; internal users are the
  two principals plus staff.
- **Revenue model**: brokerage commission on transactions the site sources and the
  CRM tracks. The site is the top of that funnel and, after this round, also its
  ledger.
- **Success metric** (developer-facing, verbatim from the SPEC): the section 10
  coverage checklist comes back fully ticked, AND the section 4.1 leak check
  passes — render a property page, grep the served HTML and the client JS payload
  for a known owner phone number, a brokerage figure and a circle rate, zero hits —
  AND `npm run lint && npm run build` is green. Partial delivery is failure.
- **Strategy notes**: [`docs/REQUIREMENTS_V2.md`](../docs/REQUIREMENTS_V2.md)
  (scope contract), [`docs/PROJECT_OVERVIEW.md`](../docs/PROJECT_OVERVIEW.md)
  (brand positioning).

## Requirements

Full register with IDs and traceability: [`.planning/REQUIREMENTS.md`](REQUIREMENTS.md).

### Validated

Shipped and in production before this round. Frozen unless a requirement names them
(SPEC §1: "Existing behaviour not mentioned here stays exactly as it is").

- ✓ Public routes `/`, `/about`, `/properties`, `/properties/[slug]`, `/news`,
  `/contact` under the `(site)` route group — July 2026
- ✓ `/admin` panel behind an HMAC cookie, triple-checked (`proxy.ts` → panel layout →
  `requireAdmin()` in every action); CRUD for properties, projects, Deal of the Week,
  testimonial videos — July 2026
- ✓ Postgres + Drizzle with a fail-soft + `unstable_cache` public read layer tagged
  `site-data`, and `revalidatePublicSite()` on every admin mutation — July 2026
- ✓ Cloudinary signed direct-browser upload with cascade delete of remote assets —
  July 2026
- ✓ GSAP ScrollTrigger reveal engine + Lenis, Framer Motion under `LazyMotion strict` —
  July 2026
- ✓ CSP + security headers, in-memory rate limiting, honeypot, JSON-LD escaping,
  image host allowlist — July 2026

### Active

The 38 client-originated requirements in SPEC §6 (R-01 … R-38), of which 36 carry a
full Need / Build / Done-when block and 2 (R-37, R-38) do not — see Open Item 1.
Plus 2 repo-originated gap items that the approved scope cannot hold without.

- [ ] **Group A — public site & brand** (R-01 … R-09): hero category boxes, real
      credibility figures, imagery pass, six-collection axis, card redesign +
      enquiry cart, footer contact truth, internal ref code / dates / source /
      status, location tabs, configuration tabs
- [ ] **Group B — property data model, the CFF** (R-10 … R-25): 26 property types,
      four area measures + seven units + PLC, tower inventory, price and all
      charges, rooms, internal ownership block, furnishing, facing, possession,
      age, loan, legal, amenities, parking, documentation checklist, specifications
- [ ] **Group C — builder, project, pitch** (R-26, R-27): `builders` table + linkage
      + admin pitch view; public `/projects/[slug]`
- [ ] **Group D — media and documents** (R-28, R-29): categorised gallery + link
      media; internal-only legal document vault behind an admin-gated stream route
- [ ] **Group E — leads** (R-32): every enquiry persists a `leads` row before mail
      is sent
- [ ] **Group F — CRM and brokerage** (R-30, R-31): clients, deals, activities,
      pipeline; brokerage percent / amount / shared / paid / pending, internal only
- [ ] **Group G — admin panel** (R-33 … R-36): navigation IA, property list at
      scale, dashboard, settings page
- [ ] **Client update deliverables** (R-37, R-38): office and team photos, first
      live listings — **specification incomplete**, see Open Item 1
- [ ] **Gap items** (GAP-01, GAP-02): repo-originated, not client scope, but the
      approved scope breaks without them — see REQUIREMENTS.md

### Out of Scope

- **SPEC §7 in its entirety (R-39 … R-90, 52 items)** — the SPEC states these are
  "ours, not the client's… Get a yes before building." Treated as **proposed, not
  approved**. Tracked as v2 in REQUIREMENTS.md; scheduled only behind an explicit
  approval gate in Phases 6, 8 and 9. See Open Item 2.
- **Public/buyer accounts and auth** — R-05 restates "no accounts — auth is out of
  scope"; the shortlist lives in `localStorage`.
- **MLS / IDX live sync** — carried forward from `PROJECT_OVERVIEW.md`, untouched by
  the SPEC.
- **Multi-language i18n** — carried forward, untouched by the SPEC.
- **Dark mode** — still undecided per `CLAUDE.md`; do not build or assume it.
- **Landing-page redesign, motion-system redesign, brand-token redesign** — SPEC §8
  freezes all three. R-01/R-02/R-03/R-06 change content and one component's
  styling, not the system.
- **Component library, form library, state manager, date picker, second ORM** —
  SPEC §8 guardrail. Native HTML + Tailwind + Drizzle.
- **GSAP or scroll animation inside the admin panel** — SPEC §8 guardrail; the admin
  is a tool.

## Context

**The codebase map is truth for current code, not `docs/TECH_STACK.md`.** Three
specific corrections, each verified against the repo on 2026-08-20:

1. **Tailwind `@theme` tokens.** The real tokens in `app/globals.css` are colours
   `ink` `ink-muted` `dark` `dark-deep` `gold` `gold-highlight` `gold-deep` `cream`
   `border` `error`, plus a fluid type scale `text-eyebrow` / `text-body` /
   `text-meta` / `text-h1` … `text-h4`. TECH_STACK.md's `navy` / `navy-90` /
   `off-white` names are **stale** — navy exists only inside the logo asset, not in
   the UI. There are **no custom spacing tokens**; spacing uses Tailwind's default
   scale, not the `space-3xs … space-2xl` clamp scale described in
   `DESIGN_LANGUAGE.md`.
2. **Framer Motion.** Used as `m.*` under `LazyMotion strict` via
   `components/MotionProvider.tsx` — **not** `motion.*`. Writing `motion.*` pulls
   the full bundle and defeats the provider. TECH_STACK.md is stale here too.
3. **Route group.** The shipped group is `app/(site)/`, **not** `(marketing)`.
   TECH_STACK.md's folder diagram and SITE_ARCHITECTURE.md's table text both say
   `(marketing)`; both are stale. Corrected during the Phase 9 doc-sync task.

**Current-code risk carried into this round** (from `.planning/codebase/CONCERNS.md`,
audited 2026-08-20 — 3 CRITICAL, 6 HIGH, 7 MEDIUM, 2 LOW):

- Every public query in `lib/db/queries.ts` uses `db.query.properties.findMany()` /
  `findFirst()` with `with: { project: true }` and **no `columns:` allowlist**. The
  code is already the exact shape that leaks the moment internal CFF columns land.
- `scripts/migrate.mjs` runs `npx drizzle-kit push --force` unconditionally on every
  build with `DATABASE_URL` set, and no `drizzle/` migration history exists. The §5.1
  table split is precisely the change class this destroys data on.
- `SocialProofTicker` fabricates visitor activity from random name/event pools and
  presents it as real — a live production compliance risk today, flagged by R-74 as
  a client decision.
- `lib/admin/auth.ts` issues a stateless HMAC token encoding only an expiry. No
  admin action can be attributed to a person, which blocks R-31 as designed.

**Intel set** (produced by `/gsd-ingest-docs` over 8 docs, 2026-08-20):
`.planning/intel/SYNTHESIS.md`, `requirements.md`, `constraints.md`, `decisions.md`,
`context.md`, and `.planning/INGEST-CONFLICTS.md` (0 blockers, 3 warnings, 14 info).

## Constraints

- **Tech stack**: Next.js 16.2.10 App Router on Node, React 19.2.4, TypeScript,
  Tailwind v4 (`@theme` in `app/globals.css`), PostgreSQL via Drizzle
  (`node-postgres` pool). `next.config.ts` sets `output: "standalone"`; local dev
  runs against `docker-compose.yml`. Next 16 renames `middleware.ts` to `proxy.ts` —
  check `node_modules/next/dist/docs/` before assuming pre-16 behaviour.
- **Security (hardest rule)**: internal data lives in tables the public read layer
  never imports (`property_internal`, `property_owners`, `property_documents`,
  `property_charges`, `property_price_history`, `crm_*`). Separation is by table,
  not by flag. Every public query passes an explicit Drizzle `columns: {…}`
  allowlist — **including joined relations**. Two enforced types: `PublicProperty`
  (the only shape any `app/(site)/**` component may accept) and `AdminProperty`.
  Documents are never public URLs. Only `Available` (CONFIRM: possibly `Reserved`)
  status renders publicly.
- **Schema**: ~150 CFF fields must not become 150 columns nor one JSON blob. Real
  columns for anything filtered/sorted/faceted/carded; `text[]` for taxonomy-validated
  checklists; JSONB only for open-ended admin-authored content; sibling tables for
  1:N and internal data. Every list defined once in `lib/attributes.ts` (or
  `lib/taxonomy/*.ts` past ~400 lines) and imported by both admin form and public
  renderer.
- **Migrations**: `drizzle-kit generate` real SQL for anything that moves or drops
  data; `push` stays for purely additive columns only. `scripts/seed.mjs` produces a
  fully-populated example of every new entity.
- **Caching**: every new public query joins `unstable_cache` + `site-data` tag inside
  `failSoft`; every new admin mutation calls `revalidatePublicSite()`; every new
  public route is added to `lib/admin/revalidate.ts`.
- **Admin form**: never one 150-field page. Sectioned by CFF group, collapsible,
  filled/total counts, conditional sections keyed on property type, draft +
  ~20s autosave, native inputs only.
- **Third-party surfaces**: a new image host needs **two** edits (`remotePatterns`
  in `next.config.ts` **and** `IMAGE_HOSTS` in the property action) or the site 500s
  at render. Embeds need an explicit CSP `frame-src` host. Never wildcard —
  `/_next/image` becomes an SSRF proxy.
- **Code conventions**: ponytail ladder, Server Components by default, one runnable
  assert-based check per non-trivial helper (no framework). `// ponytail:` comments
  name the ceiling on every deliberate shortcut.
- **Brand & motion frozen**: gold is an accent, never a fill or more than ~10% of a
  viewport's visual weight. Scroll-position-driven → GSAP; component-state-driven →
  Framer Motion; never both for one element's one interaction. Every new surface has
  a `prefers-reduced-motion` fallback and a working keyboard path.
- **Phase exit**: every phase ends green — `npm run lint && npm run build` plus the
  §4.1 leak grep. Where an item says CONFIRM, build the named default, leave a
  `// ponytail:` comment, and put the question on the §11 client list.

## Open Items (blocking clarifications)

Three warnings from `.planning/INGEST-CONFLICTS.md`. No phase Done-when may silently
depend on an unresolved one; each is carved out explicitly in ROADMAP.md.

### Open Item 1 — R-37 and R-38 are committed scope with no specification

R-37 (office/team photos) and R-38 (four live listings) gate Phase 0, are delivered
in Phase 7, and appear on the §10 client-update coverage checklist — but neither has
a Need / Build / Done-when block anywhere in §6 or §7. Grep returns only the §9 and
§10 references. Intent is inferable from §2.1 items 2 and 6 and §11 items 1–2 and 5.

**Second ambiguity in the same item:** §2.1 says "List **three to four** properties";
the §10 checklist says "R-38 **four** live listings".

**Effect on the roadmap:** Phase 7's Done-when explicitly excludes R-37/R-38 from its
gate until a written Done-when and a confirmed listing count come back from the
client. They are not silently assumed.

**Resolution needed:** add §6 blocks for both, and confirm three or four.

### Open Item 2 — the [ADDED] approval gate is drawn differently in §7 and §9

§7 and §1 both state every `[ADDED]` item needs a client yes before a phase is spent
on it. §9 marks only P8 as `[ADDED]` — yet P6 schedules R-54, R-56 and R-68, and P9
schedules R-70, R-71, R-72, R-74, R-75, R-77, R-78, R-79, R-80, R-86 and R-87, all
of which are §7 items sitting in phases that carry no approval gate.

**R-54 is the sharpest case.** Named admin users + roles + audit log is tagged
`[ADDED]`/unapproved, yet: §3.1 lists the shared-admin-password supersession as a
decision of *this* round; R-54 is itself marked "**Required** for R-31 attribution";
and approved R-31 states "Depends on named people → R-54." An approved requirement
has an unapproved hard dependency.

**Effect on the roadmap:** Phases 8 and the `[ADDED]` portions of Phases 6 and 9
carry an explicit approval gate in their **Depends on** line. Phase 6's Done-when
splits R-31: the brokerage maths and the no-leak gate are verifiable without R-54;
per-agent attribution and the per-agent split are **not** ticked unless R-54 is
approved, and are deferred visibly rather than skipped quietly.

**Resolution needed:** decide per requirement whether Groups I–M are committed or
gated like Group H. Resolve R-54 first — approved scope depends on it.

### Open Item 3 — four §6 requirements self-describe as "implied"

R-32 ("Need: implied by the CRM"), R-34 ("implied — the current plain table dies at
a few hundred listings"), R-35 ("implied — three counters do not run a brokerage")
and R-36 ("implied by R-02/R-06") all sit in §6 "client-originated" and carry no
`[ADDED]` tag, contradicting the document's own rule that anything the client's list
merely implies gets tagged so the client-originated scope stays separable at
sign-off. Only R-32 appears on the §10 checklist; R-34, R-35 and R-36 appear on no
client-facing checklist.

**Effect on the roadmap:** all four are planned as approved (following their §6
placement, matching `.planning/intel/requirements.md`), and each is marked
`implied — droppable` in REQUIREMENTS.md and in the owning phase, so a re-tag costs
a deletion rather than a re-plan.

**Resolution needed:** confirm with the client, or re-tag them `[ADDED]`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SPEC (`docs/REQUIREMENTS_V2.md`) wins every contradiction against the older `docs/*.md` set | Precedence 0 in `.planning/ingest-manifest.yaml`; it is the signed scope contract for this round | — Pending |
| Codebase map wins over `docs/TECH_STACK.md` for current-code facts | TECH_STACK.md was written pre-build; its tense, token names, Framer usage and route group are all stale | ✓ Good |
| Phase structure is the SPEC's own §9 plan, P0–P9, not a re-decomposition | The client's sign-off, the §10 checklist and the dependency graph are all written against it; re-cutting it would break traceability | — Pending |
| All 52 §7 `[ADDED]` items are v2, not v1 | §7's own header: "ours, not the client's… Get a yes before building." The stricter reading is the safe one | — Pending |
| Price is captured in full; public display gated by `showPricePublicly`, default `false` | SPEC §3.1 supersedes "no price by design"; the default preserves current "Price on request" brand copy with zero public behaviour change | — Pending |
| Collection axis (Kothi/Plot/Projects/Flats/Land/Commercial) is derived from `propertyType` + `kind`, never stored | SPEC §3.1-b and §5.3 — no new column, no re-tagging of existing rows | — Pending |
| `properties` splits: public-safe columns stay, internal data moves to sibling tables | SPEC §4.1 — "a public query that never references a table cannot leak it." Separation by table beats separation by flag | — Pending |
| The CRM table is never named `deals` | Taken by Deal of the Week; the SPEC calls the collision "a real trap" | — Pending |
| Joined relations get column allowlists too, not just `properties` | CONCERNS #18 — §4.1 mandates the allowlist on `properties` but never states that `with: { project: true }` re-leaks once `projects` carries internal fields. Tracked as GAP-02 | — Pending |

---
*Last updated: 2026-08-20 after `/gsd-ingest-docs` + codebase map, at the start of the Aug 2026 CFF expansion round*
