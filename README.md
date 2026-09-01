# Global Landmark Realty Group

Luxury real-estate marketing site. Next.js 16 (App Router), Tailwind v4,
GSAP (SplitText only), Framer Motion, PostgreSQL (Drizzle ORM), local
filesystem image storage, installable as a PWA.

```bash
npm install
cp .env.example .env    # fill in values (defaults match docker-compose)
npm run dev             # http://localhost:3000
```

`npm run dev` does everything: it starts the Postgres container
(`docker compose up -d db`), waits for it, pushes the schema, and seeds the
sample portfolio — all idempotent. Data lives on a named Docker volume
(`pgdata`), so it survives container restarts; you never re-seed unless you
delete the volume. If Docker isn't running, dev still starts and data pages
fall back to their empty states.

## Full local production test

```bash
docker compose up --build   # web (Dockerfile, standalone build) + db on :3000
```

Same database volume as dev — whatever you seeded or added in the admin is
what the containerized site serves. Admin at `http://localhost:3000/admin`.

## Admin panel

Served at `/admin` — `http://localhost:3000/admin` in dev. Unauthenticated
visits redirect to `/admin/login` (`proxy.ts`). Sign in
with `ADMIN_PASSWORD`. Manages properties (multi-image galleries via
file upload or pasted URLs), projects/societies, and the Deal of the Week
queue (date-windowed; the active window shows on the landing page, queued
windows go live automatically).

Uploaded images are written to `UPLOAD_DIR` (default `./uploads`) and served
back through `/api/images/<sha256>.<ext>`. The filename is the hash of the
bytes, so re-uploading the same file is a no-op and the URL is safe to cache
forever. Legal documents go under `private/` in the same directory and are
only reachable through an admin-gated route.

**`UPLOAD_DIR` must be a persistent disk.** On a host with an ephemeral
filesystem (Vercel and most serverless platforms) anything written at runtime
is gone by the next request. In Docker it is a mounted volume; set it to a
path outside the deploy directory in production so a redeploy cannot wipe it.

## Layout

- `app/(site)/` — public routes (home, properties + `[slug]` detail, news, about, contact)
- `app/admin/` — panel (login + `(panel)` CRUD pages), session-gated at /admin
- `app/api/search` — portfolio search endpoint (hero + menu search UI)
- `components/sections/` — page sections (Hero, FeaturedListings, DealOfWeek, ...)
- `components/ui/`, `components/admin/`, `components/gallery/` — primitives, admin forms, lightbox
- `lib/db/` — Drizzle schema, fail-soft public queries, public column allowlists; `lib/storage.ts`, `lib/news.ts`, `lib/admin/`
- `proxy.ts` — /admin session gate

## Checks

```bash
npm run check
```

Runs the service-worker routing assertions, the taxonomy and EMI/ranking
assertions, `tsc --noEmit` and `eslint`. There is no test framework —
these assert-based scripts are the suite (`scripts/check-*.mjs`).

## PWA

`app/manifest.ts` plus `public/sw.js` make the site installable on
Android, iOS, Windows and macOS, admin panel included. The service worker
is network-first for navigations, falling back to cache and then
`/offline`; `/api` and `/admin` are never served from cache.
`components/InstallPrompt.tsx` offers installation on a timer and
`components/InstallButton.tsx` puts a standing offer in the nav.

Env vars are documented in [.env.example](.env.example). `UPLOAD_DIR` sets
where uploaded files are written; an empty `NEWSDATA_API_KEY` gives `/news` a
graceful fallback state.

Project context and design decisions live in [CLAUDE.md](CLAUDE.md) and the
docs it links (brand, design language, animation guidelines, tasks).
