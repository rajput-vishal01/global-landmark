---
phase: 02-admin-property-form-rebuild
plan: 01
type: execute
wave: 1
depends_on: [01-taxonomy-schema-foundation]
autonomous: false          # two blocking human-verify checkpoints (360px pass, G2 leak run)
requirements: [R-07, R-13, R-15, R-28, R-29, R-33, R-34, GAP-01]
also_advances: [R-08, R-09, R-10, R-11, R-12, R-14, R-16, R-20, R-24]

files_modified:
  - lib/taxonomy/sections.ts                       # new — CFF 20 groups + conditional map
  - lib/admin/property-parse.ts                    # new — pure parse helpers, compilable by the check script
  - lib/db/queries.ts                              # listPropertiesForAdmin (uncached, ungated, admin columns)
  - lib/slugify.ts                                 # slugCollisionPattern extracted for assertion
  - app/admin/(panel)/properties/actions.ts        # refCode, child tables, draft mode
  - app/admin/(panel)/properties/page.tsx          # admin list: ref code, status badge, filters, pagination
  - app/admin/(panel)/layout.tsx                   # nav mobile behaviour (R-33)
  - app/api/admin/upload/route.ts                  # kind=image|document
  - app/api/admin/documents/[key]/route.ts         # new — admin-gated stream (R-29)
  - components/admin/ChecklistField.tsx            # already applied, uncommitted
  - components/admin/PropertyForm.tsx              # shell only after the split
  - components/admin/FormSection.tsx               # in flight — collapsible shell + countFilled
  - components/admin/*Section.tsx                  # section components, one per CFF cluster
  - components/form-classes.ts                     # already applied, uncommitted
  - scripts/check-taxonomy.mjs                     # assertions for sections + parse + slug pattern
  - scripts/leak-check.mjs                         # LEAK_PAGES override + document needle

estimate:
  tokens: 420000
  raw_tokens: 210000
  tasks: 11
  confidence: low            # no calibration samples for this repo yet

must_haves:
  truths:
    - "A broker on a 360px phone opens Add Property and sees the CFF's 20 groups as collapsed sections with a filled/total count each — never one 150-field page."
    - "Selecting Residential Plot hides configuration, balconies and furnishing; selecting Flat/Apartment shows floor and unit and refuses to publish without them. One map keyed on property type drives both."
    - "A half-entered listing survives a dropped connection: a draft row exists within ~20s, reopening the edit page shows the work, and the draft is on no public surface."
    - "Every property carries a unique GL-<CITY>-<YY>-<seq> ref code, visible in the admin list with a colour status badge — and ref code, listedAt, addedBy and listingStatus appear in no public HTML or client JS."
    - "An owner phone number and a circle rate typed through the UI are readable in the admin and produce zero hits from scripts/leak-check.mjs against a production build."
    - "Logged out, a document URL returns 404 with no redirect; logged in, the same URL downloads the file as an attachment."
    - "Demand price plus charges shows a correct all-in figure and a derived per-sq.ft rate in the admin."
  artifacts:
    - lib/taxonomy/sections.ts
    - lib/admin/property-parse.ts
    - components/admin/FormSection.tsx
    - app/api/admin/documents/[key]/route.ts
    - components/admin/SaveBar.tsx
  key_links:
    - "app/admin/(panel)/properties/page.tsx must read an ADMIN query — it currently calls the public, publication-gated listProperties(), so every draft is invisible to the person who just typed it."
    - "parseProperty() gains one draft|publish mode flag — required-field enforcement lives in exactly one place, or autosave starts rejecting the half-entered rows it exists to save."
    - "property_documents storage keys resolve only under UPLOAD_DIR/private; the route is the sole gate because proxy.ts matches /admin/:path* and not /api/admin/*."
    - "toSqft() is written by the server action into areaSqft; the all-in per-sq.ft rate and every Phase 4 area filter read it."
    - "revalidatePublicSite() must not fire on every 20s autosave of a draft, or the public cache churns on rows that can never be public."
---

<objective>
Rebuild the admin property form so a broker can enter a complete ~150-field CFF
listing from a phone at a site visit without losing work, and so every internal
field they type stays internal.

Purpose: Phase 1 gave every CFF field a column and made the public read layer
physically unable to return an internal one. This phase is where a human first
puts real owner phone numbers, circle rates and legal documents into those
columns through a UI — which is why this is the first phase where the leak
check has teeth.

Output: a 20-section collapsible form driven by one property-type map, draft
publication state with ~20s autosave, ref-code generation, media categories,
multi-owner and charge editors, an admin-gated document vault, and an admin
list that survives real inventory.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-admin-property-form-rebuild/CONTEXT.md
@.planning/codebase/CONVENTIONS.md
@docs/REQUIREMENTS_V2.md

@lib/db/schema.ts
@lib/db/public-columns.ts
@lib/taxonomy/property.ts
@lib/taxonomy/features.ts
@lib/taxonomy/status.ts
@lib/taxonomy/price.ts
@lib/taxonomy/area.ts
@lib/locations.ts
@lib/storage.ts
@app/admin/(panel)/properties/actions.ts
@components/admin/PropertyForm.tsx
@components/admin/ChecklistField.tsx
@components/form-classes.ts
</context>

---

## State of the working tree at planning time

Work is already in flight and uncommitted. Tasks 1 and 2 therefore **verify,
finish and commit** what exists rather than writing it from scratch; if a clean
checkout has reverted any of it, each task's action describes exactly what to
produce.

**Task 1 — applied:** the generalised checklist widget exists, its predecessor
is deleted with no importers, `FIELD` is collapsed into `components/form-classes.ts`
carrying `w-full appearance-none rounded-none`, and `uniqueSlug()` has a
targeted `WHERE` with an escaped LIKE pattern (GAP-01). **Still to do:** extract
`slugCollisionPattern` to `lib/slugify.ts` and assert it in `check-taxonomy.mjs`.

**Task 2 — largely applied:** `components/admin/FormSection.tsx` (collapsible
shell exporting `countFilled`), `components/admin/BasicDetailsSection.tsx` with
its `StatusBadge`, `listPropertiesForAdmin()` in `lib/db/queries.ts`, the admin
list rendering ref code and status badge, and ref-code assignment from the
returned row id inside the insert transaction. **Still to do:** the `listedAt`
date input, the `sourceName` conditional, and the human verification below.

**Already ahead into Task 3:** `components/admin/LocationSection.tsx` exists
(CFF group 3). Task 3 verifies and extends it rather than creating it.

**Two conventions to follow, set by the in-flight code, not by this plan:**
- Section components live flat at `components/admin/<Name>Section.tsx` — not in
  a `property-form/` subdirectory. Keep that.
- `FormSection` takes an explicit `countFilled` result from its caller rather
  than scanning the DOM. Keep that too: it is more code per section but it is
  legible, and a DOM scan would silently miscount the hidden JSON inputs the
  checklist and editor widgets emit.

## Task index

| # | Task | Wave | Depends | Reverts cleanly? |
|---|---|---|---|---|
| 1 | Land the three folded-in refactors + assertions | 1 | — | yes |
| 2 | **TRACER** — Basic Details end-to-end | 2 | 1 | no (foundation) |
| 3 | Section registry, conditional map, form split | 3 | 2 | no |
| 4 | Area, features, legal / loan / documentation | 4 | 3 | yes |
| 5 | Price and charges | 5 | 4 | yes |
| 6 | Ownership and the internal 1:1 | 6 | 3 | yes |
| 7 | Media categories and link media | 7 | 3 | yes |
| 8 | Document vault | 8 | 4 | yes |
| 9 | Draft autosave and the sticky save bar | 9 | 8 | yes |
| 10 | Admin list at scale + nav (R-34 / R-33) | 10 | 2 | **yes — the R-34 carve-out** |
| 11 | 360px pass and the phase gate | 11 | all | n/a |

Tasks 3–9 are sequential on `app/admin/(panel)/properties/actions.ts` and
`lib/admin/property-parse.ts`; they share those files and cannot be parallelised.
Task 10 touches only the list page, the admin query and the layout, so it can run
beside 4–9 once Task 2 lands.

**No package installs in this phase.** Native inputs, no form library, no state
manager, no date picker — so there is no package-legitimacy audit to satisfy.

---

<tasks>

<task type="auto">
  <name>Task 1: Land the three folded-in refactors and give them assertions</name>
  <files>
    components/admin/ChecklistField.tsx,
    components/admin/AmenitiesField.tsx (deleted),
    components/admin/PropertyForm.tsx,
    components/form-classes.ts,
    app/admin/(panel)/properties/actions.ts,
    lib/slugify.ts,
    scripts/check-taxonomy.mjs
  </files>
  <why-here>
    All three have downstream users. ChecklistField has eight call sites arriving
    in Tasks 4–8; the shared FIELD constant is what every new section styles
    against; and the slug scan runs on every autosave from Task 9 onward. Doing
    them after the form grows means eight rewrites instead of one.
  </why-here>
  <action>
    The working tree already carries all three. Verify and finish them, do not
    rewrite from scratch.

    1. Confirm `components/admin/ChecklistField.tsx` takes `name`, `options`,
       `initial`, `allowCustom` (default off), `customPlaceholder`, `columns`
       and `max`; that it emits one hidden JSON input named by `name`; and that
       values outside `options` render as removable chips. Confirm the deleted
       predecessor has no remaining importer anywhere under `app/`,
       `components/` or `lib/`.
    2. Confirm `components/form-classes.ts` exports the single `FIELD` string
       carrying `w-full appearance-none rounded-none`, and that
       `components/admin/PropertyForm.tsx` imports it rather than declaring a
       local copy.
    3. Confirm `uniqueSlug()` in the property action reads only candidate rows
       (`slug = base OR slug ILIKE 'base-%'`) with `%`, `_` and backslash
       escaped in the pattern. Extract the pattern builder to `lib/slugify.ts`
       as `slugCollisionPattern(base): string` and have the action import it —
       this exists so the escaping can be asserted from a script, which a
       `"use server"` module cannot be.
    4. Extend `scripts/check-taxonomy.mjs`: add `lib/slugify.ts` to its `tsc`
       file list and assert that `slugCollisionPattern` escapes each of the
       three LIKE metacharacters and appends the trailing wildcard.
    5. Commit as one change: `refactor(02-01): generalise the checklist widget,
       collapse the duplicate field class, bound the slug scan (GAP-01)`.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; node scripts/check-taxonomy.mjs &amp;&amp; ! grep -rn "AmenitiesField" app components lib</automated>
  </verify>
  <done>
    Lint and build are green, the taxonomy check passes with the new slug
    assertions, the removed component has zero references under `app/`,
    `components/` and `lib/`, and `FIELD` is declared exactly once in the repo.
    (The negative grep is scoped to source directories, so naming the removed
    component in this plan cannot satisfy or break it — but do not name it in a
    code comment either.)
  </done>
</task>

<task type="tracer">
  <name>Task 2: TRACER — Basic Details wired end-to-end</name>
  <files>
    components/admin/FormSection.tsx,
    components/admin/BasicDetailsSection.tsx,
    components/admin/PropertyForm.tsx,
    app/admin/(panel)/properties/actions.ts,
    lib/db/queries.ts,
    app/admin/(panel)/properties/page.tsx
  </files>
  <why-here>
    One production-quality slice through every layer the phase touches —
    section shell, server action, persistence, admin list — before the other
    nineteen groups are built on top of it. Basic Details is the right slice
    because it carries ref code, listing status, added-by and publication
    state, which success criteria 3 and 4 both depend on. If the section
    machinery is wrong, this is a one-commit rollback rather than a ten-commit
    unwind.
  </why-here>
  <action>
    **A single-path slice, production quality. No stubs that a later task must
    architecturally replace.**

    1. `components/admin/FormSection.tsx` — client component wrapping native
       `<details>`/`<summary>`, showing the title, the CFF group number and a
       filled/total count supplied by the caller via the exported `countFilled`
       helper. `<details>` over a JS accordion on purpose: a collapsed
       `<details>` keeps its children in the DOM, so hidden inputs still submit
       and a collapsed section never silently drops a field. Make sure that
       reason is in a comment — it is the kind of thing a later refactor
       "simplifies" away.
    2. `components/admin/BasicDetailsSection.tsx` — CFF group 1, open by
       default, holding: ref code (read-only, "assigned on save" when absent),
       `listedAt` (`<input type="date">` — native, no picker library),
       `updatedAt` (read-only), `addedBy` (`ADDED_BY`), `sourceName` (text,
       revealed when `addedBy` is not Global Landmark), `listingStatus`
       (`LISTING_STATUSES`) and `publicationState` (`PUBLICATION_STATES`),
       plus the `StatusBadge` the admin list reuses.
    3. `components/admin/PropertyForm.tsx` — mount the section above the
       existing flat fields. The rest of the form stays as-is for now; Task 3
       breaks it up.
    4. `app/admin/(panel)/properties/actions.ts` — parse and persist those
       fields with the existing helpers: `parseChoice` against the taxonomy
       lists for the three enumerated fields, trimmed text for `sourceName`, a
       date parse for `listedAt` that falls back to now on anything unparseable
       rather than throwing. Assign the ref code inside the existing insert
       transaction: insert, take the returned `id`, then set
       `refCode(city, year, id)`. Using the row id as the sequence is what makes
       "never reused after a delete" true by construction — a serial never
       hands the same number out twice. Name that choice and its ceiling in a
       `// ponytail:` comment: the sequence is global, so per-city codes skip
       numbers; a per-city sequence is the upgrade if the client ever objects.
    5. `lib/db/queries.ts` — add `listPropertiesForAdmin()`. **This is the
       load-bearing fix in this task.** The admin list currently calls
       `listProperties()`, which is `unstable_cache`d and filtered by
       `publicVisibility()`. With `publicationState` defaulting to `draft`,
       every property a broker creates is invisible in the admin the moment it
       is created. The admin query must be uncached, unfiltered by publication
       state, and select the admin columns (`refCode`, `listingStatus`,
       `publicationState`, `addedBy`, `updatedAt`, `city`) plus the cover image
       and the project name. It returns `AdminProperty`-shaped rows and must
       never be imported by anything under `app/(site)/`.
    6. `app/admin/(panel)/properties/page.tsx` — read the new query and add
       columns for ref code, status badge (`STATUS_BADGE`), publication state
       and added-by.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; ! grep -rn "listPropertiesForAdmin" "app/(site)"</automated>
    <human-check>
      Create a property through the UI leaving publication state at Draft. It
      appears in the admin list with a `GL-…` ref code and an "Available" gold
      badge, and does not appear on `/properties`. Switch it to Published and
      it appears on `/properties` after the revalidation.
    </human-check>
  </verify>
  <done>
    One collapsible section renders with a live filled/total count; a saved
    property receives a unique ref code that survives deleting an adjacent row;
    a draft is visible in the admin and absent from the public site; the admin
    list shows ref code, status badge, publication state and added-by.
  </done>
</task>

<task type="auto">
  <name>Task 3: The 20-section registry, the conditional map, and the form split</name>
  <files>
    lib/taxonomy/sections.ts,
    lib/admin/property-parse.ts,
    components/admin/LocationSection.tsx (exists — verify and extend),
    components/admin/ClassificationSection.tsx,
    components/admin/ConfigurationSection.tsx,
    components/admin/SpecificationsSection.tsx,
    components/admin/PropertyForm.tsx,
    app/admin/(panel)/properties/actions.ts,
    scripts/check-taxonomy.mjs
  </files>
  <why-here>
    Everything after this hangs off the registry and the parse module. Building
    sections 4–8 before the registry exists means retrofitting nineteen of them.
    The parse extraction has to happen now too: `actions.ts` is already 389
    lines and about to absorb ~150 fields plus five child tables, which blows
    the 800-line file ceiling and — more importantly — leaves the parsing
    unassertable, because a `"use server"` module cannot be compiled and
    required by the check script.
  </why-here>
  <action>
    1. `lib/taxonomy/sections.ts` — the CFF's own 20 groups as an ordered array
       of `{ key, cff, label }`, labels verbatim from REQUIREMENTS_V2 §2.2.

       Then the conditional map. One lookup keyed on property type:
       `PROPERTY_SHAPE: Record<PropertyType, Shape>` where `Shape` is
       `"plot" | "house" | "tower_unit" | "commercial_unit" | "industrial"`,
       and `SHAPE_RULES: Record<Shape, { sections: SectionKey[]; required: FieldKey[] }>`
       carrying the payload. Twenty-three hand-maintained field lists is
       twenty-three chances to get one wrong; five shapes is not. There is
       still exactly one place a property type is looked up, which is what R-12
       asks for — say so in the file header.

       The rules the SPEC names explicitly, and which the assertions below
       must pin:
       - `plot` (Residential / Industrial / Commercial / Institutional Plot,
         School Site, R Zone Land) omits Configuration, Furnishing and Parking;
         it keeps Area including front/depth, PLC, and the road-width and
         entrance-width specs. **A Residential Plot never asks for balconies.**
       - `tower_unit` (Flat/Apartment, Penthouse, Studio Apartment) requires
         `floorNumber` and `unitNumber`. **A tower flat always asks floor and
         unit.**
       - `house` (Independent House, Villa, Farm House, Builder Floor) keeps
         Configuration and Furnishing, keeps `totalFloors`, and does not ask
         for a unit number.
       - `commercial_unit` (SCO, Booth, Shop, Office Space, Showroom, Hotel,
         Hospital, Mixed Use Property) omits the BHK configuration and room
         flags, keeps floor and unit, keeps ceiling height and entrance width.
       - `industrial` (Warehouse, Industrial Shed) omits Configuration,
         Furnishing and Amenities; keeps ceiling height, road width, entrance
         width.

       Export `sectionsFor(propertyType)` and `requiredFieldsFor(propertyType)`.
       An unknown or empty type returns every section and requires nothing —
       never hide a field because a type was not recognised.

    2. `lib/admin/property-parse.ts` — move the existing pure helpers out of
       `actions.ts` unchanged (`parseOptionalInt`, `parseChoice`,
       `parseAmenities`, `parseExtras`, `parseImages`, `isAllowedImageUrl`) and
       move `parseProperty` with them. **Import nothing server-only** — no
       `db`, no `next/headers` — so `tsc` can compile the module standalone for
       the check script. `actions.ts` imports from it.

       Give `parseProperty(formData, mode: "draft" | "publish")` its mode flag
       now, before there are nine callers to retrofit. In `"draft"` mode the
       required-field checks (title beyond non-empty, description, at least one
       image, the conditional required fields) are skipped; every value that
       *is* present is still validated and still dropped when unknown. Publish
       mode additionally enforces `requiredFieldsFor(propertyType)`.

    3. CFF groups 2, 3, 7, 10, 11, 12 and 20, one `FormSection` each, split
       across `ClassificationSection` (2, 10, 11, 12), the existing
       `LocationSection` (3), `ConfigurationSection` (7) and
       `SpecificationsSection` (20). A section renders only when
       `sectionsFor(selectedType)` includes it; the selected type lives in
       `PropertyForm` state so the sections react to it live.
       - **2 Property Type**: `PROPERTY_TYPES` select plus a `dealAttributes`
         checklist (`DEAL_ATTRIBUTES`).
       - **3 Location**: already built — verify it covers country / city /
         locality / sector narrowing through `lib/locations.ts`
         (`localitiesIn`), then extend it with block, society, tower name,
         `floorNumber`, `totalFloors` and `unitNumber`. Keep the existing
         free-text `location` field: when it is left empty the action composes
         it from the structured fields, because every shipped public component
         renders `p.location` and must not start rendering blanks.
       - **7 Configuration**: `CONFIGURATIONS` select for units,
         `configurations` checklist for `kind === "project"` (a society
         advertises a range, one value cannot hold it), plus beds, baths,
         balconies and the `ROOM_FLAGS` checklist. Selecting a configuration
         pre-fills beds/baths/balconies/room flags from
         `CONFIGURATION_TEMPLATES` **into empty fields only** — never overwrite
         a hand-entered value (R-09).
         Existing rows carry free text like `"3+1 BHK"`, which is not in
         `CONFIGURATIONS`; `parseChoice` would silently blank it on the next
         save. Prepend the current value to the option list as its own entry
         when it is not in the taxonomy, the same trick the checklist widget
         uses for its chips.
       - **10 Facing**, **11 Possession**, **12 Property Age**: one select each.
       - **20 Specifications**: `roadWidth`, `entranceWidth`, `ceilingHeight`,
         `isCorner`, `isParkFacing`.

    4. Extend `scripts/check-taxonomy.mjs` with `lib/taxonomy/sections.ts` and
       `lib/admin/property-parse.ts` added to its `tsc` file list, asserting:
       - there are exactly 20 sections and their CFF numbers are 1…20 with no gaps;
       - every entry in `PROPERTY_TYPES` has a shape (no type falls through);
       - `sectionsFor("Residential Plot")` excludes the configuration section;
       - `requiredFieldsFor("Flat/Apartment")` contains both floor and unit;
       - `requiredFieldsFor("Residential Plot")` contains neither;
       - an unknown type returns all 20 sections and no required fields;
       - `parseProperty` in draft mode accepts a body with only a title, and in
         publish mode rejects the same body;
       - `parseChoice` still returns null for an unknown value rather than throwing.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; node scripts/check-taxonomy.mjs</automated>
  </verify>
  <done>
    Switching the property type select from Flat/Apartment to Residential Plot
    removes the Configuration section and the balconies field from the DOM and
    adds nothing that asks for a floor; switching back restores them and makes
    floor and unit required at publish. `actions.ts` is under 400 lines and
    contains no parse helper. The taxonomy check covers the map and both parse
    modes.
  </done>
</task>

<task type="auto">
  <name>Task 4: Area, features, and the legal / loan / documentation checklists</name>
  <files>
    components/admin/FeaturesSection.tsx,
    components/admin/PropertyForm.tsx,
    lib/admin/property-parse.ts,
    app/admin/(panel)/properties/actions.ts,
    scripts/check-taxonomy.mjs
  </files>
  <why-here>
    Eight of the nine checklist call sites land here, which is the payoff for
    Task 1. It also writes `areaSqft`, which Task 5's per-sq.ft rate and every
    Phase 4 area filter read — so it must precede the price work.
  </why-here>
  <action>
    CFF groups 5, 9, 13, 14, 15, 16 and 17, each in its own `FormSection`
    inside one file.

    - **5 Area**: `plotArea`, `builtUpArea`, `superArea`, `carpetArea` — each a
      number plus its own `AREA_UNITS` select, laid out from `AREA_MEASURES` so
      the order matches the CFF. Plus `frontFeet`, `depthFeet` and the
      `PLC_ATTRIBUTES` checklist. Keep the existing `areaValue`/`areaUnit`
      pair as the display area.
      The action writes `areaSqft` via `toSqft(areaValue, areaUnit)`, falling
      back down the ladder super → built-up → carpet → plot when `areaValue` is
      empty. It is a sort/filter key and is never rendered; the schema comment
      says as much. Assert the ladder in the check script, including that a 500
      sq.yd plot normalises above a 2000 sq.ft flat — that comparison is the
      whole reason the column exists.
    - **9 Furnishing**: `FURNISHINGS` select plus the `FURNISHING_ITEMS`
      checklist into `furnishingInventory`. Presence only — no per-item counts,
      per the SPEC default and CONTEXT.
    - **13 Loan**: `LOAN_FLAGS` checklist plus a free-add `banksOnPanel`
      checklist (`allowCustom`). The market-value-vs-circle-rate note is
      internal and belongs to Task 6, not here.
    - **14 Legal**: `LEGAL_FLAGS` checklist plus `reraNumber`. `Mortgaged` is
      deliberately not in this list — it lives on `property_internal` and is
      Task 6's field. Do not add it here.
    - **15 Amenities**: the existing checklist, unchanged, now inside a section.
      Add a one-line note under it that "Park Facing", "Corner" and "Covered
      Parking" belong in PLC and Parking now — existing listings keep those
      strings because amenities are free-add, and moving them is an admin
      tidy-up rather than a migration.
    - **16 Parking**: `PARKING_TYPES` checklist plus `parkingSlots`.
    - **17 Documentation**: `DOCUMENTATION_FLAGS` checklist into
      `documentationFlags`. Internal by default — it is absent from
      `PUBLIC_PROPERTY_COLUMNS` and must stay absent. The file upload for this
      section is Task 8; leave a section-level placeholder that Task 8 fills.

    All eight checklists use the generalised widget. Only amenities and banks
    on panel set `allowCustom` — the rest are validated against a fixed
    taxonomy, and free text would be silently dropped by the action, which is
    worse than not offering the box.

    Parsing: one array helper reused across all of them, taking the allowed
    list and a cap, dropping unknown values and de-duplicating. Where
    `allowCustom` is on, keep the admin's own string.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; node scripts/check-taxonomy.mjs</automated>
  </verify>
  <done>
    A saved property round-trips all four area measures with their own units,
    both furnishing halves, all six feature checklists and both loan lists.
    `areaSqft` is populated and correct for a marla and a kanal entry. Nothing
    from group 17 appears in `PUBLIC_PROPERTY_COLUMNS`.
  </done>
</task>

<task type="auto">
  <name>Task 5: Price and charges, with the computed all-in figure</name>
  <files>
    components/admin/PriceSection.tsx,
    components/admin/ChargesEditor.tsx,
    lib/admin/property-parse.ts,
    app/admin/(panel)/properties/actions.ts,
    scripts/check-taxonomy.mjs
  </files>
  <why-here>
    Needs `areaSqft` from Task 4 for the per-sq.ft basis, and it is the first
    task to write a child table — which sets the replace-inside-the-transaction
    pattern that Tasks 6, 7 and 8 all copy.
  </why-here>
  <action>
    CFF group 6, R-13.

    - `PriceSection.tsx`: `demandPrice` (rupees, whole numbers),
      `perSqftRate`, `isNegotiable`, and `showPricePublicly` — the last one
      labelled honestly, because off means the public page says "Price on
      request" and that is the standing brand behaviour, not a bug.
    - `ChargesEditor.tsx`: add/remove rows emitting one `chargesJson` hidden
      field. Per row: `chargeType` (`CHARGE_TYPES`), `amount`, `basis`
      (`CHARGE_BASES`), `isIncludedInDemand`, `publicVisible` (default off — a
      charge is published only when deliberately opened).
    - Live all-in figure rendered in the section from `allInPrice(demandPrice,
      charges, areaSqft)` and formatted with `formatIndianShort`. It returns
      null when the demand price is unknown; render "—", never a zero. A
      confidently wrong number on a money screen is worse than a blank.
      Show the derived per-sq.ft rate beside it.
    - Action: `parseCharges` caps at 20 rows, drops unknown types and bases,
      requires a non-negative integer amount, and drops rows with no type.
      Persist by delete-then-insert for that property id inside the existing
      transaction, exactly as images are handled.
    - **Do not build price history.** `property_price_history` exists in the
      schema, but writing to it is R-60, an `[ADDED]` item with no approval and
      not in this phase's requirement set. Leave a `// ponytail:` comment on
      the price update naming R-60 as the upgrade.
    - Circle rate is not in this section. It is `property_internal` and belongs
      to Task 6.

    Assertions in the check script: the worked case from the SPEC — a charge
    already included in the demand price is not double-counted; a percent
    charge resolves against the demand price; a per-sq.ft charge resolves
    against `areaSqft` and contributes zero when the area is unknown; a null
    demand price yields null rather than a total of the charges alone.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; node scripts/check-taxonomy.mjs</automated>
    <human-check>
      Enter ₹1,20,00,000 demand with three charges — one lump sum, one percent,
      one per sq.ft with an area set, and one of them flagged as already
      included. The all-in figure matches a hand calculation and updates as you
      type.
    </human-check>
  </verify>
  <done>
    Charges round-trip through `property_charges` with amount, basis and the
    included flag; the all-in total is correct including the excluded-charge
    case; nothing about price appears in a public payload beyond what
    `PUBLIC_PRICE_EXTRA` already resolves in SQL.
  </done>
</task>

<task type="auto">
  <name>Task 6: Ownership and the internal 1:1</name>
  <files>
    components/admin/OwnersSection.tsx,
    components/admin/OwnersEditor.tsx,
    lib/admin/property-parse.ts,
    app/admin/(panel)/properties/actions.ts,
    scripts/seed.mjs
  </files>
  <why-here>
    This is the task that gives the phase gate its teeth: after it, real owner
    phone numbers and real circle rates enter the database through the UI
    rather than from a seeded fixture. Every later task is verified against a
    row that now contains genuinely sensitive data.
  </why-here>
  <action>
    CFF group 8 (R-15) plus the internal 1:1 row.

    - `OwnersEditor.tsx`: add/remove owner rows emitting one `ownersJson`
      hidden field. Per owner: `name` (required for the row to count),
      `sellerCategory` (`SELLER_CATEGORIES`), `ownerType` (`OWNER_TYPES`),
      `ownerCount`, `mobile`, `altMobile`, `address`, `notes`. Multiple owners
      per property — joint ownership is the norm, so the editor starts with one
      row and adding a second must be one tap.
    - Click-to-call and click-to-WhatsApp per row: a `tel:` link and a
      `https://wa.me/<digits>` link built from the normalised number. Reuse
      whatever number-normalising helper `lib/whatsapp.ts` already exposes; add
      one there only if it does not. Normalise to bare digits with an optional
      leading 91, and keep the admin's original string if it does not parse —
      never refuse a save over a phone format.
    - Internal facts, in the same section but visually separated and labelled
      **Internal — never published**: `circleRate`, `marketValueNote`,
      `isMortgaged` (this is where CFF 14's Mortgaged lives, deliberately kept
      out of `LEGAL_FLAGS` so the public legal strip cannot render it),
      `internalNotes`, `nextFollowUpAt`.
    - Action: `parseOwners` caps at 10 rows and drops rows with no name.
      Persist owners by delete-then-insert inside the transaction; upsert
      `property_internal` on its primary key.
    - Attribution stays free text. **Do not build a user system** — R-54 named
      admin users is unapproved, so `addedBy`, `uploadedBy` and `changedBy` are
      strings a human types.
    - `scripts/seed.mjs` already inserts the leak-check owner and circle-rate
      fixture. Leave it alone; the point of this task is that the same values
      can now arrive from the form.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; ! grep -rn "propertyOwners\|propertyInternal" "app/(site)" lib/db/queries.ts</automated>
    <human-check>
      Add two owners with different mobiles to a published property. Both save
      and reload. The `tel:` and `wa.me` links open the right number. The
      property's public page shows neither name nor number.
    </human-check>
  </verify>
  <done>
    Multiple owners persist and reload; the internal 1:1 round-trips including
    circle rate; neither table is referenced by any public query or any
    component under `app/(site)/`.
  </done>
</task>

<task type="auto">
  <name>Task 7: Media categories and link media</name>
  <files>
    components/admin/ImageUploader.tsx,
    components/admin/MediaLinksEditor.tsx,
    components/admin/MediaSection.tsx,
    lib/admin/property-parse.ts,
    app/admin/(panel)/properties/actions.ts
  </files>
  <why-here>
    Independent of the price and owner work, but it must land before the
    document vault so that the upload route only changes once — Task 8 extends
    the same endpoint for private files.
  </why-here>
  <action>
    CFF group 19, R-28.

    - Extend the existing uploader: each image row gains a `mediaKind` select
      (`cover` / `interior` / `exterior` / `floor_plan` / `other`). **Exactly
      one cover per property, enforced twice** — client-side, choosing "cover"
      demotes any existing cover to "other"; server-side, `parseImages` keeps
      at most one cover and promotes the first image when none is marked, so a
      forged payload cannot produce a property with two covers or none.
      Keep the existing ordering behaviour: the list order is still the
      `sortOrder`, and the edit page's `IMAGE_ORDER` must keep matching it.
    - `MediaLinksEditor.tsx`: add/remove rows emitting `mediaLinksJson` into
      `property_media`. Kinds: video, drone, tour, map, brochure. Validate
      `https:` only and an allowlisted host per kind; drop anything else rather
      than storing a URL that a later phase might put in an iframe.
    - **Do not embed anything in this phase.** Rendering these links needs a
      CSP `frame-src` entry per host (`next.config.ts` currently allows only
      youtube-nocookie and instagram), and that lands with the public gallery
      in Phase 4. Storing is this phase; embedding is not. Put that in a
      comment next to the editor so nobody wires an iframe against an
      unvalidated URL in the meantime.
    - Image hosts are unchanged: uploads are same-origin `/api/images/<key>`
      and need no allowlist entry; the pasted-URL fallback stays restricted to
      the one stock host, and widening it means editing both
      `images.remotePatterns` and the action's host set or the public pages 500
      at render.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build</automated>
    <human-check>
      Upload four images, mark the third as cover, save, reload — the third is
      still the only cover. Add a video link and a Google Map link, save,
      reload — both persist. Delete the property; the uploaded files are gone
      from the public upload directory.
    </human-check>
  </verify>
  <done>
    A property carries a cover plus interior, exterior and floor-plan sets and
    up to five link-media rows; the one-cover rule holds against a hand-edited
    payload; delete still removes every stored file.
  </done>
</task>

<task type="auto">
  <name>Task 8: The internal document vault</name>
  <files>
    app/api/admin/documents/[key]/route.ts,
    app/api/admin/upload/route.ts,
    components/admin/DocumentVault.tsx,
    components/admin/FeaturesSection.tsx,
    lib/admin/property-parse.ts,
    app/admin/(panel)/properties/actions.ts,
    scripts/leak-check.mjs
  </files>
  <why-here>
    Fills the placeholder Task 4 left in the Documentation section, and reuses
    Task 7's uploader changes rather than editing the same route twice. It is
    the last field-carrying task, so Task 9's autosave covers the complete set.
  </why-here>
  <action>
    R-29. Storage already exists — this is wiring, not new infrastructure.

    1. `app/api/admin/upload/route.ts` — accept a `kind` form field of
       `image` or `document`, default `image`, and pass it to
       `storeFile(file, kind)`. Documents land under `private/` because
       `storeFile` decides visibility from the kind; privacy is the directory,
       not a flag anyone has to remember to check. One route, no second
       endpoint.
    2. `app/api/admin/documents/[key]/route.ts` — the stream route.
       - `requireAdmin()` inside a try/catch, and **return 404 on failure, not
         401 and not a redirect**. A redirect to the login page confirms the
         document exists to an anonymous caller, and the requirement is
         explicit about no redirect leak. Returning the same 404 for
         unauthorised and for missing means the route reveals nothing either way.
       - Look the row up in `property_documents` by storage key. Serving only
         known rows means a leaked private key alone is not enough, and it is
         where the filename comes from — sanitised, from the database, never
         from the request.
       - Then `openStoredFile(key, "private")`, and stream with
         `Content-Disposition: attachment; filename="…"`,
         `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`
         and `X-Robots-Tag: noindex, nofollow`.
       - **`proxy.ts` matches `/admin/:path*` and does not cover `/api/admin/*`.**
         This route's own `requireAdmin()` is the only gate on it. State that in
         the file header so nobody later assumes the proxy is covering it.
    3. `components/admin/DocumentVault.tsx` — per-property upload list inside
       the Documentation section. Each row: `docType` (`DOCUMENTATION_FLAGS`),
       the uploaded file, `note`, `uploadedBy` (free text — no user system),
       and the uploaded timestamp. Emits `documentsJson`.
    4. Action: insert and delete `property_documents` rows. Deleting a document
       removes the row first and the private file second, matching the rule the
       shipped code already follows. **The SPEC text says the opposite** —
       "delete remote object before the DB row" — but the repo's own comments
       explain why rows go first: an unreferenced file on disk is harmless and
       sweepable, while a row pointing at bytes that are already gone is a
       broken download. Follow the code, and leave a comment naming the
       contradiction so the next reader does not "fix" it back.
    5. `deleteProperty` currently collects image storage keys only. The
       cascade removes `property_documents` rows but leaves private files on
       disk forever. Collect the document keys too and call
       `deleteStoredFiles(keys, "private")`.
    6. `scripts/leak-check.mjs` — add a `LEAK_PAGES` environment override
       mirroring the existing `LEAK_NEEDLES` one, because the page list is
       hardcoded to the seeded slug and Task 11 needs to point it at an
       admin-entered property. Add the seeded document's filename and storage
       key to the default needles, so a document reaching a sitemap or a
       bundle is a hard failure rather than something a reviewer has to notice.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; node scripts/leak-check.mjs</automated>
    <human-check>
      Upload a PDF against a property. Copy its URL. In a private window with
      no session, the URL returns 404 with no redirect to the login page.
      Logged in, it downloads as an attachment rather than rendering inline.
      The URL appears in neither `/sitemap.xml` nor the property page's JSON-LD.
    </human-check>
  </verify>
  <done>
    Documents upload to private storage, list per property with uploader and
    timestamp, download only for an authenticated admin, return 404 with no
    redirect otherwise, and are removed from disk when the property is deleted.
  </done>
</task>

<task type="auto">
  <name>Task 9: Draft autosave and the sticky save bar</name>
  <files>
    app/admin/(panel)/properties/actions.ts,
    components/admin/PropertyForm.tsx,
    components/admin/SaveBar.tsx,
    lib/admin/property-parse.ts
  </files>
  <why-here>
    Last, because autosaving a half-built form is churn — the parse mode flag
    from Task 3 has to be honoured by every field that Tasks 4–8 added before
    autosave is worth turning on. It is also what makes GAP-01 matter, which is
    why the slug fix had to be Task 1.
  </why-here>
  <action>
    §4.5 and success criterion 3. **Native only — `setInterval`, `fetch` of a
    server action, `FormData`. No library.**

    - New action `saveDraft(formData)` in the existing module, same shape as
      the others: `requireAdmin()` first line, `parseProperty(formData,
      "draft")`, honest errors, returning `{ id, savedAt }` so the client can
      show a timestamp and, on a first save, learn the new row's id.
    - **What "draft" means for a row that must not reach the public site:**
      - `saveDraft` never writes `publicationState` or `listingStatus`. A new
        row is inserted at the schema default of `draft`; an existing published
        row keeps its state. Autosave must not be able to publish a draft, and
        must not be able to unpublish a live listing.
      - Autosave does not start until `title` is non-empty. `title` is
        `notNull`, and a broker who opens the form and walks away should not
        leave an empty row behind.
      - Draft mode resolves an **existing** project by name only and never
        creates one. Otherwise typing "Green" creates a project called "Green"
        twenty seconds later.
      - `revalidatePublicSite()` fires only when the row being autosaved is
        already `published` — a draft cannot be public, so revalidating on it
        would churn the public cache every twenty seconds for nothing.
      - `updatedAt` does move on autosave. It is a real edit and "Last Updated"
        should say so; note in a comment that this makes the Phase 6
        "not updated in 30+ days" tile measure attention, not staleness.
    - Client: a ref-held dirty flag set on the form's `onInput`/`onChange`, a
      20-second `setInterval` that skips when not dirty or when a submit is in
      flight, `new FormData(formRef.current)` on tick, and the returned id
      written into the hidden `id` input so the second autosave updates instead
      of inserting a second row. Clear the interval on unmount.
    - `SaveBar.tsx` — `sticky bottom-0` bar carrying the submit button, the
      publication-state control and an `aria-live="polite"` status reading
      "Saving…" / "Saved 12:04" / "Save failed — your work is still in this
      tab". With twenty sections the submit button is otherwise thousands of
      pixels below the fold on a phone, which on its own would fail the mobile
      requirement.
    - The failure message matters more than the success one. A broker on
      hotel wifi needs to know the last twenty seconds did not persist, and
      that the tab still holds the work.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; node scripts/check-taxonomy.mjs</automated>
    <human-check>
      Open Add Property, type a title and three fields, wait 25 seconds for
      "Saved". Kill the tab. The admin list shows the draft; opening it for
      edit shows the three fields. Confirm the public site does not show it.
      Then open a *published* property, change one field, wait for autosave —
      it is still published, and the public page reflects the change.
    </human-check>
  </verify>
  <done>
    A half-entered listing survives a closed tab; autosave never changes a
    publication state in either direction; no empty rows are created; the save
    bar reports success, failure and in-flight state.
  </done>
</task>

<task type="auto">
  <name>Task 10: Admin list at scale and the navigation it sits in (R-34, R-33)</name>
  <files>
    lib/db/queries.ts,
    app/admin/(panel)/properties/page.tsx,
    app/admin/(panel)/properties/PropertyFilters.tsx,
    app/admin/(panel)/layout.tsx
  </files>
  <why-here>
    Sequenced late and kept to four files on purpose. **R-34 is one of the four
    "implied" requirements in PROJECT.md Open Item 3.** If the client re-tags it
    `[ADDED]`, this task is reverted as a single commit and criteria 1–5 are
    untouched — its pagination then folds into Phase 9's R-75. Nothing in Tasks
    2–9 may import from `PropertyFilters.tsx`.
  </why-here>
  <action>
    - Extend `listPropertiesForAdmin()` with search, filters, sort and paging.
      Search `q` across ref code, title, locality, project name, owner name and
      owner mobile — the owner join is legitimate here because this is the
      admin query and `property_owners` is never touched by a public one.
      Filters: listing status, publication state, property type, collection,
      city, added-by. Sort: newest, oldest, recently updated, days on market.
      Page size 25 with a total count.
    - `PropertyFilters.tsx` is a plain `<form method="get">` with native
      selects and a submit. **URL as state** — it survives refresh and the back
      button, it is shareable, and it needs no client state at all. Do not
      reach for a client store here.
    - Row: ref code, cover thumbnail, title, status badge, publication state,
      city, last-updated, added-by. Status colour legend above the table using
      `STATUS_BADGE`, so the badges mean something without hovering.
    - **Do not build bulk status change or bulk export.** Both are marked
      **CONFIRM** in R-34 and have no client answer yet.
    - Search is `ILIKE` and will sequential-scan. Leave a `// ponytail:`
      comment naming that ceiling and R-75 (B-tree indexes and pagination,
      Phase 9) as the upgrade trigger — the existing indexes cover the
      publication and city filters, not the text search.
    - Nav (R-33): the panel header must be usable at 360px — wrap or
      horizontally scroll rather than overflowing. **Add no dead links.** The
      full IA the SPEC lists (Builders, Towers, Leads, CRM, Settings, Users)
      arrives with the pages that back it in Phases 3, 5, 6 and 7; a `#` link
      is explicitly banned by Phase 7's criterion 4, and adding one now just
      creates work to remove later.
  </action>
  <verify>
    <automated>npm run lint &amp;&amp; npm run build &amp;&amp; ! grep -rn "PropertyFilters" components lib "app/(site)"</automated>
    <human-check>
      With at least a dozen properties, filter to Sold and confirm the count and
      the legend. Search a ref code, an owner phone and a locality — each
      returns the right rows. Refresh and use the back button; the filter state
      survives both. Page two loads. The header does not overflow at 360px.
    </human-check>
  </verify>
  <done>
    Search, six filters, four sorts and pagination all work off the URL; the
    row carries ref code, thumbnail, badge, city, last-updated and added-by;
    the whole task is one revertable commit with no importers elsewhere.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 11: 360px pass and the phase gate</name>
  <what-built>
    The complete sectioned CFF form, autosave, the document vault, the child-table
    editors and the admin list.
  </what-built>
  <how-to-verify>
    **A · Mobile at 360px — a real requirement, not a courtesy.** Brokers enter
    listings from a phone at a site visit. In devtools at 360×740, on
    `/admin/properties/new`:
    1. No horizontal scrollbar anywhere on the page, with every section expanded.
    2. Every input and select renders at 16px or larger. Check the `--text-body`
       clamp minimum in `app/globals.css`: below 16px, iOS Safari zooms the
       viewport on focus and the broker is fighting the page after every field.
    3. Section summary rows and checkbox labels are at least 44px tall as tap
       targets.
    4. Multi-column grids collapse to one column; the checklist widget uses its
       two-column mode.
    5. The sticky save bar stays reachable with the on-screen keyboard open.
    6. Open all 20 sections and scroll the whole form — no layout jump, no
       overlapping controls.
    7. **The select decision, measured rather than assumed.** The form now
       mounts thirty-plus `components/ui/Select.tsx` instances — a custom
       listbox with `AnimatePresence` each. Open every section on a throttled
       mobile profile and check interaction latency. If it drags, the fix is a
       native `<select>` styled with the shared `FIELD` class (whose comment
       already says it exists to normalise native selects) used for the admin
       form only, leaving the public site's `Select` untouched. Do not
       pre-emptively rewrite thirty working call sites — measure first, and
       record the number either way so the next phase is not guessing.

    **B · G3 build gate**
    ```
    npm run lint && npm run build
    ```

    **C · Taxonomy gate**
    ```
    node scripts/check-taxonomy.mjs
    ```

    **D · G2 leak gate — the run that has teeth.** Phase 1's leak check passed
    against seeded fixtures. This is the first phase where the values arrive
    through the UI, so run it against real admin-entered data, not the seed:
    ```
    npm run build && npm start
    ```
    Log in, create a property through the form with a known owner mobile, a
    known circle rate and at least one uploaded document. Publish it. Then:
    ```
    LEAK_PAGES="/,/properties,/properties/<new-slug>,/api/search?q=<term>,/sitemap.xml" \
    LEAK_NEEDLES="<owner-mobile>,<circle-rate>,<ref-code>,<document-filename>" \
    node scripts/leak-check.mjs
    ```
    Zero hits, or the phase is not done. The ref code is in the needle list on
    purpose — success criterion 4 requires that it appears in no public HTML or
    JSON, and it is the one internal value that is easy to leak by accident
    because it looks like a harmless label.

    **E · G1 coverage.** Walk REQUIREMENTS_V2 §10 groups 1–20 against the form
    and tick each row at the "editable in admin" level. Confirm no previously
    ticked row regressed. Any row that cannot be ticked is reported, not
    quietly skipped.
  </how-to-verify>
  <resume-signal>
    Type "approved" with the leak-check output, or list the failing checks.
  </resume-signal>
</task>

</tasks>

---

<threat_model>

## Trust boundaries

| Boundary | Description |
|---|---|
| browser → server action | Every field of a ~150-field form arrives as attacker-controllable `FormData`. |
| browser → `/api/admin/upload` | Arbitrary bytes with an attacker-declared MIME type. |
| browser → `/api/admin/documents/[key]` | An opaque key requesting private bytes, possibly with no session. |
| admin row → public query | The line the whole project is built to defend (§4.1). |
| admin-entered text → rendered HTML | Owner names, notes and source names typed by a human. |

## STRIDE register

| ID | Category | Component | Severity | Disposition | Mitigation |
|---|---|---|---|---|---|
| T-02-01 | Spoofing | `/api/admin/documents/[key]` | critical | mitigate | `requireAdmin()` inside the handler; `proxy.ts` matches `/admin/:path*` only and does **not** cover it (Task 8). |
| T-02-02 | Information disclosure | same route | critical | mitigate | 404 for both unauthorised and missing; no redirect to login, which would confirm existence. |
| T-02-03 | Information disclosure | `property_owners`, `property_internal` | critical | mitigate | Never referenced by a public query; enforced by the Task 6 grep gate and the Task 11 leak run against admin-entered values. |
| T-02-04 | Elevation of privilege | `saveDraft` | high | mitigate | `requireAdmin()` first line; the action never writes `publicationState` or `listingStatus`, so autosave cannot publish. |
| T-02-05 | Tampering | `parseImages` cover flag | medium | mitigate | Server keeps at most one cover regardless of payload; the client-side demotion is convenience, not the control. |
| T-02-06 | Tampering | image `storageKey` | high | mitigate | Already derived from the URL, never taken from the client — a forged key would otherwise delete an unrelated file. Preserve this when extending the parser. |
| T-02-07 | Information disclosure | `mediaLinksJson` → future iframe | medium | mitigate | https-only host allowlist on write; **no embedding in this phase**, because each host needs a CSP `frame-src` entry (Phase 4). |
| T-02-08 | Denial of service | autosave every 20s | medium | mitigate | GAP-01's bounded slug scan (Task 1); autosave gated on a dirty flag and a non-empty title; upload route already rate-limited. |
| T-02-09 | Tampering | document filename in `Content-Disposition` | medium | mitigate | Filename read from the `property_documents` row and sanitised — never echoed from the request. |
| T-02-10 | Repudiation | who marked a listing sold | low | accept | Requires R-54 named users, which is unapproved. `addedBy` and `uploadedBy` stay free text; the audit log is R-54's, not this phase's. |
| T-02-11 | Information disclosure | `unitNumber` | low | accept | Treated as internal pending the client's answer; already absent from `PUBLIC_PROPERTY_COLUMNS`. Re-evaluate on the §11 item 14 answer. |

</threat_model>

---

<verification>

## Phase gate

| Gate | Command | Notes |
|---|---|---|
| G3 build | `npm run lint && npm run build` | Migrations run as part of the build script. |
| Taxonomy | `node scripts/check-taxonomy.mjs` | Grows in Tasks 1, 3, 4, 5. |
| G2 leak | `node scripts/leak-check.mjs` with `LEAK_PAGES` / `LEAK_NEEDLES` | Against a production build and an **admin-entered** property. First phase where this bites. |
| G1 coverage | Manual §10 walk, groups 1–20 | Ticked at the "editable in admin" level. |

## Success criteria, mapped

| ROADMAP criterion | Delivered by | Proven by |
|---|---|---|
| 1 · every CFF field editable, 20 sections with filled/total, no single 150-field page | 2, 3, 4, 5, 6, 7, 8 | §10 walk + the 360px pass |
| 2 · a plot never asks for balconies, a tower flat always asks floor and unit, one map | 3 | `check-taxonomy.mjs` assertions on `sectionsFor` / `requiredFieldsFor` |
| 3 · drafts autosave ~20s, only published + Available reaches the public site | 9 (with 2's admin query) | Task 9 human-check |
| 4 · unique never-reused ref code, status filter with legend, none of it public | 2, 10 | Task 11 leak run with the ref code as a needle |
| 5 · unauthenticated document request 401/404 with no redirect leak | 8 | Task 8 human-check + the document needle |
| 6 · save latency does not scale with inventory (GAP-01) | 1 | slug-pattern assertions; no unfiltered scan on the write path |

## Requirement coverage

| Req | Where |
|---|---|
| R-07 ref code, dates, source, status | Task 2 (generation, admin display), Task 10 (status filter + legend), Task 11 (leak needle) |
| R-13 price and all charges | Task 5 |
| R-15 ownership, internal | Task 6 |
| R-28 media categories | Task 7 |
| R-29 document vault | Task 8 |
| R-33 navigation IA | Task 10 (mobile header; the rest of the IA arrives with its pages) |
| R-34 list at scale | Task 10 — **carve-out, single revertable commit** |
| GAP-01 unfiltered slug scan | Task 1 |
| R-08 location from the shared taxonomy | Task 3 |
| R-09 configuration templates | Task 3 |
| R-10 / R-11 / R-14 / R-16 / R-20 / R-24 field groups | Tasks 3, 4 |
| R-12 conditional map | Task 3 |

## Explicitly not built

| Item | Why |
|---|---|
| Named admin users, roles, audit log (R-54) | Unapproved. Attribution stays free text. |
| Price history writes (R-60) | `[ADDED]`, unapproved, not in this phase's requirement set. |
| Per-item furnishing counts ("AC ×3") | SPEC default is presence only, confirmed in CONTEXT. |
| Bulk status change / bulk export | Marked **CONFIRM** in R-34. |
| Iframe embedding of link media | Needs a CSP `frame-src` entry per host — Phase 4. |
| Owner-phone duplicate detection (R-58) | `[ADDED]`, unapproved. The index exists for it. |
| Text-search indexes / pagination tuning (R-75) | Phase 9 `[ADDED]`; named as a ceiling in a `// ponytail:` comment. |

</verification>

<success_criteria>
- 20 collapsible sections, each with a live filled/total count; no page carries all ~150 fields.
- One property-type map drives every conditional section, asserted in `check-taxonomy.mjs`.
- Drafts autosave within ~20s, never publish or unpublish, and never create empty rows.
- Every property has a unique, never-reused ref code, visible with a status badge in the admin.
- `npm run lint && npm run build` green; `node scripts/check-taxonomy.mjs` passing.
- `node scripts/leak-check.mjs` clean against a production build with an admin-entered owner phone, circle rate, ref code and document filename as needles.
- The form is usable at 360px: no horizontal scroll, ≥16px inputs, ≥44px tap targets, reachable save bar.
- R-34's work is one revertable commit with no importers elsewhere.
</success_criteria>

<output>
Create `.planning/phases/02-admin-property-form-rebuild/02-01-SUMMARY.md` when done.
</output>
