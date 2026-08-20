# Coding Conventions

**Analysis Date:** 2026-08-20

## Ponytail Discipline

This repo locks in "ponytail" conventions for all code (per `CLAUDE.md` → `docs/TECH_STACK.md#ponytail-conventions`):

**The ladder:** does it need to exist → reuse what's already in the codebase → native platform/CSS → already-installed dependency → one line → minimum code. No new npm dependency when Tailwind/CSS/native HTML covers it.

**No speculative abstraction:** no prop for a variant that doesn't exist yet, no config object for a value that never changes, no generalized component built for hypothetical future cases.

**`// ponytail:` comments** mark deliberate shortcuts, naming the shortcut's ceiling and its upgrade trigger. Real examples:

- `lib/rate-limit.ts:1-2`:
  ```ts
  // ponytail: in-memory throttle (per server instance) — move to a shared
  // store if the site ever scales horizontally.
  ```
  This is the canonical example — in-memory `Map`-based rate limiting instead of Redis/Upstash, with the explicit upgrade trigger ("if the site ever scales horizontally").

- `app/admin/(panel)/deals/DealCreateForm.tsx:92`:
  ```tsx
  {/* ponytail: native date inputs — a picker lib adds nothing here */}
  ```
  Native `<input type="date">` chosen over a date-picker library — rung 4 of the ladder (native platform feature) applied directly.

When writing new shortcuts, follow this exact shape: `// ponytail: <what was skipped>, <upgrade trigger>.`

## Comment Style — WHY, Not WHAT

Comments in this codebase explain **non-obvious reasoning**, not what the code visibly does. They are often multi-line, sit directly above the code they justify, and read as design notes for the next reader. This density is deliberate — match it, don't strip it down to one-liners.

Real examples:

- `app/globals.css:44-46` (why `overflow-x: clip` and not `hidden`):
  ```css
  /* Pinned/transformed sections must never cause sideways jiggle on
     mobile; clip (not hidden) keeps position: sticky working. */
  overflow-x: clip;
  ```

- `app/admin/(panel)/properties/actions.ts:29-31` (why Cloudinary delete is host-restricted):
  ```ts
  // Only ids inside our upload folder may reach the Cloudinary delete path —
  // a forged publicId must never be able to delete arbitrary account assets.
  const OWNED_PUBLIC_ID = /^global-landmark\/properties\//;
  ```

- `app/admin/(panel)/properties/actions.ts:249-252` (why a race-losing insert is retried, not rejected):
  ```ts
  // Lost a race or slug collision — re-read by name, then by slug (a new
  // name can slugify to a taken slug; without this the association would
  // silently drop to null).
  ```

- `lib/rate-limit.ts:19-22` (why eviction only touches per-key buckets):
  ```ts
  // Memory backstop: evict per-key buckets only — the :g buckets are the
  // spoofing backstop and must survive (an attacker fabricating keys must
  // not be able to reset the global caps).
  ```

Pattern to follow: state the risk/consequence being defended against ("without this X would silently happen"), not a restatement of the line below it.

## Server Components by Default

Default every `app/**` file to a Server Component. Add `"use client"` only where interactivity or animation genuinely requires it — forms, GSAP/Framer-driven components, filter state (`docs/TECH_STACK.md` line 81). Section-level composites in `components/sections/` and primitives in `components/ui/` stay Server Components unless they hold state or run browser-only libraries.

## Server Action Shape

Canonical example: `app/admin/(panel)/properties/actions.ts` (385 lines). All admin mutation actions (`app/admin/(panel)/deals/actions.ts`, `app/admin/(panel)/projects/actions.ts`, `app/admin/(panel)/testimonials/actions.ts`) follow the same shape:

