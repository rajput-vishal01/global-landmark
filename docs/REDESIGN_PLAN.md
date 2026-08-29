# Redesign & Revamp Plan — "Calm & Complete" (v3)

**Status:** in progress — Phases A, B, C, D, F shipped; E in flight; G/H pending. **Branch:** to be cut from `feat/requirements-v2`.
**Written:** 2026-08-29. **Reference:** client-supplied screen recording + live https://yhataw.com

---

## 1. What I actually reviewed

- The client's screen recording (2:06, 38 sampled frames) — a full walkthrough of **YHATAW**,
  a Gurgaon real-estate portal, covering the homepage, a city listing page, and two property
  detail pages including a PDF brochure download.
- The live site at yhataw.com, to read the parts the recording skimmed (hero search
  taxonomy, area counts, testimonials, footer).

## 2. Reading the brief correctly

The instruction that matters most: **"everything is perfect, in fact better right now — we
want a better version of the product with less animations"** and **"we don't want to remove
any feat, rather we want to add more."**

So this is **not** a rewrite into YHATAW. Stated plainly:

> YHATAW is the *less attractive* site but the *more useful* one. It is denser, calmer,
> easier to scan, and has more ways to convert. Our site looks considerably better but is
> thinner functionally and much heavier on motion. The client has mistaken "hard to use"
> for "wrong style."

**The plan is therefore: keep our visual quality, adopt their information architecture and
utility, and cut the motion.** We do not adopt their navy-and-yellow chrome or their
cluttered footer aesthetic. Nothing existing is deleted.

Three explicit asks folded in:

1. **Less gold** — gold becomes a reserved accent, not a surface treatment.
2. **More white** — true white becomes the dominant surface; cream steps back.
3. **Fewer animations** — scroll-driven timelines go; small, purposeful transitions stay.

## 3. Gap analysis — what the reference has that we do not

| # | Reference feature | Our state | Admin work needed |
|---|---|---|---|
| 1 | Hero search: City + Property Type + Status | Simple search box | None — taxonomy already in DB |
| 2 | **Area/locality landing pages with counts** ("location feats") | **Missing** (R-46) | **New**: areas CRUD — cover image, blurb, order, publish |
| 3 | Status badges (New Launch / Ready to Move / Under Construction / Delivered) | `possessionStatus` exists, unused publicly | None — field exists |
| 4 | Card spec row (beds, baths, area) + category tags | Partial | None |
| 5 | List/Grid toggle + Sort control | Grid only | None |
| 6 | Compare 2–4 properties | Missing (R-39) | None (client-side) |
| 7 | Detail sticky tabs (Description / Layout Plans / Amenities / Video / Tour) | Single scroll page | Layout-plan media kind |
| 8 | **Gallery vs Map toggle** (Leaflet/OSM) | Missing | **New**: `latitude`/`longitude` + public-map toggle |
| 9 | **Unit Sizes table** (Unit / Area / Price) | `configurations` is a flat text array | **New**: unit-size rows |
| 10 | Highlights list (RERA ID, towers, units, club size) | `extras` jsonb can carry this | Relabel only |
| 11 | Amenities icon grid | Amenities exist as text | Icon mapping |
| 12 | **Public brochure download** | All docs private-by-default | **New**: explicit per-document public flag (see risks) |
| 13 | Schedule a Tour (type / date / time) | Missing | **New**: tour-request inbox |
| 14 | Sticky enquiry rail + Call + WhatsApp | Enquiry cart exists | None |
| 15 | 3-step process section | Missing | Editable via settings |
| 16 | Our Services grid | Missing | **New**: services CRUD |
| 17 | **Text** testimonials | Video only | **New**: text-testimonials CRUD |
| 18 | Newsletter subscribe | Missing | **New**: subscribers + CSV export |
| 19 | SEO footer link blocks + RERA number | Partial | Derived + settings |

## 4. Design system changes (Phase A)

**Palette.** These tokens are shared by the public site *and* the admin panel, so this is a
system change, not a repaint.

| Token | Now | Proposed | Why |
|---|---|---|---|
| `--color-surface` | *(absent)* | `#ffffff` | New dominant page surface |
| `--color-cream` | `#faf9f6` | kept, demoted | Section banding only, no longer the page ground |
| `--color-gold` | `#c9992e` | kept, restricted | Dividers, hover, focus, active — never fills or large text |
| `--color-gold-highlight` | `#f5d98b` | retired from surfaces | The main source of the "golden tint" |
| `--color-ink` | `#141414` | unchanged | Carries text |
| `--color-border` | `#e2e0db` | `#e6e6e3` | Slightly cooler against white |

