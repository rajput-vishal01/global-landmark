# External Integrations

**Analysis Date:** 2026-08-20

## APIs & External Services

**Media hosting — Cloudinary:**
- File: `lib/cloudinary.ts`
- Signed direct-browser upload: `signUpload()` produces `{cloudName, apiKey, timestamp, folder, signature}` via `cloudinary.utils.api_sign_request`, so the browser uploads straight to Cloudinary without the API secret ever reaching the client. Upload folder is fixed to `global-landmark/properties`.
- Cascade delete: `deleteCloudinaryImages(publicIds)` batches `api.delete_resources` in chunks of 100 (Cloudinary's per-call cap) and **throws** on failure — callers (`app/admin/(panel)/properties/actions.ts`) must abort the corresponding DB row delete on throw, to avoid orphaned remote assets. Ids from URL-pasted or seeded images are `null` and filtered out before calling.
- Config check: `isCloudinaryConfigured()` — gates both admin upload UI and delete calls.
- **Degrades gracefully:** when env vars are absent, the admin panel falls back to paste-image-URL mode and `deleteCloudinaryImages` no-ops (nothing hosted remotely to delete).
- Env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- CSP allowance: `next.config.ts` adds `connect-src https://api.cloudinary.com`; `images.remotePatterns` allowlists `res.cloudinary.com`.

**News feed — newsdata.io:**
- File: `lib/news.ts`, consumed by the `/news` route
- `fetchRealEstateNews()` runs two parallel queries (newsdata.io caps at 10 results/request) against `https://newsdata.io/api/1/latest`, filters to `category=business`, `language=en`, `country=in`, dedupes by link + title, drops any article missing an image (`item.image_url`) since an image-less card "reads as a dead site," and returns up to 12 articles.
- Fetches use Next.js `next: { revalidate: 12h }` caching (`REVALIDATE_SECONDS`).
- **Degrades gracefully:** missing `NEWSDATA_API_KEY` or a non-2xx / malformed response logs an error and returns `[]` — the `/news` page renders its empty-state fallback rather than erroring.
- Env var: `NEWSDATA_API_KEY`

**Email — Gmail via nodemailer:**
- File: `lib/email.ts`
- `sendContactEmails(data)` sends two emails through a Gmail SMTP transport (`nodemailer.createTransport({ service: "gmail", auth: {...} })`): an admin notification (to `GMAIL_USER` itself, `replyTo` the submitter) and a branded HTML thank-you to the submitter. Both emails share a hand-rolled table-based HTML shell (`shell()`) styled with the brand palette (navy header, gold accents, cream background) for email-client compatibility.
- The confirmation email to the submitter is explicitly best-effort: wrapped in its own `try/catch` so a failed courtesy email does not cause the caller to retry (which would double-notify the admin).
- User-supplied fields are HTML-escaped (`escapeHtml`) before interpolation into the email body.
- **Degrades gracefully:** `getTransporter()` returns `null` when `GMAIL_USER`/`GMAIL_APP_PASSWORD` are unset; `sendContactEmails` logs and returns `false` instead of throwing, so the contact form's server action can respond to the user without a hard failure.
- Env vars: `GMAIL_USER`, `GMAIL_APP_PASSWORD`

**Video embeds — YouTube + Instagram:**
- File: `lib/video.ts`
- `parseVideo(input)` normalizes a raw YouTube URL/ID or Instagram post/reel/tv URL into `{provider, videoId}` (regex-validated: 11-char YouTube IDs, 5-20 char alphanumeric Instagram shortcodes).
- `videoEmbed(provider, id)` builds the iframe src: YouTube via `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0` (privacy-enhanced domain — also the only two frame-src origins allowed in CSP, alongside `https://www.instagram.com`); Instagram via `https://www.instagram.com/reel/{id}/embed/`.
- `videoThumb(provider, id)`: YouTube thumbnails resolve directly (`https://i.ytimg.com/vi/{id}/hqdefault.jpg`); Instagram thumbnails are proxied through this app's own `/api/ig-thumb/{id}` route (see below) because Instagram's poster image is a signed, expiring CDN URL.
- CSP: `next.config.ts` sets `frame-src https://www.youtube-nocookie.com https://www.instagram.com`.

**Instagram thumbnail proxy — `/api/ig-thumb/[code]`:**
- File: `app/api/ig-thumb/[code]/route.ts`
- Resolves Instagram's public `/p/{code}/media/?size=l` endpoint server-side by following up to 4 redirect hops manually (`redirect: "manual"`), pinning every hop's hostname against an allowlist regex (`\.cdninstagram\.com`, `\.fbcdn\.net`, `(^|.)instagram.com`) so a hijacked `Location` header can never turn this route into an open proxy for arbitrary hosts.
- Validates `code` against `^[A-Za-z0-9_-]{5,20}$` before use; 400s otherwise.
- Rate-limited via `lib/rate-limit.ts` — `isRateLimited("ig-thumb", clientIp, 200/hr per IP, 2000/hr global)`, 429 when exceeded.
- Successful responses are cached for a day both at the Next.js fetch layer (`next: { revalidate: 86400 }`) and via response headers (`cache-control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800`).
- **Degrades gracefully:** any failure (bad code, non-image content-type, non-2xx, off-allowlist redirect, thrown error) returns a bare `404`, and callers fall back to a branded placeholder card client-side.

**Keep-alive / cold-start mitigation — `/api/health`:**
- File: `app/api/health/route.ts`
- `export const dynamic = "force-dynamic"`. Runs `select 1` through the Drizzle `db` connection and returns `{ ok: true }` (200) or `{ ok: false }` (503) on failure.
- Purpose: point an external pinger (cron-job.org, UptimeRobot, etc.) at this endpoint roughly every 4 minutes to stop Neon's free tier from suspending the database on idle, and to get alerted when the site is actually down.
- Complements the connection-layer mitigation in `lib/db/index.ts` (`connectionTimeoutMillis: 10_000` caps how long a request waits for Neon to wake up instead of hanging until the platform timeout).

**WhatsApp deep links:**
- File: `lib/whatsapp.ts`
- `whatsAppHref(message = "Hi")` builds a `https://wa.me/{number}?text=...` link. Number resolution order: `NEXT_PUBLIC_WHATSAPP_NUMBER` env override (for launch-time flexibility) falling back to the agency's real number from `COMPANY.phoneHref` in `lib/data.ts` — deliberately never a placeholder/fake number, since that could route real inquiries to a stranger.
- Env var: `NEXT_PUBLIC_WHATSAPP_NUMBER` (public — bundled client-side per Next.js `NEXT_PUBLIC_*` convention)

## Data Storage

**Databases:**
- PostgreSQL (Neon in production, Docker-Compose Postgres 16 locally)
  - Connection: `DATABASE_URL` env var
  - Client/ORM: Drizzle ORM over `pg.Pool` — `lib/db/index.ts`, schema in `lib/db/schema.ts`, queries in `lib/db/queries.ts`

**File Storage:**
- Cloudinary (see above) for property images; images may alternatively be pasted as arbitrary HTTPS URLs by an admin, restricted at the Next.js image-optimizer level by `images.remotePatterns` in `next.config.ts` (only `res.cloudinary.com` and `images.unsplash.com` are allowed — adding another host requires an explicit config change).

**Caching:**
- No dedicated cache service (Redis, etc.). Caching relies on Next.js `fetch`/route-segment revalidation (`next: { revalidate }`) and HTTP `cache-control` headers on the `ig-thumb` proxy. Rate limiting (`lib/rate-limit.ts`) is a `ponytail`-flagged in-memory, per-server-instance throttle — explicitly not shared across instances; the code comment notes moving to a shared store if the site scales horizontally.

## Authentication & Identity

**Auth Provider:**
- Custom, stateless admin session (no third-party auth provider).
- Implementation: `lib/admin/auth.ts` — cookie `gld_admin` (`ADMIN_COOKIE`) holding `"{expiryMs}.{hmac-sha256(expiryMs)}"`, signed with `ADMIN_SESSION_SECRET`. `verifyAdminToken` does a constant-time compare (`timingSafeEqual`) after checking expiry. No per-session revocation — the only way to force-logout a leaked session is rotating `ADMIN_SESSION_SECRET` (invalidates every session).
- The admin password itself is `ADMIN_PASSWORD` env var, checked at login (see `lib/admin/session.ts` / login route, not read in this pass).
- Enforced at two layers: `proxy.ts` (route gate, redirects unauthenticated `/admin/*` requests to `/admin/login`) and individual server actions/pages (defense in depth — the proxy comment explicitly states pages still verify the cookie themselves).
- Env vars: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or equivalent). Errors are logged via `console.error` throughout (`lib/email.ts`, `lib/news.ts`, `app/api/health/route.ts`, `app/api/ig-thumb/[code]/route.ts`).

