## Conflict Detection Report

Ingest set: 8 docs (1 SPEC, 1 ADR, 6 DOC). Mode: new. No existing `.planning/`
context to merge against.

Precedence applied: per-doc integers from `.planning/ingest-manifest.yaml` — 0
`docs/REQUIREMENTS_V2.md` (SPEC) · 1 `docs/TECH_STACK.md` (ADR) · 2
`docs/PROJECT_OVERVIEW.md`, `docs/BRAND_GUIDELINES.md`, `docs/DESIGN_LANGUAGE.md`,
`docs/ANIMATION_GUIDELINES.md` · 3 `docs/SITE_ARCHITECTURE.md`,
`docs/CONTENT_MODEL.md`. Lower integer wins. Per-doc integers override the
type-order supplied in `PRECEDENCE` (`SPEC > ADR > PRD > DOC`), which they happen
to agree with here.

No ADR in the set carries `locked: true`, so no LOCKED-vs-LOCKED check fired.

### BLOCKERS (0)

None. Synthesis completed on all 8 docs.

### WARNINGS (3)

[WARNING] R-37 and R-38 are referenced as committed scope but never defined
  Found: docs/REQUIREMENTS_V2.md §9 gates phase P0 on "R-02/03/06/37/38" and
    schedules R-37/R-38 content in P7; §10's client-update coverage checklist
    lists "R-37 office/team photos" and "R-38 four live listings"
  Found: neither ID has a Need / Build / Done-when block anywhere in §6 or §7 —
    grep for "R-37"/"R-38" returns only the §9 and §10 references
  Found: the intent is inferable from §2.1 item 6 (office photos, portraits of
    Ashu ji and Divya ji) and item 2 ("List three to four properties"), plus §11
    items 1–2 and 5 — but §2.1 says "three to four" while the §10 checklist title
    says "four"
  Impact: two requirements that block a phase have no acceptance criteria. The
    roadmapper cannot write a Done-when for P0 or P7, and the §10 checklist
    cannot be honestly ticked. The listing count is ambiguous.
  → Add §6 blocks for R-37 and R-38 with Need/Build/Done-when, and confirm
    whether three or four listings go live first, before routing P0/P7

[WARNING] §7 says every [ADDED] item needs client approval; §9 schedules many of
them into non-[ADDED] phases
  Found: docs/REQUIREMENTS_V2.md §7 header — "Everything in this section is ours,
    not the client's… Get a yes before building"; §1 repeats "[ADDED] items are
    scoped and buildable but are ours, not theirs — get a yes before spending a
    phase on one"
  Found: docs/REQUIREMENTS_V2.md §9 marks only P8 as "[ADDED]" and scopes it to
    "Whichever of Group H the client approves" — leaving Groups I–M unaccounted
    for by that gate
  Found: §9 P6 schedules "Named users + audit log… tasks… reports" (R-54, R-56,
    R-68) and P9 schedules "DPDP/consent/policies, RERA rendering, ticker
    decision, pagination + indexes, rate-limit store, backups, monitoring,
    accessibility, CWV" (R-70, R-71, R-72, R-74, R-75, R-77, R-78, R-79, R-80,
    R-86, R-87) — all §7 [ADDED] items, in phases carrying no approval gate
  Found: R-54 is additionally reinforced three ways — §3.1 lists the shared-admin-
    password supersession as a decision of this round, R-54 itself is marked
    "**Required** for R-31 attribution", and R-31 states "Depends on named people
    → R-54" — while still sitting in the §7 not-approved bucket
  Impact: the approved/proposed line is the one thing this SPEC is structured to
    keep separable at sign-off, and two sections of the same document draw it
    differently. R-54 in particular is a hard dependency of approved requirement
    R-31; if it is genuinely optional, R-31 cannot be built as specified.
  → Decide per requirement whether Groups I–M are committed or gated like Group
    H. At minimum resolve R-54 explicitly, since approved scope depends on it.
    `.planning/intel/requirements.md` currently records all of R-39–R-90 as
    `proposed-not-approved` per the §7 header — the stricter reading.

