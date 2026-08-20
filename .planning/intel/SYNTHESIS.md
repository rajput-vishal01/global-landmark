# Synthesis

Entry point for downstream consumers (`gsd-roadmapper`). Produced by
`gsd-doc-synthesizer` from `.planning/intel/classifications/*.json` and the source
documents. Mode: `new` — no existing `.planning/` context merged against.

---

## Doc counts by type

- **SPEC** — 1 · `docs/REQUIREMENTS_V2.md` (precedence 0)
- **ADR** — 1 · `docs/TECH_STACK.md` (precedence 1)
- **DOC** — 6 · `docs/PROJECT_OVERVIEW.md`, `docs/BRAND_GUIDELINES.md`,
  `docs/DESIGN_LANGUAGE.md`, `docs/ANIMATION_GUIDELINES.md` (precedence 2);
  `docs/SITE_ARCHITECTURE.md`, `docs/CONTENT_MODEL.md` (precedence 3)
- **PRD** — 0
- **UNKNOWN** — 0

All 8 classifications carried `confidence: high` and `manifest_override: true`.

Precedence applied: per-doc integers from `.planning/ingest-manifest.yaml`, which
override the supplied type-order `SPEC > ADR > PRD > DOC` (they agree here).

Cycle detection: DFS three-colour marking over the `cross_refs` graph, anchors
stripped, max depth 50 (not exceeded). 7 cycles found, all crossing precedence
boundaries; every per-tier induced subgraph is acyclic, so resolution order is
total and no synthesis loop is possible. Synthesis proceeded on all 8 docs. See
the INFO entry in the conflicts report for the full rationale and the strict-mode
alternative.

## Decisions

`.planning/intel/decisions.md` — 17 entries.

- **Locked: 0.** No ADR in the set carries `locked: true`. `docs/TECH_STACK.md`
  was classified `locked: false` because it has no `Status: Accepted` field,
  despite prose describing its ponytail conventions as "locked in". All entries
  are `status: proposed`.
- 6 from the ADR (`docs/TECH_STACK.md`): Next.js 16 App Router + `proxy.ts` ·
  Tailwind v4 `@theme` tokens · no component library · GSAP via `useGSAP()` +
  Framer Motion client-only · folder structure · ponytail conventions.
- 11 from the precedence-0 SPEC: the four §3.1 supersessions (price /
  collections / table split / admin auth), the six §4 cross-cutting architecture
  decisions (public-internal boundary, schema strategy, migrations, caching,
  admin form ergonomics, third-party config), and the §9 phase plan.

SPEC-sourced decisions are routed to `decisions.md` in addition to
`constraints.md` because §3.1 is literally titled "Decisions this round
supersedes" and functions as a decision record. They are labelled as SPEC-sourced
and non-locked.

## Requirements

`.planning/intel/requirements.md` — 88 entries, all extracted from the SPEC's
Need / Build / Done-when register. No PRD exists in the ingest set.

