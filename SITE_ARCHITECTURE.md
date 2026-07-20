# Site Architecture

> **Built so far (July 2026):** `/`, `/about`, `/contact`, `/properties` (live DB data + category filter), `/properties/[slug]`, `/news` — under the `(site)` route group — plus the admin panel served only on the `admin.` subdomain (`proxy.ts`). The rest of this sitemap is the longer-term target.

Sitemap for the marketing site. Routes assume the `(marketing)` route group from [TECH_STACK.md](TECH_STACK.md#folder-structure).

| Route | Page | Why it exists |
|---|---|---|
| `/` | Home | First impression + credibility. Hero, credibility band (stats/press), featured listings, community teaser, agent teaser, journal teaser, CTA band. Must land the aaronkirman.com-tier impression within one scroll ([PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md#success-criteria)). |
| `/properties` | Listings | Core discovery surface for buyers/investors. Real grid (not slider-only, per [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md)), filter bar (price, beds, location, status), fixed-aspect-ratio cards. |
| `/properties/[slug]` | Property Detail | Where inquiries convert. Gallery, spec sheet (metadata sidebar pattern from big.dk), signature scrubbed-reveal image, floor plans, map, agent contact, similar listings. |
| `/communities` | Communities/Neighborhoods index | Luxury buyers buy a location as much as a property — this page sells the area (skyline, lifestyle, amenities) before individual listings. |
| `/communities/[slug]` | Community Detail | Deep dive on one neighborhood/development — imagery-led, stats (avg. price, walk score, etc.), listings within that community. |
| `/about` | About | Brand story, credibility, differentiation. Feeds the "is this brokerage legitimate" question for all four audiences. |
| `/agents` | Team/Agents index | Luxury real estate sells on relationship — this is a trust surface, especially for sellers evaluating who represents them. |
| `/agents/[slug]` | Agent Detail | Individual bio, specialties, active/sold listings, direct contact — supports referral-network and seller audiences specifically. |
| `/services/buy` | Buy | Explains the buyer journey/value prop. Distinct from `/properties` — this is persuasion, not discovery. |
| `/services/sell` | Sell | The "list with us" pitch in depth — process, marketing approach, track record. Primary seller-conversion page. |
| `/services/invest` | Invest | Investor-specific framing (yield, off-plan, portfolio) — distinct audience needs distinct proof points (ROI data, not lifestyle imagery). |
| `/journal` | Journal/Insights index | Market insight content — SEO surface, and a credibility/expertise signal for all audiences. |
| `/journal/[slug]` | Journal Article | Individual article. Reading-width container (~1100px, per [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md#layout-system)). |
| `/contact` | Contact | General inquiry catch-all — form + office locations/map. |
| `/list-with-us` | List With Us | Dedicated seller-lead-capture page — could be a service under `/services/sell`, kept as its own top-level route because it's the primary seller CTA target from nav/footer and deserves its own conversion-focused URL rather than being buried under `/services`. |

## Navigation structure

- **Primary nav** (header): Properties, Communities, Agents, About, Journal, Contact — six items max, flat (no deep dropdowns), per the aaronkirman.com-over-omniyat.com nav-depth decision in [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md).
- **Primary CTA** (always visible in header, distinct styling): "List With Us" or "Contact an Agent" depending on page context.
- **Footer**: full sitemap, office locations, social, legal (privacy, fair housing/equal opportunity disclosures — required for real estate), newsletter signup.
- **Services** (`/services/buy`, `/sell`, `/invest`) are reachable from footer and from contextual CTAs on relevant pages (e.g. a "Thinking of selling?" CTA band on `/properties/[slug]`) rather than cluttering the primary header nav.

## Not in scope this phase

MLS/IDX sync, buyer portal/login, saved-search/favorites (would need auth), multi-language routing. See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md#scope-this-build).