Net effect: white page, ink text, gold reduced to roughly a quarter of its current surface
area. No navy chrome — we keep our own identity.

**Motion budget.** Currently 10 files use GSAP, 12 use Framer Motion, and 22 elements carry
`data-reveal`.

- **Remove:** scroll-driven timelines, pinned sections, parallax, SplitText reveals.
- **Keep:** modal and menu enter/exit, hover and focus feedback, image hover-zoom, carousel slide.
- **Rule going forward:** motion only on a state change the user caused. Nothing animates
  purely because the page scrolled. `prefers-reduced-motion` honoured throughout.
- Expected win: smaller JS bundle, faster LCP, and the "simple and clean" feel the client is
  asking for — most of which is really "stop moving while I read."

## 5. Phases

Each phase is independently shippable and ends green (typecheck, lint, build, leak-check).

### Phase A — Design system: light & calm  ✅ shipped
Tokens, motion cull, typography pass on functional surfaces.
**Admin sync:** none functionally — but the admin shares these tokens, so every admin screen
gets a visual regression pass before merge.
**Risk:** highest blast radius of any phase; touches every page. Ship it alone.

### Phase B — Search & discovery  ✅ shipped
Hero search (City / Type / Status), richer filter bar, sort control, list-grid toggle.
**Admin sync:** none — taxonomy already lives in the DB.

### Phase C — Areas / locations (R-46) — the "location feats"  ✅ shipped
`/areas` index and `/areas/[slug]` landing pages; homepage "Explore the Tricity" grid with
live property counts.
**Schema:** new `areas` table (name, slug, city, cover image, blurb, sort order, published).
Counts derived from `properties`, never stored.
**Admin sync:** new **Areas** section — full CRUD, image upload, ordering, publish toggle.

### Phase D — Cards & listing parity  ✅ shipped
Status badges, spec row, category tags, "Starts from", wishlist, compare (R-39).
**Admin sync:** none — all fields exist.

### Phase E — Property detail depth  🔄 in progress
Sticky tabs, gallery/map toggle, unit-sizes table, highlights, amenities icon grid, public
brochure, Schedule a Tour, sticky enquiry rail with Call and WhatsApp.
**Schema:** `latitude`/`longitude` + `showMapPublicly`; `property_unit_sizes` rows; `isPublic`
on `property_documents`; new `tour_requests` table.
**Admin sync:** map picker, unit-size editor, per-document public toggle, tour-request inbox.
**Risk:** this phase touches the public/internal boundary — see section 6.

### Phase F — Homepage content blocks  ✅ shipped
3-step process, Our Services, text testimonials, newsletter subscribe.
**Schema:** `services`, `text_testimonials`, `newsletter_subscribers`.
**Admin sync:** CRUD for each; CSV export for subscribers.

### Phase G — Footer, SEO & polish
Location and search link blocks, RERA line, back-to-top, metadata and schema.org pass.
**Admin sync:** settings-driven.

### Phase H — Verification & rollout
Full leak check, admin regression, Lighthouse, deploy.

## 6. Risks

1. **Shared design tokens (Phase A).** The admin panel is styled from the same variables as
   the public site. A palette change silently restyles ~22 admin screens. Mitigation: ship
   Phase A alone, walk every admin screen before merge.

2. **Public documents are a data-leak risk (Phase E).** The entire architecture rests on
   "internal never reaches a public page." Today *every* `property_documents` row is private
   and served only through the authenticated route. Adding public brochures means a document
   can become public. Mitigation: opt-in per document, default false, never inferred from
   `docType`; brochures served from the public bucket, never the private one; leak-check
   extended to assert registry and owner documents can never appear in public HTML.

3. **Map coordinates (Phase E).** Publishing exact coordinates is fine for a launched
   project and questionable for a private resale kothi whose owner details are internal.
   Mitigation: `showMapPublicly` defaults to false; approximate-area pin, not door-pin.

4. **Scope.** Eight phases across schema, public site and admin. Sequence it; do not attempt
   it in one pass.

5. **`.planning/` is stale.** GSD `STATE.md` still reads "Phase 1 of 10, 0% complete" from
   2026-08-20, but Phases 1–6 have effectively shipped. Reconcile it before trusting it to
   drive anything.

## 7. Decisions needed before Phase A

1. **Chrome:** keep our current light header/footer, or adopt a solid dark header like the
   reference? (Recommendation: keep ours, lightened.)
2. **Gold:** reduce as described, or remove gold entirely for pure ink-on-white?
   (Recommendation: reduce, don't remove — it is the brand.)
3. **Animation floor:** cull scroll animation only (recommended), or strip to near-zero
   motion including hover states?
