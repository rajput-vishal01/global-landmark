# Codebase Structure

**Analysis Date:** 2026-08-20

## Directory Layout

```
global-landmark/
├── app/
│   ├── layout.tsx              # Root shell: fonts, JSON-LD, .js pre-paint gate, MotionProvider
│   ├── loading.tsx / error.tsx / not-found.tsx
│   ├── robots.ts / sitemap.ts
│   ├── globals.css
│   ├── (site)/                 # Public marketing site — route group, no URL segment
│   │   ├── layout.tsx          # SmoothScroll, ScrollReveals, WhatsAppDock, SocialProofTicker
│   │   ├── page.tsx             # Home
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx + actions.ts
│   │   ├── news/page.tsx
│   │   └── properties/page.tsx, [slug]/page.tsx
│   ├── admin/
│   │   ├── layout.tsx           # force-dynamic, robots noindex
│   │   ├── login/page.tsx + LoginForm.tsx + actions.ts
│   │   ├── LogoutButton.tsx
│   │   └── (panel)/              # Gated admin CRUD — route group
│   │       ├── layout.tsx        # requireAdmin re-check, nav chrome
│   │       ├── page.tsx          # Dashboard
│   │       ├── properties/       # page.tsx, new/, [id]/edit/, actions.ts
│   │       ├── projects/         # page.tsx, ProjectCreateForm.tsx, actions.ts
│   │       ├── deals/            # page.tsx, DealCreateForm.tsx, actions.ts
│   │       └── testimonials/     # page.tsx, TestimonialCreateForm.tsx, actions.ts
│   └── api/
│       ├── health/route.ts       # keep-alive / cold-start endpoint
│       ├── ig-thumb/[code]/route.ts
│       └── search/route.ts
├── components/
│   ├── ui/            # Generic, presentation-only primitives
│   ├── sections/       # Page-section-sized public-site building blocks
│   ├── admin/           # Admin-form-specific inputs/widgets
│   ├── gallery/          # Lightbox/gallery viewer
│   └── *.tsx (root)       # Cross-cutting: ScrollReveals, MotionProvider, SmoothScroll, ContactForm, PropertySearch/Filters, WhatsAppDock, SocialProofTicker, VideoTestimonials, VideoThumb, form-classes.ts
├── lib/
│   ├── admin/           # auth.ts, session.ts, revalidate.ts
│   ├── db/              # index.ts (pool/client), queries.ts (public reads), schema.ts (Drizzle schema)
│   ├── data.ts, categories.ts, attributes.ts, slugify.ts, images.ts, video.ts
│   ├── cloudinary.ts, email.ts, news.ts, whatsapp.ts, rate-limit.ts
│   ├── gsap.ts, motion.ts, hooks.ts, seo.ts
├── proxy.ts             # Edge gate for /admin/* (Next 16 — replaces middleware.ts)
└── scripts/              # (build/deploy utility scripts, if present)
```

## Directory Purposes

**`app/(site)`:**
- Purpose: all public-facing marketing pages.
- Route group `(site)` — no URL segment, exists purely to attach a shared layout (`app/(site)/layout.tsx`) distinct from admin.
- Key files: `app/(site)/layout.tsx` (mounts motion/engagement layer), `app/(site)/properties/[slug]/page.tsx` (dynamic listing detail).

**`app/admin/(panel)`:**
- Purpose: authenticated CRUD screens for properties, projects, deals, testimonials.
- Route group `(panel)` sits under `app/admin` alongside the unauthenticated `login/` route — the group boundary is exactly the requireAdmin/session-checked surface (`app/admin/(panel)/layout.tsx` redirects to `/admin/login` if unauthenticated; `app/admin/login/` itself is outside the group and unguarded by that layout).
- Each resource directory (`properties/`, `projects/`, `deals/`, `testimonials/`) follows the same shape: `page.tsx` (list/dashboard), a `*CreateForm.tsx` client component, and `actions.ts` (server actions: create/update/delete).

**`app/api`:**
- Purpose: route handlers that don't fit the server-action model — health check, third-party thumbnail fetch, client-side search fetch.

**`components/ui`:**
- Purpose: generic, reusable, content-agnostic primitives (Button, Select, ParallaxImage, Magnetic, StatCounter, ListingCard).
- Contains: no data-fetching, no route awareness — pure presentational/interaction components.

**`components/sections`:**
- Purpose: full page-section components composed on the public site's pages (Hero, Header, Footer, Pillars, Testimonials, DealOfWeek, FeaturedListings, CredibilityBand, PressMarquee, CTABand, AboutSplit, ArchReveal, FullscreenMenu).
- Contains: `nav-links.ts` shared nav data.

**`components/admin`:**
- Purpose: form widgets specific to the admin CRUD screens (ImageUploader, AmenitiesField, ExtrasEditor, ProjectSuggestInput, PropertyForm, DeleteButton).
- These are the only components that talk to `getUploadSignature`/Cloudinary signed-upload flow client-side.

**`components/gallery`:**
- Purpose: `GalleryLightbox.tsx` — image viewer used on property detail pages.