**Uptime / Logs:**
- `/api/health` (above) is the only structured monitoring hook; intended for external pinger integration. No log aggregation service configured.

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment (`Dockerfile`, standalone Next.js output) — target platform not pinned in-repo beyond the Dockerfile; `docker-compose.yml` is documented as being for local end-to-end testing only, not production.

**CI Pipeline:**
- None detected in-repo (no `.github/workflows`, no other CI config found).

## Environment Configuration

**Required env vars (all `process.env.*` reads found in `lib/**` and `app/**`):**
- `DATABASE_URL` — Postgres connection string (Drizzle/`pg`)
- `ADMIN_PASSWORD` — admin login password
- `ADMIN_SESSION_SECRET` — HMAC signing key for admin session cookie
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary uploads/deletes
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` — SMTP auth for contact-form emails
- `NEWSDATA_API_KEY` — `/news` feed
- `NEXT_PUBLIC_SITE_URL` — public site origin (SEO/canonical URLs, `lib/seo.ts`)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — optional override for WhatsApp deep-link number (public/bundled)
- `NODE_ENV` — standard Next.js/node environment flag

**Secrets location:**
- Local: `.env` (git-ignored, confirmed present but not read/quoted per this analysis's secret-handling rules). `.env.example` also exists at repo root as the template.
- Docker Compose: `.env` injected via `env_file`, with `DATABASE_URL` overridden in-compose to point at the `db` service (`postgresql://postgres:dev@db:5432/global_landmark`) — the compose Postgres itself is loopback-only (`127.0.0.1:5439:5432`) and uses a dev-only password, explicitly documented in the compose file as never to be exposed to the network.
- Production: expected to be supplied by the hosting platform's env-var mechanism (not present in-repo).

## Webhooks & Callbacks

**Incoming:**
- None. No webhook receiver routes found.

**Outgoing:**
- None (no outbound webhook calls; all outbound traffic is either the newsdata.io fetch, the Instagram thumbnail proxy fetch, or Cloudinary/Gmail SDK calls listed above).

---

*Integration audit: 2026-08-20*
