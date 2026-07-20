# Plan: Global Landmark — Feature Expansion

**Complexity**: Large
**Status**: awaiting confirmation — no code until approved

## Orientation findings (what exists today)

- **Routes**: `/`, `/about`, `/properties`, `/contact` + `error/not-found/loading`, `sitemap.ts`, `robots.ts`. All verified rendering (200) in browser. No dynamic routes, no route groups, no `proxy.ts`, no DB, no API routes.
- **Data**: `lib/listings.ts` — 6 hardcoded dummy listings (`Listing` type, price as string). Home `FeaturedListings` and `/properties` both consume it.
- **Contact flow**: `app/contact/actions.ts` server action (honeypot, validation, length caps) → `lib/email.ts` nodemailer/Gmail (admin + thanks emails, brand-styled HTML).
- **Design tokens**: Tailwind v4 `@theme` in `app/globals.css` — `ink #141414`, `cream`, `gold/gold-highlight/gold-deep`, `border`, fluid type scale (`text-h1…text-meta`, `text-eyebrow`). **Note: the built site deliberately dropped navy as UI ink** ("navy lives only in the logo") — new work follows the code's token system, not the older BRAND_GUIDELINES navy.
- **Fonts**: Prata (serif display, uppercase + tracking) + Manrope (sans).
- **Motion system**: `lib/gsap.ts` (ScrollTrigger, SplitText, `EASE_HEAVY = power3.inOut`); global `ScrollReveals` engine — sections opt in via `data-reveal`, `data-reveal-img`, `data-unveil`, `data-drift`; Lenis smooth scroll on GSAP ticker; Framer Motion for state-driven UI (FullscreenMenu portal + AnimatePresence). Division of labor per ANIMATION_GUIDELINES.md is respected in code.
- **Signatures to reuse**: gold corner-frame CTA (Button `corner` variant), eyebrow labels, gold hairline rules, dark `min-h-[78vh]` subpage heros, marquee keyframes (PressMarquee), `Magnetic` wrapper, 4:5 `ListingCard`.
- **Existing Testimonials section**: static sticky-left heading + bordered quote rows — feature 1 upgrades this.
- **Next.js 16 confirmed quirks**: `proxy.ts` replaces `middleware.ts` (docs at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — read before writing it).

## Requirements restatement

1. Testimonials become auto-scrolling.
2. Persistent WhatsApp button → `wa.me` deep link, prefilled "Hi".
3. Inquiry pop-up near the WhatsApp flow ("Contact us for more details").
4. Dynamic property search (hero and/or nav) over DB properties.
5. Hero represents Sale / Purchase / Lease / Invest.
6. Admin panel: properties CRUD — multiple images (Cloudinary), description, location, **no price**, kind = project or unit, cascade delete incl. Cloudinary assets.
7. `/properties` fed by DB, dummy data removed, category filter.
8. Deal of the Week: date-ranged, calendar picker, queued future deals auto-go-live, shown on landing page.
9. Social-proof ticker with randomized placeholder activity.
10. Admin-managed project/society names (confirm naming with client).
11. Multi-image gallery + `/properties/[slug]` detail page.
12. `/news` via newsdata.io, filtered to relevant real-estate/regional news.
13. PostgreSQL; no public-site auth; admin hidden behind a subdomain.

## Stack additions (ladder-checked)

| Need | Choice | Why |
|---|---|---|
| DB access | **Drizzle ORM + `pg`** | Typed rows across admin CRUD + public queries; `drizzle-kit` handles schema push/migrations. Prisma too heavy; raw `pg` loses types across ~10 query sites. |
| Image hosting | **`cloudinary`** (server-only SDK) | Signed direct-to-Cloudinary browser uploads (avoids server-action body limits); `api.delete_resources` for cascade delete. |
| Date picking | **native `<input type="date">`** | Ladder rung 4. No picker lib. |
| Search | **Postgres `ILIKE`** | Scale is tens of properties. No search service. |
| News | **plain `fetch` + `revalidate`** | No SDK needed. |
| Admin auth | **env password + HMAC-signed cookie** | No user system requested; subdomain alone is obscurity, not security — a password gate is the minimum defensible bar. |

## Data model (new `lib/db/schema.ts`)

```
projects        id, name (unique), slug, description?, createdAt
properties      id, slug (unique), title, kind ('project'|'unit'),
                projectId? → projects.id (unit's parent society; null for standalone),
                category ('sale'|'purchase'|'lease'|'invest'),
                description, location (text), createdAt, updatedAt
property_images id, propertyId → properties.id ON DELETE CASCADE,
                publicId (cloudinary), url, width, height, alt, sortOrder
deals           id, propertyId → properties.id ON DELETE CASCADE,
                startsAt (date), endsAt (date), createdAt
```

