<!-- refreshed: 2026-08-20 -->
# Architecture

**Analysis Date:** 2026-08-20

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│  Root shell — `app/layout.tsx`                                │
│  Fonts, JSON-LD, pre-paint `.js` class stamp, MotionProvider   │
├──────────────────────────────┬────────────────────────────────┤
│  Public site — `app/(site)`   │  Admin panel — `app/admin`      │
│  layout + pages, ISR + cache  │  proxy-gated, force-dynamic     │
└────────────┬──────────────────┴───────────────┬────────────────┘
             │                                   │
             ▼                                   ▼
  `lib/db/queries.ts` (cached reads)   `app/admin/(panel)/*/actions.ts`
             │                                   │  requireAdmin() → mutate → revalidatePublicSite()
             ▼                                   ▼
        `lib/db/index.ts` (Drizzle + pg Pool) ──────────────► Postgres (Neon)
                                                   │
                                                   ▼
                                        `lib/cloudinary.ts` (asset cascade)
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Fonts, global JSON-LD, `.js` pre-paint gate, LazyMotion provider | `app/layout.tsx` |
| Public site shell | Smooth scroll, scroll-reveal engine, WhatsApp dock, ticker | `app/(site)/layout.tsx` |
| Public read layer | Cached, fail-soft DB queries for all public pages | `lib/db/queries.ts` |
| DB client | Singleton pg Pool + Drizzle instance, DATE parser fix | `lib/db/index.ts` |
| Admin edge gate | Redirect unauthenticated `/admin/*` requests | `proxy.ts` |
| Admin token crypto | Stateless HMAC-signed session token | `lib/admin/auth.ts` |
| Admin session cookie | Set/clear cookie, `requireAdmin()` guard for actions | `lib/admin/session.ts` |
| Admin panel shell | Server-side re-check of session, nav chrome | `app/admin/(panel)/layout.tsx` |
| Admin mutations | Parse/validate form data, write DB, cascade Cloudinary, revalidate | `app/admin/(panel)/properties/actions.ts` (and sibling `deals/`, `projects/`, `testimonials/` `actions.ts`) |
| Cache invalidation | Tag + path purge after any admin write | `lib/admin/revalidate.ts` |
| Cloudinary access | Signed uploads, remote asset deletion | `lib/cloudinary.ts` |
| Motion engine | Single GSAP ScrollTrigger driver for data-attribute reveals | `components/ScrollReveals.tsx` |
| Framer Motion runtime | App-wide LazyMotion (`m.*` only) | `components/MotionProvider.tsx` |

## Pattern Overview

**Overall:** Next.js App Router monolith, two route trees (`app/(site)` public, `app/admin` gated), server actions as the only mutation path, Drizzle ORM over a single Postgres pool, `unstable_cache` for public reads.

**Key Characteristics:**
- Public pages are effectively static/ISR — nearly all data comes through 1h-cached `lib/db/queries.ts` helpers.
- Admin is deliberately `force-dynamic` (`app/admin/layout.tsx`) — no caching, always live data.
- Every DB call in the public read layer is fail-soft: a DB outage degrades to an empty/null result, never a 500.
- Auth is edge-proxy + server-action double-checked (defense in depth), not proxy-only.

## Layers

**Route/page layer:**
- Purpose: request entry, layout composition, calling the read layer.
- Location: `app/(site)/**/page.tsx`, `app/admin/**/page.tsx`
- Depends on: `lib/db/queries.ts`, `lib/data.ts`, `lib/seo.ts`
- Used by: Next.js router

**Data access layer:**
- Purpose: DB reads (cached, fail-soft) and writes (transactional, via actions).
- Location: `lib/db/queries.ts` (reads), `app/admin/**/actions.ts` (writes)
- Depends on: `lib/db/index.ts`, `lib/db/schema.ts`
- Used by: pages, server actions

**Admin auth layer:**
- Purpose: stateless HMAC session issuance/verification at three checkpoints (proxy, layout, action).
- Location: `lib/admin/auth.ts`, `lib/admin/session.ts`, `proxy.ts`
- Used by: `proxy.ts`, `app/admin/(panel)/layout.tsx`, every `actions.ts`

**Motion layer:**
- Purpose: declarative scroll-reveal animation via DOM data-attributes, no per-component GSAP wiring.
- Location: `components/ScrollReveals.tsx`, `lib/gsap.ts`, CSS pre-hide rules in `app/globals.css`
- Used by: `app/(site)/layout.tsx` (mounted once), any section component that adds `data-reveal`/`data-reveal-img`/`data-unveil`/`data-drift`

## Data Flow

### Public request path (e.g. `/properties/[slug]`)

