# Global Landmark Realty Group

Luxury real-estate marketing site. Next.js 16 (App Router), Tailwind v4,
GSAP (ScrollTrigger + SplitText), Framer Motion, Lenis smooth scroll,
PostgreSQL (Drizzle ORM), Cloudinary image hosting.

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
Cloudinary or pasted URLs), projects/societies, and the Deal of the Week
queue (date-windowed; the active window shows on the landing page, queued
windows go live automatically).

Deleting a property deletes its Cloudinary assets first and aborts if that
fails — no orphaned images.

## Layout

- `app/(site)/` — public routes (home, properties + `[slug]` detail, news, about, contact)
- `app/admin/` — panel (login + `(panel)` CRUD pages), session-gated at /admin
- `app/api/search` — portfolio search endpoint (hero + menu search UI)
- `components/sections/` — page sections (Hero, FeaturedListings, DealOfWeek, ...)
- `components/ui/`, `components/admin/`, `components/gallery/` — primitives, admin forms, lightbox
- `lib/db/` — Drizzle schema + fail-soft public queries; `lib/cloudinary.ts`, `lib/news.ts`, `lib/admin/`
- `proxy.ts` — admin-subdomain rewrite + session gate

Env vars are documented in [.env.example](.env.example). Empty Cloudinary
keys fall back to paste-image-URL mode in the admin; an empty
`NEWSDATA_API_KEY` gives `/news` a graceful fallback state.

Project context and design decisions live in [CLAUDE.md](CLAUDE.md) and the
docs it links (brand, design language, animation guidelines, tasks).