[WARNING] Four §6 requirements self-describe as "implied" but are not tagged
[ADDED], contradicting the document's own tagging rule
  Found: docs/REQUIREMENTS_V2.md §Sources states requirements "the client's list
    implies but does not state — every one of those is tagged **[ADDED]** so the
    client-originated scope stays separable at sign-off"
  Found: R-32 ("**Need:** implied by the CRM"), R-34 ("**Need:** implied — the
    current plain table dies at a few hundred listings"), R-35 ("**Need:**
    implied — three counters do not run a brokerage") and R-36 ("**Need:**
    implied by R-02/R-06") all sit in §6 "Requirement register —
    client-originated" and carry no [ADDED] tag
  Found: of the four, only R-32 appears on the §10 client-update coverage
    checklist; R-34, R-35 and R-36 appear on no client-facing checklist
  Impact: these four are being planned as signed client scope while describing
    themselves as inferred. If they are inferred, they belong behind the same
    approval gate as §7 and the sign-off separability the document promises does
    not hold.
  → Confirm with the client whether R-32/R-34/R-35/R-36 are in scope, or re-tag
    them [ADDED]. `.planning/intel/requirements.md` currently records all four as
    `approved-client-originated`, following their §6 placement.

### INFO (14)

[INFO] Auto-resolved: SPEC §3.1 supersedes "no price by design" — CONTENT_MODEL.md
  Note: docs/CONTENT_MODEL.md (DOC, prec 3) carries a July 2026 banner stating
    "**no price by client decision** — deals close over calls", also written into
    `lib/db/schema.ts` and `PROPERTY_DETAIL.sidebarNote`. docs/REQUIREMENTS_V2.md
    (SPEC, prec 0) §3.1 names this decision and reverses it: full price and
    charges are captured per CFF §6, public display gated by a per-property
    `showPricePublicly` flag defaulting to `false`, circle rate internal always.
    SPEC wins on precedence; the SPEC itself directs the schema comment, the doc
    and the sidebar copy to be updated. Recorded as SPEC-3.1-a in
    `.planning/intel/decisions.md`. Net public behaviour is unchanged by default —
    "Price on request" still renders until the flag is set per property.

[INFO] Auto-resolved: collection axis added alongside the four categories
  Note: `lib/categories.ts`'s `sale · purchase · lease · invest` was the only
    taxonomy. docs/REQUIREMENTS_V2.md §3.1 and R-04 keep it as the *intent* axis
    and add an orthogonal **collection** axis (Kothi / Plot / Projects / Flats /
    Land / Commercial) derived from `propertyType` + `kind` with no new column and
    no re-tagging. Not a contradiction — an addition the SPEC declares explicitly.
    Recorded as SPEC-3.1-b.

[INFO] Auto-resolved: `properties` splits into public + internal sibling tables
  Note: `lib/db/schema.ts` treats `properties` as a flat, mostly-public table.
    docs/REQUIREMENTS_V2.md §3.1, §4.1 and §5 split it — public-safe columns stay,
    owner/money/legal/status data move to `property_internal`, `property_owners`,
    `property_documents`, `property_charges`, `property_price_history` and the
    `crm_*` tables. SPEC wins on precedence. Recorded as SPEC-3.1-c.

[INFO] Auto-resolved: single shared admin password superseded
  Note: `lib/admin/auth.ts` uses one shared password behind a stateless HMAC
    cookie. docs/REQUIREMENTS_V2.md §3.1 declares it insufficient once brokerage
    and attribution exist; R-54 replaces it with `admin_users` + roles + per-user
    login + `audit_log`, keeping the HMAC mechanism and adding identity.
    Corroborated independently by `.planning/codebase/CONCERNS.md` #8. SPEC wins.
    Recorded as SPEC-3.1-d. See the §7-vs-§9 WARNING above for R-54's approval
    status.

[INFO] Auto-resolved: route group is `(site)`, not `(marketing)`
  Note: docs/TECH_STACK.md (ADR, prec 1) folder-structure diagram shows
    `app/(marketing)/`. docs/SITE_ARCHITECTURE.md (DOC, prec 3) table text repeats
    "Routes assume the `(marketing)` route group", but its own July 2026 banner
    says the shipped routes are "under the `(site)` route group".
    docs/REQUIREMENTS_V2.md (SPEC, prec 0) §3 confirms `(site)` as the shipped
    state and `app/(site)/**` as the public component boundary in §4.1. SPEC wins
    over both; `(site)` is current truth. The `(marketing)` references are stale
    in two docs and should be corrected when §9 P9's doc-sync task runs.

[INFO] Auto-resolved: CRM moves from out-of-scope to in-scope
  Note: docs/PROJECT_OVERVIEW.md (DOC, prec 2) lists "transaction/CRM backend"
    under "Out (for now)". docs/REQUIREMENTS_V2.md (SPEC, prec 0) R-30 and R-31
    add a full CRM with clients, deals, activities and brokerage tracking, and §9
    schedules it as phase P6. SPEC wins. The other PROJECT_OVERVIEW exclusions
    hold: MLS/IDX sync, buyer portal/login and multi-language i18n are untouched
    by the SPEC, and R-05 restates "no accounts — auth is out of scope" for public
    visitors. Dark mode remains undecided per CLAUDE.md and is not addressed by
    the SPEC.

[INFO] Auto-resolved: discovery surfaces gain density the brand docs argued against
  Note: docs/PROJECT_OVERVIEW.md positions the site as "not a transactional
    listings portal (no MLS search-engine feel, no dense filter grids up front)",
    and docs/DESIGN_LANGUAGE.md principle 4 is "Restraint over density".
    docs/REQUIREMENTS_V2.md R-04 (six-card collection grid + persistent tab row),
    R-08 (city tab row + dependent selects) and R-09 (configuration filter tabs)
    add exactly that density to `/properties`. SPEC wins on precedence. Note the
    SPEC does not read as a full reversal: §8 forbids redesigning the landing
    page, the motion system and the brand tokens, and R-05 keeps the 4:5 crop and
    existing reveal behaviour — so the editorial posture holds on brand surfaces
    while discovery surfaces densify. Flagged so the roadmapper does not treat
    the density as licence to restyle the landing page.

[INFO] Auto-resolved: SPEC closes the ADR's open component-library decision
  Note: docs/TECH_STACK.md (ADR, prec 1) states "No component library decided
    yet" and records a recommendation to hand-build. docs/REQUIREMENTS_V2.md
    (SPEC, prec 0) §8 converts it to a guardrail: "No component library, form
    library, state manager, date picker or second ORM." SPEC wins; the decision is
    closed, not open. Note the ADR's own hedge — "Revisit only if a specific need
    arises (e.g. a date picker for a booking form)" — is overridden, and §4.5
    independently forbids a date picker by name.

[INFO] Stale-by-design content in TECH_STACK.md, treated as INFO not conflict
  Note: docs/TECH_STACK.md is written pre-build and says "`npm install gsap
    @gsap/react framer-motion` when code phase begins" and "Both libraries
    coexist". docs/REQUIREMENTS_V2.md §3 confirms both are installed and in use,
    plus Lenis on the GSAP ticker and Framer Motion behind `LazyMotion strict`
    (`m.*` only) — a constraint the ADR does not mention. The ADR's decisions
    (App Router, `proxy.ts`, Tailwind v4 `@theme`, `useGSAP()`, ponytail ladder)
    all remain current; only its tense is stale. No resolution needed.

[INFO] Self-superseding banners honoured, per ingest instructions
  Note: docs/CONTENT_MODEL.md and docs/SITE_ARCHITECTURE.md both open with
    explicit banners naming `lib/db/schema.ts` and the shipped July 2026 route set
    as current truth. Their stale portions are recorded in
    `.planning/intel/context.md` as superseded reference rather than as conflicts.
    Still-live content preserved: CONTENT_MODEL's `Agent`, `Community`, `Article`,
    `Office` and `MediaAsset` shapes for unbuilt entities, and its slug-not-ID and
    `aspectRatio`-at-source conventions; SITE_ARCHITECTURE's target-route
    rationale and navigation structure.

[INFO] Cross-ref cycles detected but non-blocking
  Note: DFS three-colour cycle detection over the `cross_refs` graph (anchors
    stripped, max depth 50, not exceeded) found 7 cycles among the 8 docs — e.g.
    `SITE_ARCHITECTURE.md → PROJECT_OVERVIEW.md → SITE_ARCHITECTURE.md`,
    `CONTENT_MODEL.md → TECH_STACK.md → CONTENT_MODEL.md`, and
    `BRAND_GUIDELINES.md → DESIGN_LANGUAGE.md → SITE_ARCHITECTURE.md →
    PROJECT_OVERVIEW.md → CONTENT_MODEL.md → TECH_STACK.md → BRAND_GUIDELINES.md`.
    Every one crosses a precedence boundary; the subgraph induced on each
    precedence tier is acyclic (tier 0 and tier 1 are single docs; tier 2 has
    edges BRAND→DESIGN_LANGUAGE, PROJECT_OVERVIEW→ANIMATION_GUIDELINES,
    PROJECT_OVERVIEW→DESIGN_LANGUAGE and no cycle; tier 3 has no internal edges).
    Because the manifest assigns every doc an explicit precedence integer,
    resolution order is total and no synthesis loop is possible — these are
    bidirectional "see also" links in a documentation index, not derivation
    dependencies. Synthesis proceeded on all 8 docs. **This is a judgment call:**
    a strict reading of the cycle rule would block the whole set. If you want the
    strict behaviour, re-run with a `--manifest` that breaks the reference loops.

[INFO] Three CONCERNS.md "Unlogged" verdicts are contradicted by the SPEC
  Note: `.planning/codebase/CONCERNS.md` marks #13 (unattributed ₹850 Cr figure
    and the `PRESS` array), #14 (placeholder `#` social links) and #15 (Unsplash
    stock imagery including the geographically wrong India Gate photo) as not
    tracked in REQUIREMENTS_V2. All three are in fact covered explicitly: R-02
    names the `CREDIBILITY` figures and directs removal of any of the six press
    mastheads the client cannot evidence; R-06 names X, LinkedIn and YouTube as
    `"#"` today and silently filtered out of the footer; R-03 names the
    `ARCH_REVEAL` India Gate image and requires zero Unsplash URLs in shipped
    code. `.planning/intel/constraints.md` records the corrected position.