1. Request hits `app/(site)/layout.tsx` shell (mounts `SmoothScroll`, `ScrollReveals` inside `Suspense`, `WhatsAppDock`, `SocialProofTicker`).
2. `app/(site)/properties/[slug]/page.tsx` calls `getPropertyBySlug(slug)` from `lib/db/queries.ts`.
3. `getPropertyBySlug` is `failSoft(getPropertyBySlugCached, ...)` — the **outer** wrapper is NOT cached; it calls the **inner** `unstable_cache`-wrapped query (`revalidate: 3600`, `tags: [SITE_DATA_TAG]`).
4. Caching design, precisely: `unstable_cache` never stores a thrown error, only a resolved value. If the inner query throws, `unstable_cache` propagates the throw uncached — nothing bad gets memoized. The **outer** `failSoft` wrapper catches that throw, waits 1.5s (absorbs a Neon cold-start wake-up), retries once, and only then falls back to the safe default (`[]`/`null`). This means: a DB blip degrades exactly one render; the cache is never poisoned with an empty result for the full hour.
5. Drizzle (`lib/db/index.ts`) runs the query against the pg Pool → Postgres (Neon).
6. Result renders through the page tree; `next/image` reads Cloudinary/Unsplash URLs directly (no proxy).

### Admin request path (e.g. update a property)

1. `proxy.ts` matches `/admin/:path*`, calls `verifyAdminToken` on the `gld_admin` cookie. No token → redirect to `/admin/login`. This is a UX redirect, not the security boundary.
2. `app/admin/(panel)/layout.tsx` re-verifies the same cookie server-side and `redirect()`s again if invalid — this re-check exists because Next's own data-security guidance says proxy/middleware coverage alone must never be trusted for a page render.
3. User submits the property form; the `"use server"` action `updateProperty` in `app/admin/(panel)/properties/actions.ts` runs.
4. The action's **first** line is `await requireAdmin()` (`lib/admin/session.ts`), which throws if the cookie is missing/invalid — this is the actual security boundary; proxy + layout checks are UX conveniences, not the enforcement point.
5. The action validates/parses all form fields (`parseProperty`, `parseImages`, etc.), enforces `IMAGE_HOSTS` allowlist and `OWNED_PUBLIC_ID` prefix check so a forged `publicId` can never delete an arbitrary Cloudinary asset.
6. DB write happens inside a `db.transaction` (update row + replace `propertyImages`).
7. Cloudinary cleanup of replaced images happens **after** the transaction commits (see cascade section below).
8. The action's **last** call is `revalidatePublicSite()` (`lib/admin/revalidate.ts`) — called last so cache purge only happens once the write (and asset cascade) has actually succeeded.

This proxy → layout → `requireAdmin()` chain is deliberate defense in depth, not redundancy: each layer protects a different failure mode (proxy: prevents ever rendering the shell to an anonymous user; layout: catches any future page that forgets to check; `requireAdmin()`: the only check a server action itself can rely on, since actions can be invoked directly without going through a page render).

### Cache invalidation (`lib/admin/revalidate.ts`)

`revalidatePublicSite()` does two things:
- `updateTag(SITE_DATA_TAG)` — immediately expires every `unstable_cache` entry tagged `"site-data"` (not stale-while-revalidate; next read is a fresh DB hit).
- Targeted `revalidatePath()` calls: `/`, `/properties`, `/properties/[slug]` (page-level), `/sitemap.xml`.

The purge is deliberately narrow — it does **not** revalidate the whole layout/`/news` route. `/news` (`lib/news.ts`) has its own 12h `fetch` cache against the newsdata.io API with a small quota; a layout-wide revalidate on every admin save would burn that quota needlessly since news content is unrelated to property/deal/testimonial edits.

### Cloudinary cascade asymmetry

- **Delete flow** (`deleteProperty` in `app/admin/(panel)/properties/actions.ts`): remote Cloudinary assets are deleted **before** the DB row. Rationale in code comment: "Cascade rule: Cloudinary assets go first; abort on failure so no orphaned remote images can exist." If Cloudinary delete fails, the DB delete never runs — the property row and its images stay intact and consistent with what's live in Cloudinary.
- **Update flow** (`updateProperty`): replaced Cloudinary assets are deleted **after** the DB transaction commits. Rationale: the DB is the source of truth for what's "live"; deleting Cloudinary assets first and then having the DB write fail would strand the live site pointing at now-deleted images. Deleting after commit means a Cloudinary failure here can only orphan an unused remote asset (logged, harmless to correctness) — it can never break a live page.
- The asymmetry exists because delete and update have different failure-safety priorities: delete must never leave orphaned remote assets with no owning row; update must never leave a live row pointing at a deleted asset.

## Key Abstractions