1. **Typed `FormState`** — `export type PropertyFormState = { error?: string };` passed as the return type of every action and as `_prev` param (React `useActionState` shape).
2. **`await requireAdmin()` as the first line** inside every exported action (`actions.ts:273`, `:302`, `:355`, `:382`) — auth check happens before any parsing or DB work.
3. **Validate-then-act.** A private `parseProperty(formData)` function runs all field parsing and returns a discriminated result `{ ok: true, data } | { ok: false, error }`. The action bails immediately on `!parsed.ok` before touching the database.
4. **Parse helpers drop unknown values instead of throwing:**
   - `parseChoice(value, allowed)` (`actions.ts:85`) — returns `null` for empty/unrecognized values, never throws. Comment: "Empty or unknown values become null — never a hard failure."
   - `parseAmenities(json)` (`actions.ts:93`) — JSON-parses, caps at 40 items, de-dupes via `Set`, drops non-string entries by returning `null` for the whole array (fails closed on malformed shape, silently trims individual bad entries otherwise).
   - `parseExtras(json)` (`actions.ts:110`) — same shape, caps at 20 items, trims `title`/`description` to length limits, drops entries with an empty title.
   - `parseImages(json)` (`actions.ts:50`) — validates URL host against an allowlist (`IMAGE_HOSTS`), caps at `MAX_IMAGES = 20`, strips `publicId` to `null` unless it matches `OWNED_PUBLIC_ID`.
   - `parseOptionalInt(value)` (`actions.ts:75`) — returns `number | null | "invalid"`; `null` means "not provided", `"invalid"` means "provided but bad" — callers branch on the sentinel string rather than throwing.
5. **Honest user-facing error strings** — e.g. `"A title is required."`, `"Choose a valid category."`, `"Could not save the property. Check the fields and try again."` — never a raw exception message or generic "Something went wrong."
6. **`revalidatePublicSite()` last, before `redirect()`** — every mutating action calls `revalidatePublicSite()` (`lib/admin/revalidate.ts`) immediately after a successful DB write, then `redirect(...)` back into the admin panel (`actions.ts:294-295`, `:345-346`, `:376-377`). Never redirect before revalidating.
7. Unexpected DB errors are caught, logged with `console.error("createProperty failed:", err)`, and converted to a generic user-facing error string — the raw error never reaches the client.

## Styling

Tailwind v4 utilities only, driven by the `@theme` tokens defined in `app/globals.css:10-39`. Never hardcode a hex value in component code — always reference a token class.

**Color tokens:** `ink`, `ink-muted`, `dark`, `dark-deep`, `gold`, `gold-highlight`, `gold-deep`, `cream`, `border`, `error` (e.g. `bg-cream`, `text-ink-muted`, `border-border`, `text-error`).

**Fluid type tokens:** `text-eyebrow`, `text-body`, `text-meta`, `text-h4`, `text-h3`, `text-h2`, `text-h1` — each a `clamp()` value with a matched `--line-height` pair, so classes like `text-h1` carry both size and line-height.

**Spacing:** no custom spacing tokens exist in `@theme` — spacing uses Tailwind's built-in DEFAULT scale (`p-4`, `gap-8`, etc.) directly. Do not invent spacing tokens.

Gold is an accent per `CLAUDE.md` — dividers, hover states, emphasis — never a fill color for large surfaces.

## Naming

- **Components:** PascalCase (`DealCreateForm.tsx`).
- **Helpers/functions:** camelCase (`parseChoice`, `resolveProjectId`, `uniqueSlug`).
- **Slugs/URLs:** kebab-case, generated via `lib/slugify.ts`.
- **`lib/` modules named by domain**, not by type: `lib/rate-limit.ts`, `lib/cloudinary.ts`, `lib/categories.ts`, `lib/attributes.ts`, `lib/slugify.ts`, `lib/seo.ts`, `lib/email.ts`, `lib/whatsapp.ts`, `lib/video.ts`, `lib/images.ts`, `lib/news.ts`, `lib/gsap.ts`, `lib/motion.ts`, `lib/hooks.ts`, `lib/data.ts` — one file per concern, no generic `utils.ts` catch-all.

## Single-Source-of-Truth Files

- `lib/data.ts` — all company copy (marketing text, agent bios, etc.) lives here, not scattered inline in components.
- `lib/attributes.ts` — taxonomy constants for listings: `PROPERTY_TYPES`, `AREA_UNITS`, `FACINGS`, `POSSESSION_STATUSES`, `FURNISHINGS`. Server actions validate against these via `parseChoice`.
- `lib/categories.ts` — the category axis (`sale` / `purchase` / `lease` / `invest`), exposing an `isCategory()` type guard used at every server-action validation boundary (`actions.ts:16`, `:236`).

Component code should import from these files rather than re-declaring option lists or copy inline.

---

*Convention analysis: 2026-08-20*