**`lib/admin`:**
- Purpose: everything admin-auth and admin-cache related, isolated from the public read layer.
- `auth.ts`: pure HMAC token crypto (no I/O), importable from `proxy.ts` (edge-safe).
- `session.ts`: cookie read/write (`next/headers`), `requireAdmin()` guard used by every action.
- `revalidate.ts`: `revalidatePublicSite()` — single source of truth for what gets purged after a write.

**`lib/db`:**
- `index.ts`: singleton pg Pool + Drizzle client, DATE type-parser fix.
- `queries.ts`: all public-facing reads, cached + fail-soft (see ARCHITECTURE.md).
- `schema.ts`: Drizzle table/relations definitions, exported row types (`Deal`, `Project`, `PropertyWithImages`, `TestimonialVideo`).

**`lib/` (root files):**
- `data.ts`: static company/SEO copy constants (`COMPANY`, `SEO`).
- `categories.ts`, `attributes.ts`: enums/allowlists shared by public filters and admin form validation.
- `cloudinary.ts`: signed upload + delete, server-only.
- `email.ts`: contact-form email sending, fail-soft.
- `news.ts`: newsdata.io fetch with its own 12h cache, independent of `SITE_DATA_TAG`.
- `seo.ts`: JSON-LD builders, `SITE_URL`.
- `gsap.ts`: GSAP/ScrollTrigger/useGSAP re-exports + shared easing constants (`EASE_HEAVY`).
- `motion.ts`, `hooks.ts`: Framer Motion variants / small client hooks.
- `rate-limit.ts`, `whatsapp.ts`, `slugify.ts`, `images.ts`, `video.ts`: small focused utilities.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: root HTML shell, every request passes through this.
- `proxy.ts`: edge gate for `/admin/*` (Next 16 renamed `middleware.ts` → `proxy.ts` — see `AGENTS.md`).
- `app/api/health/route.ts`: keep-alive endpoint.

**Configuration:**
- `next.config.ts` (repo root, not under `app/`/`lib/`) — `images.remotePatterns` must stay in sync with `IMAGE_HOSTS` in `app/admin/(panel)/properties/actions.ts`.

**Core Logic:**
- `lib/db/queries.ts`: all public data access.
- `app/admin/(panel)/properties/actions.ts`: reference implementation for the mutation pattern (validate → transact → cascade external assets → revalidate).

**Testing:**
- Not detected — no `*.test.*`/`*.spec.*` files found under `app/`, `components/`, `lib/`.

## Naming Conventions

**Files:**
- Server actions: always `actions.ts` inside the resource's route directory, `"use server"` at top, one file per admin resource (`properties/actions.ts`, `deals/actions.ts`, `projects/actions.ts`, `testimonials/actions.ts`).
- Client form components: `<Resource>CreateForm.tsx` PascalCase (e.g. `DealCreateForm.tsx`, `ProjectCreateForm.tsx`, `TestimonialCreateForm.tsx`).
- Page files: always `page.tsx` per App Router convention; nested dynamic segments use `[param]` bracket dirs.

**Directories:**
- Route groups in parens: `(site)`, `(panel)` — group pages under a shared layout without adding a URL segment.
- `components/` subdirectories are organized by role (`ui`, `sections`, `admin`, `gallery`), not by feature.

## Where to Add New Code

**New public page:**
- Add under `app/(site)/<route>/page.tsx`; it inherits `app/(site)/layout.tsx` (motion engine, WhatsApp dock, ticker) automatically.
- If it needs data, add a cached+fail-soft function to `lib/db/queries.ts` following the existing `unstable_cache` + `failSoft()` pattern, tagged `SITE_DATA_TAG`.

**New admin resource (CRUD):**
- Create `app/admin/(panel)/<resource>/page.tsx` + `actions.ts` + `<Resource>CreateForm.tsx`, mirroring `properties/`.
- `actions.ts` must: `"use server"`, call `requireAdmin()` first in every exported action, validate/allowlist all `FormData` fields server-side, wrap multi-table writes in `db.transaction`, call `revalidatePublicSite()` (or add resource-specific paths to `lib/admin/revalidate.ts`) last.
- Add the resource to `NAV` in `app/admin/(panel)/layout.tsx`.

**New reusable UI primitive (no page/section semantics):**
- `components/ui/`.

**New public-site section (Hero-sized block):**
- `components/sections/`, opt into scroll animation via `data-reveal`/`data-reveal-img`/`data-unveil`/`data-drift` attributes (see `components/ScrollReveals.tsx`) rather than writing bespoke GSAP.

**New admin-only widget:**
- `components/admin/`.

**Shared utility/constant:**
- `lib/` root if generic; a new `lib/<domain>/` subdirectory only if it needs 2+ files (mirrors `lib/admin/`, `lib/db/`).

## Special Directories

**`app/(site)` / `app/admin/(panel)` (route groups):**
- Purpose: attach distinct layouts/guards without affecting the URL.
- Generated: No.
- Committed: Yes.

**`.next/` (build output, not explored):**
- Generated: Yes. Not committed.

---

*Structure analysis: 2026-08-20*