- **No price anywhere** (supersedes CONTENT_MODEL.md's `price` — deal-making happens on calls).
- **Active deal is computed, not scheduled**: `WHERE now() BETWEEN startsAt AND endsAt ORDER BY startsAt LIMIT 1`. Queue = future rows. Expiry/auto-go-live needs zero cron.
- **Testimonials + ticker data stay in code** (static arrays) — admin management wasn't requested. Upgrade path: table + CRUD if client asks.
- News filter config = env/constants, no table.

## Routes & pages

| Route | Action |
|---|---|
| `/properties` | Rewire to DB; delete `lib/listings.ts`; category chip filter via `?category=` (URL as state, server-filtered) |
| `/properties/[slug]` | NEW detail page: dark hero w/ primary image, gallery (thumbs + Framer Motion lightbox), description, location, project/society link, category badge, inquiry CTA + WhatsApp link |
| `/news` | NEW: newsdata.io server fetch, `revalidate: 3600`, editorial card grid, graceful empty/error state |
| `/` | Hero category rotator; Deal of the Week section; ticker; scrolling testimonials |
| `/admin/*` | NEW admin panel (subdomain-gated): login, properties list/new/edit, projects, deals |
| `/api/search` | NEW route handler: `?q=` → ILIKE over title/location/project name, limit 8 |
| `/api/admin/sign-upload` | NEW: returns signed Cloudinary upload params (admin-cookie-gated) |
| `proxy.ts` | NEW: host check — `admin.<domain>` rewrites to `/admin/*`; `/admin` on main host → 404; verifies admin cookie on all admin paths except login |
| `sitemap.ts` | Add dynamic property slugs + `/news` |
| `nav-links.ts` | Add News (header + menu); admin gets NO public link anywhere |

## Feature-by-feature approach

1. **Testimonial scroll** — keep sticky serif intro left; right column becomes a continuous vertical auto-scroll loop (CSS keyframe like `marquee`, duplicated list, pause on hover, `prefers-reduced-motion` → static). Data stays static.
2. **WhatsApp button** — floating bottom-right, gold-ringed circle w/ WhatsApp glyph, `href="https://wa.me/${NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi"`, `target="_blank" rel="noopener noreferrer"`. Rendered in root layout (all pages). Subtle Framer entrance after 1.5s.
3. **Inquiry pop-up** — small card that slides up beside the WhatsApp button after ~8s ("Contact us for more details") with CTA opening a modal (`AnimatePresence` portal, same pattern as FullscreenMenu) hosting the existing `ContactForm` (reused, optional `propertyTitle` prefill on detail pages). Dismissal remembered in `sessionStorage`.
4. **Property search** — debounced client combobox (hero + FullscreenMenu), hits `/api/search`, results dropdown → `/properties/[slug]`. Keyboard navigable, listbox ARIA.
5. **Hero Sale/Purchase/Lease/Invest** — 4 rotating slides inside existing hero frame (image + eyebrow category + headline crossfade, GSAP timeline, ~6s interval, category click → `/properties?category=x`); rotation pauses for reduced-motion (static first slide). Keeps existing load-in + pin/scrub untouched.
6. **Admin panel** — server components + server actions, token-styled but utilitarian (no scroll animation). Multi-image upload: file input → browser uploads direct to Cloudinary with signed params → hidden field carries publicIds → action writes rows. Delete flow: fetch image publicIds → `cloudinary.api.delete_resources` → on success DB delete (FK cascades images/deals). Cloudinary failure aborts delete: no orphans by construction.
7. **Properties live** — server queries w/ `revalidateTag('properties')` fired by admin mutations; home FeaturedListings = 6 newest.
8. **Deal of the Week** — admin form: property select + 2 native date inputs, list shows Active / Queued / Expired; landing section between FeaturedListings and ArchReveal: full-bleed dark band, "Deal of the Week" eyebrow, property image + title + gold corner CTA. Hidden when no active deal.
9. **Ticker** — thin fixed bottom strip (marquee reuse), randomized from name/action/property pools, client-only (`useEffect` mount gate avoids hydration mismatch). *Design tension flagged: rummy-style ticker vs. luxury restraint — will style to brand (dark strip, serif names, gold rule separators). Restrained alternative (single rotating toast) offered at confirmation.*
10. **Projects/societies** — simple name CRUD + property form dropdown. Exact naming conventions ("Nirvana", "Green Lotus"…) to be confirmed with client — schema is names, so zero rework either way.
11. **Gallery + detail view** — covered by `/properties/[slug]` + `property_images`.
12. **News** — `q=real estate`, country/language filter (confirm with client), `NEWSDATA_API_KEY` server-only.
13. **DB & admin access** — Drizzle + `DATABASE_URL`; subdomain rewrite in `proxy.ts`; login = password → HMAC cookie (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`). Local dev: `admin.localhost:3000`.

## Env vars (all validated at use-site, graceful failure)

`DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEWSDATA_API_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (+ existing `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NEXT_PUBLIC_SITE_URL`). Add `res.cloudinary.com` to `next.config.ts` remotePatterns.

## Patterns to mirror

| Category | Source | Pattern |
|---|---|---|
| Server action shape | `app/contact/actions.ts` | `"use server"`, typed state, validation-first, honeypot, try/catch with friendly error |
| Section styling | `app/properties/page.tsx` | dark `min-h-[78vh]` hero, `data-reveal`, eyebrow + serif h1 |
| Modal/overlay | `components/sections/FullscreenMenu.tsx` | portal + AnimatePresence + EASE const |
| Marquee | `PressMarquee` + `globals.css` keyframes | duplicated list + `animate-marquee` |
| Card | `components/ui/ListingCard.tsx` | 4:5 image, hover zoom 1.05, meta row |
| GSAP usage | `components/sections/Hero.tsx` | `useGSAP` + `matchMedia` reduced-motion guard |
| Ponytail comments | throughout | `// ponytail:` names ceiling + upgrade path |

## Sequencing

| Phase | Scope | Depends on |
|---|---|---|
| 1. Foundation | Drizzle + schema + `lib/db`, seed script, env validation, `proxy.ts` (subdomain + auth cookie), admin login | — |
| 2. Admin CRUD | Projects, properties (multi-image Cloudinary upload), cascade delete, deals queue | 1 |
| 3. Public live data | `/properties` rewire + category filter, `/properties/[slug]` detail + gallery, FeaturedListings, delete `lib/listings.ts`, sitemap | 2 |
| 4. Discovery | `/api/search` + hero/nav search UI; hero 4-category rotator | 3 |
| 5. Landing features | Deal of the Week section; testimonial scroll; ticker | 2 (deals), rest — |
| 6. Engagement | WhatsApp button; inquiry pop-up (reuses ContactForm) | — |
| 7. News | `/news` + nav update | — |
| 8. Polish | reduced-motion audit on new motion, `npm run build` + lint green, doc sync (CONTENT_MODEL/SITE_ARCHITECTURE/TASKS), Lighthouse sanity | all |

Phases 5–7 are parallelizable after 2–3.

## Validation

```bash
npm run lint && npm run build
node scripts/seed.mjs        # seed + one runnable check per ponytail
# manual: admin.localhost:3000 CRUD round-trip incl. delete → Cloudinary asset gone
# manual: /properties?category=lease filters; search returns seeded property; deal band appears within date window
```

## Risks

| Risk | Level | Mitigation |
|---|---|---|
| Next 16 API drift vs. training data | HIGH | Read `node_modules/next/dist/docs` for proxy, route handlers, revalidateTag before each phase |
| Cloudinary delete fails → orphaned images | MED | Delete Cloudinary first, abort on failure; `delete_resources` idempotent so retry-safe |
| Admin exposed if subdomain guessed | MED | Password + signed cookie enforced in proxy, not just hidden |
| Upload size via server actions | MED | Direct-to-Cloudinary signed browser upload; server never proxies files |
| newsdata.io free-tier limits/irrelevant results | LOW | 1h ISR cache + graceful empty state; filter tuning with client |
| Ticker/pop-up clutter vs. luxury brand | LOW | Brand-styled restraint; toast alternative offered |
| Prod subdomain routing | LOW | Vercel/DNS wildcard note in deploy step; local via `admin.localhost` |

## Open questions (blocking individual features, not the build)

1. WhatsApp number for `wa.me` link?
2. Admin subdomain name (`admin.`?) + confirm hosting supports subdomains (Vercel: yes).
3. newsdata.io: which country/language/keywords? API key available?
4. Project/society naming conventions (per feature 10 — client confirm).
5. Categories exactly `Sale / Purchase / Lease / Invest` as user-facing labels?
6. Ticker: full scrolling marquee (as asked) or restrained rotating toast?
