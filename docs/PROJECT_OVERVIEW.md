# Project Overview

## What Global Landmark Realty Group is

A luxury real-estate brokerage brand. Logo: gold skyscraper cluster inside a gold ring, navy wordmark — signals high-rise/international luxury property, not residential-suburban. The site is the brand's primary marketing and lead-generation surface.

## What we're building

A luxury real-estate marketing website (Next.js 16, App Router). Editorial-modern aesthetic, rich but tasteful scroll/interaction design (GSAP + Framer Motion), built to convert high-net-worth visitors into inquiries — not a transactional listings portal (no MLS search-engine feel, no dense filter grids up front).

## Target audience

- **Luxury buyers** — HNW individuals/families, often relocating or buying second/investment homes. Expect polish, restraint, and credibility signals (press, notable sales, agent pedigree) over bargain-hunting UX.
- **Luxury sellers** — owners evaluating which brokerage best presents their property; site must double as a pitch deck ("list with us").
- **Investors** — interested in yield, off-plan, and portfolio properties; want data (stats, ROI framing) presented with the same visual weight as lifestyle imagery.
- **Referral network** — other agents/brokerages sizing up credibility before referring clients.

All four audiences are size-conscious: the site itself is a proof point of taste and competence, not just a catalogue.

## Goals

1. Establish Global Landmark as a credible, high-end brokerage on first scroll (hero + press/stats within view 1).
2. Convert visits into qualified inquiries — property inquiry, valuation request, agent contact — with minimal friction.
3. Present listings with editorial-grade imagery and detail without becoming a generic MLS clone.
4. Support agent/team presence (bios, direct contact) since luxury real estate sells on relationship + trust.
5. Be a technical showcase for the brand — the animation quality itself functions as a credibility signal (see [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md), [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md)).

## Scope (this build)

In: marketing site — home, listings, property detail, communities, about, agents, services, journal/insights, contact, list-with-us. See [SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md).

Out (for now): MLS/IDX live sync, transaction/CRM backend, buyer portal/login, multi-language i18n, dark mode (undecided — [TASKS.md](TASKS.md)). Content is assumed CMS-fed or static-authored later; this phase defines the data shape only ([CONTENT_MODEL.md](CONTENT_MODEL.md)).

## Success criteria

- Visual/motion quality reads as tier-equivalent to aaronkirman.com (primary reference) on first impression.
- Core Web Vitals stay healthy despite rich animation (LCP unaffected by hero video/motion, no scroll jank) — enforced via rules in [ANIMATION_GUIDELINES.md](ANIMATION_GUIDELINES.md#performance-rules).
- Every primary CTA (inquire, valuation, contact agent) reachable in ≤2 clicks from any page.
- Listings and property-detail pages support real photography at editorial-grade crops/aspect ratios without layout breakage ([DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md#imagery-rules)).
- Reduced-motion and keyboard/screen-reader users get a fully functional, non-broken experience (animation is enhancement, never the only path to content).
