# Global Landmark Realty Group

Luxury real-estate marketing site. Next.js 16 (App Router), Tailwind v4,
GSAP (hero load-in only), Framer Motion, MySQL (Drizzle ORM, `mysql2`), local
filesystem image storage, installable as a PWA. Live at
https://globallandmarkrealty.com.

```bash
npm install
cp .env.example .env    # fill in values (defaults match docker-compose)
npm run dev             # http://localhost:3000
```

`npm run dev` does everything: it starts the MySQL 8.4 container
(`docker compose up -d db`, published on `127.0.0.1:3399`), waits for it,
runs the migrations (`scripts/migrate.mjs`, `drizzle/*.sql`) and seeds the
sample portfolio — all idempotent. Data lives on a named Docker volume
(`mysqldata`), so it survives container restarts; you never re-seed unless you
delete the volume. If Docker isn't running, dev still starts and data pages
fall back to their empty states.

## Demo data

`npm run db:seed-demo` adds invented demo projects and listings (real Tricity
localities, free-licence photos, every price "Price on request") so the site
does not look empty; `node scripts/seed-demo.mjs --remove` takes them all off
again. See [scripts/seed-demo/README.md](scripts/seed-demo/README.md).

## Full local production test

```bash
docker compose up --build   # web (Dockerfile, standalone build) + db on :3000
```

Same database volume as dev — whatever you seeded or added in the admin is
what the containerized site serves. Admin at `http://localhost:3000/admin`.

## Admin panel

Served at `/admin` — `http://localhost:3000/admin` in dev. Unauthenticated
visits redirect to `/admin/login` (`proxy.ts`). Sign in
with `ADMIN_PASSWORD`. Manages properties and projects, leads, tour
requests, owner submissions from `/sell`, CRM clients and the deal pipeline,
the home-page content (Deal of the Week, video reels, client quotes,
services) and Settings — screen by screen in
[docs/ADMIN_DESK.md](docs/ADMIN_DESK.md#current-screens).

Uploaded images are written to `UPLOAD_DIR` (default `./uploads`) and served
back through `/api/images/<sha256>.<ext>`, exactly as uploaded: no resizing
or re-encoding (`images.unoptimized: true`), up to 20 MB a file. The filename
is the hash of the bytes, so re-uploading the same file is a no-op and the
URL is safe to cache forever. Documents go under `private/` in the same
directory and are only reachable through an admin-gated route, except a file
an admin explicitly marks public (a brochure).
`npm run sweep:uploads` lists stored files no row points at (`--delete`
removes them).

**`UPLOAD_DIR` must be a persistent disk.** On a host with an ephemeral
filesystem (Vercel and most serverless platforms) anything written at runtime
is gone by the next request. In Docker it is a mounted volume; set it to a
path outside the deploy directory in production so a redeploy cannot wipe it.

## Layout

- `app/(site)/` — public routes (home, properties + `[slug]` detail, projects `[slug]`, sell, news, about, contact, privacy, terms, data-deletion, offline); full list in [docs/SITE_ARCHITECTURE.md](docs/SITE_ARCHITECTURE.md)
- `app/admin/` — panel (login + `(panel)` CRUD pages), session-gated at /admin
- `app/api/` — search, image/document serving, uploads, health, lead CSV export
- `components/sections/` — page sections (Hero, FeaturedListings, DealOfWeek, ...)
- `components/ui/`, `components/admin/`, `components/gallery/` — primitives, admin forms, lightbox
- `lib/db/` — Drizzle schema, fail-soft public queries, public column allowlists; `lib/storage.ts`, `lib/news.ts`, `lib/admin/`
- `proxy.ts` — /admin session gate

## Checks

```bash
npm run check
```

Runs the assert-based checks — service-worker routing, taxonomy, listing
ranking / CSV escaping / page titles, storage, news relevance, reviews, legal
strings and form wiring — then `tsc --noEmit` and `eslint`. There is no test
framework; these scripts are the suite (`scripts/check-*.mjs`).

## Email and deploy

Mail goes through Gmail: set `GMAIL_USER` and `GMAIL_APP_PASSWORD`, and
`npm run mail:test [you@example.com]` checks the login (and sends one test
mail when given an address). A push to `main` builds on GitHub Actions and
runs `scripts/server-deploy.sh` on the server, which reads `./.env` at the
app root. Details in [docs/TECH_STACK.md](docs/TECH_STACK.md#production).

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