[INFO] Two CONCERNS.md items are genuinely untracked and carried into constraints
  Note: `.planning/codebase/CONCERNS.md` #5 — `uniqueSlug()` in
    `app/admin/(panel)/properties/actions.ts` L255-263 runs an unfiltered
    `db.select({ id, slug }).from(properties)` on every create (L280) and update
    (L321), so admin save latency scales with total inventory, worst when §4.5's
    ~20s draft autosave is firing. R-75's pagination/indexing scope covers public
    list queries, not this admin write path. And #18 — every public query uses
    `with: { project: true }` unscoped, so once `projects` carries internal fields
    per §5.2 the join re-leaks them; §4.1 mandates allowlists on `properties` but
    never states that joined relations need the same treatment. Both are recorded
    in `.planning/intel/constraints.md`; neither has a requirement ID yet.

[INFO] Referenced docs absent from the ingest set
  Note: `docs/DESIGN_REFERENCES.md` is cited by BRAND_GUIDELINES.md,
    DESIGN_LANGUAGE.md, ANIMATION_GUIDELINES.md, PROJECT_OVERVIEW.md and
    SITE_ARCHITECTURE.md as the source of every design and motion decision, and
    `docs/TASKS.md` holds the open font-family decision and the dark-mode "maybe".
    Neither is in `.planning/ingest-manifest.yaml`, so the rationale behind the
    design decisions and the open-decision log are unavailable to this synthesis.
    Conclusions were reproduced from the citing docs; the "why" was not.
    Also noted: `docs/TECH_STACK.md` was classified `locked: false` because it
    carries no `Status: Accepted` field, despite its own prose saying its ponytail
    conventions are "locked in for all future code in this repo" and Tailwind v4
    is "made by the scaffold, not open". All its decisions are therefore recorded
    as `status: proposed`. If any of them should be immovable, add a
    `Status: Accepted` field and re-run.