**`failSoft<A,R>()`** (`lib/db/queries.ts`):
- Purpose: wraps a cached query with try/retry/fallback so DB errors degrade gracefully without poisoning the cache.
- Pattern: outer uncached wrapper around an inner `unstable_cache`-wrapped function; single 1.5s delayed retry for cold starts.

**`CACHE_OPTS`** (`lib/db/queries.ts`): shared `{ revalidate: 3600, tags: [SITE_DATA_TAG] }` object used by every public read's `unstable_cache` call — single source of truth for public cache lifetime and tag.

**Server action state pattern**: every mutation action takes `(_prev, formData)` and returns `{ error?: string }`, designed for `useActionState` on the client — see `PropertyFormState`, `DeleteState` in `app/admin/(panel)/properties/actions.ts`.

## Entry Points

**`proxy.ts`:**
- Triggers on any request matching `/admin/:path*`.
- Responsibilities: redirect unauthenticated visitors to `/admin/login`; redirect already-authed visitors away from `/admin/login`.

**`app/api/health/route.ts`:**
- Keep-alive / cold-start mitigation endpoint (see recent commit "DB cold-start retry, and /api/health keep-alive endpoint").

**`app/api/search/route.ts`:**
- Backs `components/PropertySearch.tsx` client search, calls `searchProperties` in `lib/db/queries.ts` (uncached, per-request).

**`app/api/ig-thumb/[code]/route.ts`:**
- Server-side proxy/fetch for an Instagram embed thumbnail (used by testimonials/reels).

## Architectural Constraints

- **Threading:** Single Node.js server runtime; no worker threads. One shared `pg.Pool` (`max: 5`) reused across requests and HMR reloads via `globalThis.__gldPool` in `lib/db/index.ts`.
- **Global state:** the pg Pool singleton (`lib/db/index.ts`) is the only module-level shared mutable state of note; all cache state is delegated to Next's `unstable_cache`/tag system, not in-process.
- **Circular imports:** none observed between `lib/db`, `lib/admin`, and route files.
- **Cache correctness:** any new public read function must follow the `unstable_cache` (inner) + `failSoft` (outer) two-layer pattern in `lib/db/queries.ts` — writing an uncached fail-soft function, or caching-with-inline-try/catch, breaks the "never cache an error" guarantee.
- **Cached data serialization:** `unstable_cache` results are JSON-serialized, so `Date` fields come back as strings on subsequent reads. No public component currently reads a cached `Date` field directly (verified in code comment); `lib/db/queries.ts` header comment flags this as a trap for new cached queries.

## Anti-Patterns

### Trusting the proxy as the sole auth boundary

**What happens:** `proxy.ts` redirects unauthenticated `/admin/*` requests.
**Why it's wrong:** Next's proxy/middleware can be bypassed by direct server-action invocation or by future routes that aren't covered by the matcher.
**Do this instead:** Every admin page (`app/admin/(panel)/layout.tsx`) and every server action calls `requireAdmin()`/`verifyAdminToken` itself — see `lib/admin/session.ts`. New admin routes/actions must repeat this check; do not rely on the matcher alone.

### Wide cache revalidation

**What happens:** Calling `revalidatePath("/", "layout")` or similar broad purges after any admin write.
**Why it's wrong:** would also blow away `/news`'s independent 12h newsdata.io fetch cache, burning API quota on every unrelated admin save.
**Do this instead:** `revalidatePublicSite()` (`lib/admin/revalidate.ts`) lists exact paths/tags to purge. Add new specific paths there rather than widening the scope.

## Error Handling

**Strategy:** fail-soft on the public read path (never 500 the marketing site over a DB blip), fail-loud (throw/redirect) on the admin path (never silently proceed without auth or a valid write).

**Patterns:**
- Public reads: `failSoft()` wrapper + try/catch fallbacks in `lib/db/queries.ts` (e.g. `listProjects`, `listPropertySlugs`, `searchProperties` each catch and return an empty default).
- Admin actions: `try/catch` around the DB transaction, returning `{ error: string }` for the form to display; `requireAdmin()` throws hard (uncaught — surfaces as a Next error boundary) rather than being swallowed.

## Cross-Cutting Concerns

**Logging:** `console.error` with a descriptive label at every fail-soft/catch site (e.g. `"listProperties failed, retrying once:"`).
**Validation:** all admin form input is parsed and allow-listed server-side in `actions.ts` files (`parseChoice`, `parseImages`, `isAllowedImageUrl`, `OWNED_PUBLIC_ID`) — never trusts client-supplied enums or Cloudinary `publicId`s.
**Authentication:** stateless HMAC token (`lib/admin/auth.ts`), no session store, no per-session revocation (documented: rotate `ADMIN_SESSION_SECRET` to force-logout everyone).

---

*Architecture analysis: 2026-08-20*
