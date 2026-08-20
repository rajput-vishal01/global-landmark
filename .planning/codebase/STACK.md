# Technology Stack

**Analysis Date:** 2026-08-20

## Languages

**Primary:**
- TypeScript 5 (strict mode) - entire app (`tsconfig.json`: `strict: true`, `target: ES2017`, `moduleResolution: bundler`)

**Secondary:**
- JavaScript (ESM `.mjs`) - build/dev scripts only: `scripts/dev-db.mjs`, `scripts/migrate.mjs`, `scripts/seed.mjs`

## Runtime

**Environment:**
- Node.js 22 (pinned in `Dockerfile` via `node:22-alpine`; no `.nvmrc` present in repo root)

**Package Manager — FLAG:**
- Both `package-lock.json` and `bun.lock` exist at repo root. `Dockerfile` explicitly uses `npm ci` with `package-lock.json` for the production image. Treat `npm` as the canonical manager; `bun.lock` is stale/unused by the build pipeline and should be reconciled or removed to avoid two sources of truth on dependency versions.

## Framework

**Core:**
- Next.js 16.2.10, App Router, `output: "standalone"` (`next.config.ts`)
- **Next.js v16 breaking change:** route interception middleware is `proxy.ts` at repo root (not `middleware.ts`). See `proxy.ts` — gates `/admin/*` via `ADMIN_COOKIE` HMAC token, matcher `["/admin/:path*"]`. Do not assume prior Next.js training data — check `node_modules/next/dist/docs/` before writing code that touches routing/middleware.
- React 19.2.4 / react-dom 19.2.4

**Testing:**
- **None installed.** No Jest/Vitest/Playwright config or dependency found. No test files (`*.test.*`, `*.spec.*`) found in the repo.

**Build/Dev:**
- `predev`: `node scripts/dev-db.mjs` — brings up local Postgres via `docker compose up -d db`, waits for readiness, runs `db:push` + `db:seed`. Fails soft (dev server still starts without a DB) if Docker is unavailable.
- `dev`: `next dev`
- `build`: `node scripts/migrate.mjs && next build` — pushes Drizzle schema to `DATABASE_URL` (via `drizzle-kit push --force`) only when `DATABASE_URL` is set; skipped for the Docker image build which has no DB at build time.
- `start`: `next start`
- `lint`: `eslint`
- `db:push`: `drizzle-kit push`
- `db:seed`: `node scripts/seed.mjs`

## Styling

- Tailwind CSS v4 (`tailwindcss ^4`, `@tailwindcss/postcss ^4`) — **no `tailwind.config.*` file**. All design tokens live in `app/globals.css` via native CSS `@theme` / `@theme inline` blocks:
  - `@theme inline` re-exposes `next/font` CSS vars (`--font-serif`, `--font-sans`) so Tailwind utilities can reference them.
  - `@theme` defines the full palette (`--color-ink`, `--color-gold`, `--color-cream`, etc.) and a fluid type scale (`--text-h1` … `--text-eyebrow`) using `clamp()`.
- PostCSS config: `postcss.config.mjs` (Tailwind v4 plugin only).
- Global stylesheet: `app/globals.css` — also owns Lenis smooth-scroll CSS, `.img-zoom` hover-zoom utility, and the `.js [data-reveal]` pre-hide gate for GSAP scroll reveals (keeps content visible for no-JS/reduced-motion visitors).

## Fonts

- `next/font/google` in `app/layout.tsx`: `Prata` (serif, weight 400) → `--font-serif`; `Manrope` (sans, weights 300/400/500/600) → `--font-sans`. Both exposed as CSS vars on `<html>` and consumed by the Tailwind `@theme inline` block.

## ORM / Database

- Drizzle ORM `drizzle-orm ^0.45.2` + `drizzle-kit ^0.31.10`, dialect `postgresql`, against PostgreSQL via `pg ^8.22.0` (`node-postgres`).
- Schema: `lib/db/schema.ts`; config: `drizzle.config.ts` (loads `.env` manually via `process.loadEnvFile()` since drizzle-kit runs outside Next.js).
- Connection: `lib/db/index.ts` — single `pg.Pool` (max 5 connections) cached on `globalThis` across dev HMR reloads; `connectionTimeoutMillis: 10_000` to bound Neon cold-start wait instead of hanging until platform timeout. A custom type parser overrides Postgres `DATE` columns to stay as raw `"YYYY-MM-DD"` strings (avoids drizzle's UTC re-serialization shifting dates in IST).
- Local dev DB: `docker-compose.yml` — `postgres:16-alpine`, loopback-only port `127.0.0.1:5439:5432`, named volume `pgdata`.
- Queries centralized in `lib/db/queries.ts`.

## Animation Libraries

- GSAP `^3.15.0` + `@gsap/react ^2.1.2` — core registration point is `lib/gsap.ts`, which registers `useGSAP`, `ScrollTrigger`, `SplitText` once and re-exports them (plus `EASE_HEAVY = "power3.inOut"`, the single shared easing curve per `docs/ANIMATION_GUIDELINES.md`).
- Framer Motion `^12.42.2` — wired through `LazyMotion` in `components/MotionProvider.tsx` with `features={domAnimation}` and `strict` mode (throws if a component imports `motion.*` instead of `m.*`), wrapped around `{children}` in `app/layout.tsx`. Keeps the animation runtime out of the initial bundle (~6KB entry only).
- Lenis `^1.3.25` — smooth scroll; global CSS hooks in `app/globals.css` (`html.lenis`, `.lenis.lenis-smooth`).

## Key Dependencies

**Critical:**
- `cloudinary ^2.10.0` - signed direct-browser image upload + delete for admin property media (`lib/cloudinary.ts`)
- `nodemailer ^9.0.3` - transactional email via Gmail SMTP (`lib/email.ts`)
- `pg ^8.22.0` - Postgres driver underlying Drizzle

**Infrastructure:**
- `drizzle-kit` - schema push/migrations, invoked from `scripts/migrate.mjs` and `npm run db:push`

## Configuration

**Environment:**
- `.env` (local, git-ignored) + `.env.example` (present, contents intentionally not read/quoted here — see Integrations doc for the full env-var list this repo actually reads from `process.env`)
- `drizzle.config.ts` manually loads `.env` via `process.loadEnvFile()` for CLI usage outside Next.js
- `docker-compose.yml` injects `.env` via `env_file`, then overrides `DATABASE_URL` to point at the in-network `db` service host

**Build:**
- `next.config.ts` - `output: "standalone"`, a strict per-route CSP + security headers block (`Content-Security-Policy`, HSTS, `X-Frame-Options`, `Permissions-Policy`), and an `images.remotePatterns` allowlist limited to `res.cloudinary.com` and `images.unsplash.com` (deliberately no wildcard — prevents `/_next/image` SSRF)
- `eslint.config.mjs` - flat config, extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- `tsconfig.json` - path alias `@/*` → repo root

## Platform Requirements

**Development:**
- Node 22, Docker Desktop (optional — `predev` degrades gracefully to a DB-less dev server if Docker isn't running)

**Production:**
- Docker multi-stage build (`Dockerfile`): `deps` (npm ci) → `build` (`next build`, no DB required at build time since data pages are `force-dynamic`) → `run` (Next.js standalone server on port 3000, `node server.js`)
- External Postgres (e.g. Neon) supplied via `DATABASE_URL`; Neon free-tier cold-start mitigated by `connectionTimeoutMillis` and the `/api/health` keep-alive endpoint (see INTEGRATIONS.md)

---

*Stack analysis: 2026-08-20*
