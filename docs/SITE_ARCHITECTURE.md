# Site Architecture

> **Routes as built (Sep 2026).** The table below is what exists in `app/`. The original design-time sitemap (communities, agents, services, journal, list-with-us) was never built: `/sell` became the seller page and `/news` the insight surface. The builder profile pages (`/builders/[slug]`) and area pages (`/areas`, `/areas/[slug]`) were removed in Sep 2026 (7103eff); `next.config.ts` redirects all three to `/properties` (308, permanent) so old links land on the listings. The `builders` and `areas` tables stay, so no stored data was lost.

Public pages sit in the `(site)` route group, which adds the enquiry dock, the WhatsApp button, the back-to-top button and the callback pop-up to every page.

## Public routes

| Route | Page |
|---|---|
| `/` | Home: hero with search, credibility band, featured listings, Deal of the Week, locations, about split, developer marquee, services, client quotes (with the office's Google reviews), video reels, CTA band. |
| `/properties` | Listings: search console (keyword, city, type, configuration, collection) with removable filter chips, sort, grid/list view, pagination, location cards, recently viewed. The URL still accepts the retired filters (category, possession, furnishing, locality, sector), so old links keep working. |
| `/properties/[slug]` | Property detail: gallery and full-screen viewer (original files), a sticky jump bar (Overview, Details, Amenities, Plans, Videos, Location — each only when it has content), a sticky enquiry card, "Request details" and "Book a site visit" dialogs, a map preview that opens the listing's Google Maps link, area converter, public brochures, similar listings. |
| `/projects/[slug]` | Project page: towers and unit table, amenities, builder line, RERA, enquiry form. |
| `/sell` | Owners list a property: form with photo upload and an optional Google Maps link. The exact address stays private (see [CONTENT_MODEL.md](CONTENT_MODEL.md)); the row lands in Admin → Property Submissions. |
| `/news` | Tricity property news via newsdata.io (12h cache), with a fallback state when the key is unset. |
| `/about`, `/contact` | Company story; contact form (writes a lead), office details and map, social profiles. |
| `/privacy`, `/terms`, `/data-deletion` | Legal pages, built from `lib/legal.ts` and the Udyam details in `lib/data.ts`. |
| `/offline` | Service-worker fallback page. |

Unknown slugs render a "Not found" page with `noindex`. The status stays 200 on purpose: the root `app/loading.tsx` streams every route, so the status line is sent before the page can call `notFound()`.

## Machine routes

| Route | What |
|---|---|
| `/sitemap.xml` | `app/sitemap.ts`, evaluated per request: static pages, every public listing and every project. |
| `/robots.txt` | `app/robots.ts`: allows `/` and `/api/images/`, disallows `/api/` and `/admin`. |
| `/manifest.webmanifest` | `app/manifest.ts` (PWA). |
| `/og` | The branded share card (`app/og/route.tsx`), rendered once at build. |
| `/api/search` | Portfolio search for the hero and menu. |
| `/api/images/[key]`, `/api/documents/[key]` | Uploaded photos; brochures an admin marked public. |
| `/api/sell/upload` | Photo upload for `/sell` (rate-limited, public). |
| `/api/ig-thumb/[code]` | Instagram reel thumbnails for the video reels. |
| `/api/health` | Health check used by the deploy. |
| `/api/admin/*` | Admin-only: private documents, uploads, lead CSV export. |

Requests on `www.` are redirected to the bare domain (308, `next.config.ts`).

## Admin

`/admin` and everything under it: [ADMIN_DESK.md](ADMIN_DESK.md#current-screens) lists the screens. `proxy.ts` sends visitors without a session to `/admin/login`, and every admin page and action checks the session again.

## Navigation structure

- **Header** (`components/sections/nav-links.ts`): About, Listings, Sell, News, plus the phone and a call button.
- **Full-screen menu**: Home, About, Listings, Sell, News, Contact, with portfolio search.
- **Footer**: office address and map preview, phone and email, social profiles, the Udyam number, and the legal pages.

## Not in scope this phase

MLS/IDX sync, buyer portal/login, saved-search/favorites (would need auth), multi-language routing. See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md#scope-this-build).
