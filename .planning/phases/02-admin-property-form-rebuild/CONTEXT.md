# Phase 2 Context — Admin Property Form Rebuild

Captured from the SPEC (`docs/REQUIREMENTS_V2.md` §4.5, R-07/13/15/28/29/33/34)
and from what Phase 1 actually shipped. The ROADMAP entry predates the storage
decision below, so where they disagree this file wins.

## What Phase 1 already built — reuse, do not re-derive

- **Taxonomy** lives in `lib/taxonomy/{property,area,price,features,status,collections}.ts`
  and `lib/locations.ts`, re-exported through `lib/attributes.ts` so existing
  imports keep working. Every list the form needs already exists at full CFF
  length: 23 property types, 12 configurations with `CONFIGURATION_TEMPLATES`
  for room pre-fill, 31 amenities in display groups, 7 area units with
  `toSqft`, PLC / parking / legal / documentation / loan checklists, 11 charge
  types with `CHARGE_BASES` and `allInPrice()`, 7 listing statuses with
  `STATUS_BADGE` and `isPubliclyVisible()`, `refCode()`, and the six-collection
  derivation. **Do not add a new list without adding it to
  `scripts/check-taxonomy.mjs`.**
- **Schema** carries every CFF column plus the internal sibling tables:
  `property_owners`, `property_internal`, `property_charges`,
  `property_documents`, `property_price_history`, `builders`, `towers`,
  `property_media`, `leads`, `site_settings`.
- **The public boundary** is `lib/db/public-columns.ts`. Public components take
  `PublicPropertyWithMedia`; the admin is the only place that may touch
  `AdminProperty`. Price is resolved in SQL (`PUBLIC_PRICE_EXTRA`), never
  selected raw — Phase 1's leak check caught exactly that mistake.
- **Migrations** are real SQL in `drizzle/`, applied by `drizzle-kit migrate`.
  `drizzle-kit push` is no longer part of the build. Any column move or rename
  needs a reviewed migration; additive columns still just generate cleanly.

## Storage — changed after the ROADMAP was written

Uploads are **local filesystem**, not Cloudinary and not database blobs.
`lib/storage.ts` owns it:

- `storeFile(file, "image" | "document")` validates type by magic number,
  caps at 8 MB, writes to `$UPLOAD_DIR/{public,private}/<ab>/<sha256>.<ext>`.
- `openStoredFile(key, visibility)` streams a file back.
- `deleteStoredFiles(keys, visibility)`.
- Privacy is the **directory**, not a flag: the public route resolves only
  under `public/`, so a document is unreachable from it by construction.

**The document vault (R-29) is therefore mostly wiring, not new
infrastructure.** It needs `storeFile(file, "document")`, a
`property_documents` row, and an admin-gated stream route that calls
`requireAdmin()` before `openStoredFile(key, "private")`. Serve with
`Content-Disposition: attachment`.

`UPLOAD_DIR` must be a persistent disk. It is not on Vercel — flagged to the
client, not this phase's problem to solve.

## Conventions this phase must not break

- **Native inputs only.** `<input type="date">`, `<select>`, checkboxes. No
  date picker, form library, state manager or component library.
- **Server action shape**, per `app/admin/(panel)/properties/actions.ts`:
  typed `FormState`, `requireAdmin()` as the first line, parse helpers that
  drop unknown values rather than throwing, honest user-facing errors,
  `revalidatePublicSite()` last, `redirect()` after success.
- **Design tokens only** — the real ones are `ink`, `ink-muted`, `dark`,
  `dark-deep`, `gold`, `gold-highlight`, `gold-deep`, `cream`, `border`,
  `error`, with fluid type `text-eyebrow` / `text-body` / `text-meta` /
  `text-h1`..`text-h4`. There is no custom spacing scale; use Tailwind's
  default. `docs/TECH_STACK.md`'s `navy` / `off-white` names are stale.
- **No GSAP, no Lenis, no scroll animation in the admin.** It is a tool.
- **Mobile matters here specifically** — brokers enter listings from a phone
  at a site visit. Test the form at 360px.
- Every non-trivial helper ships one assert-based check. No test framework.

## Known refactors to fold in, not to do separately

1. **`AmenitiesField` generalises to `ChecklistField`.** It is currently
   hardcoded to `SUGGESTED_AMENITIES` and the field name `amenitiesJson`. This
   phase needs the same checkbox-plus-free-text widget for parking, PLC, room
   flags, documentation, legal, loan, furnishing inventory and banks on panel —
   eight call sites. One component taking `name` / `options` / `allowCustom`.
   This is a real abstraction with eight users, not speculation.
2. **`FIELD` is defined twice** — in `components/form-classes.ts` and again
   locally in `components/admin/PropertyForm.tsx`. Collapse to the shared one.
3. **GAP-01: `uniqueSlug()` selects every property row on every save**
   (`actions.ts`). Harmless at 6 rows, acute once ~20s autosave is firing
   against a real portfolio. Fix with a targeted `where` on the candidate
   slugs rather than a full scan.

## Open questions — build the default, do not block

- **R-34 is one of the four "implied" requirements** (PROJECT.md Open Item 3).
  It ships on the §6 reading. Keep its pagination separable so a client re-tag
  drops it without disturbing the rest.
- **Unit number** is treated as internal until the client answers; it is
  already absent from `PUBLIC_PROPERTY_COLUMNS`.
- **Per-item furnishing counts** ("AC ×3") are not built — presence only, per
  the SPEC default.
- **Named admin users (R-54) are not approved**, so `uploadedBy` /
  `changedBy` / `addedBy` attribution is free text for now. Do not build a
  user system in this phase.

## The gate that has teeth this time

Phase 1's leak check passed against seeded fixtures. **This phase is the first
where owner phone numbers, circle rates and brokerage figures are entered
through the UI into real rows**, so `node scripts/leak-check.mjs` is the
acceptance test that matters. Run it against a production build with an
admin-entered property, not just the seed.