- **approved-client-originated (§6): 36** — REQ-r01 … REQ-r38 (numbering is the
  SPEC's; R-37 and R-38 exist only as checklist references, see below).
  Group A public site & brand R-01–R-09 · Group B property data model R-10–R-25 ·
  Group C builder/project R-26–R-27 · Group D media & documents R-28–R-29 ·
  Group E leads R-32 · Group F CRM & brokerage R-30–R-31 · Group G admin panel
  R-33–R-36.
- **proposed-not-approved (§7 `[ADDED]`): 52** — REQ-r39 … REQ-r90.
  Group H public conversion features R-39–R-53 · Group I admin depth R-54–R-69 ·
  Group J compliance R-70–R-74 · Group K performance R-75–R-80 · Group L SEO
  R-81–R-85 · Group M accessibility & quality R-86–R-90.
  The SPEC is explicit that these are "ours, not the client's… Get a yes before
  building." **Do not schedule these as committed scope.**
- **Specification incomplete: 2** — REQ-r37 and REQ-r38 have no Build or
  Done-when block anywhere in the SPEC; acceptance is marked absent.
- 24 requirements carry inline `[ADDED]` sub-items inside otherwise approved
  entries; these are noted in the description rather than split out.
- `CONFIRM` markers are reproduced verbatim throughout. Per §1 the stated default
  is the decision to build and the question goes on the client follow-up list
  (§11, 30 items) — they are open items, not blockers.

## Constraints

`.planning/intel/constraints.md` — 14 entries.

- **protocol: 7** — public/internal boundary · migrations · caching and
  revalidation · admin form ergonomics · guardrails (§8) · frozen existing
  behaviour · phase exit criteria · admin identity and attribution.
- **schema: 3** — field coverage (20 CFF groups, ~150 fields) · schema strategy
  (columns vs `text[]` vs JSONB vs sibling tables) · target data model (18 new
  tables, of which 13 are internal-only).
- **api-contract: 1** — third-party surface config coupling (`remotePatterns` +
  `IMAGE_HOSTS`, CSP `frame-src`, no wildcards).
- **nfr: 4** — performance and scale limits in current code · data-safety limits ·
  content-integrity risks · motion/brand/design constraints carried forward.

Cross-checked against `.planning/codebase/CONCERNS.md` (audit 2026-08-20), so
constraints carry the real current-code risk with file and line references: 3
CRITICAL (no public column allowlist, `drizzle-kit push --force` on every build
with no migration history, fabricated social-proof ticker), 6 HIGH, 7 MEDIUM,
2 LOW. Two CONCERNS items (#5 `uniqueSlug()` full-table scan, #18 unscoped
`with: { project: true }` joins) have no requirement ID in the SPEC and are
carried here as new constraints.

## Context

`.planning/intel/context.md` — 16 topics from the 6 DOC-type docs.

Brand identity and positioning · target audiences · goals and success criteria ·
original scope boundaries · sitemap and route status · navigation structure ·
not-in-scope list · content model entity shapes · design principles · spacing and
typography scales · colour usage by context · layout system and section patterns ·
logo usage and voice · animation division of labor · animation catalogues, easing
and no-build list · reference-site lineage.

## Conflicts

**0 blockers · 3 competing-variants (WARNING) · 14 auto-resolved (INFO)**

The three WARNINGs all concern the approved/proposed boundary inside the SPEC and
need a human answer before scope is routed:

1. **R-37 and R-38 are referenced as committed scope but never defined** — both
   gate phase P0 and appear on the §10 client checklist, neither has acceptance
   criteria; the listing count is "three to four" in §2.1 versus "four" in §10.
2. **§7 says every `[ADDED]` item needs approval; §9 schedules many into
   non-`[ADDED]` phases** — P6 and P9 commit R-54, R-56, R-68, R-70, R-71, R-72,
   R-74, R-75, R-77, R-78, R-79, R-80, R-86, R-87 while only P8 carries an
   approval gate. R-54 is the sharpest case: approved requirement R-31 states it
   depends on it.
3. **Four §6 requirements self-describe as "implied" but carry no `[ADDED]` tag**
   — R-32, R-34, R-35, R-36, against the document's own tagging rule.

The 14 INFOs are all supersessions or stale-doc notes, resolved by precedence with
the SPEC winning. The four §3.1 supersessions the SPEC declares by name (price,
collections, table split, admin auth) are recorded as auto-resolved, not
conflicts, per the ingest instructions. The self-superseding banners in
`CONTENT_MODEL.md` and `SITE_ARCHITECTURE.md` are likewise INFO.

Full detail: `.planning/INGEST-CONFLICTS.md`

## Files

- `.planning/intel/decisions.md`
- `.planning/intel/requirements.md`
- `.planning/intel/constraints.md`
- `.planning/intel/context.md`
- `.planning/INGEST-CONFLICTS.md`

## Notes for the roadmapper

- The SPEC is the signed scope contract for this round and wins every
  contradiction against the older context docs. Where it is silent, the DOC-tier
  brand, design and motion material in `context.md` still governs — §8 explicitly
  freezes the landing page, the motion system and the brand tokens.
- Committed scope for planning is the 36 §6 requirements, minus the two
  undefined ones, pending the WARNING answers. The 52 §7 items are a menu, not a
  backlog.
- The §9 phase plan (P0–P9 with stated dependencies) is recorded in
  `decisions.md` and is the SPEC's own sequencing; P8 is the only phase gated on
  client approval as written, which is what WARNING 2 disputes.
- Every phase has two exit gates, not one: `npm run lint && npm run build` green
  **and** the §4.1 leak check (grep rendered HTML and the client JS payload for a
  known owner phone number, a brokerage figure and a circle rate — zero hits).
