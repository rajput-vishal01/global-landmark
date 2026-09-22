# Content Model

> **Superseded for properties.** The live schema is
> [lib/db/schema.ts](../lib/db/schema.ts) (MySQL via Drizzle; migrations are
> the plain SQL files in `drizzle/`, applied by `scripts/migrate.mjs`).
> The shapes further down remain the reference only for entities never built
> (agents, communities, journal, offices).
>
> **The listing model as it stands (Sep 2026):**
> - **Properties** — `kind` project|unit. The admin form was cut down at the
>   client's request: category and status, prices and charges, configuration,
>   classification, unit sizes and specifications are no longer form fields.
>   The columns remain, so older rows keep their data and an admin save never
>   blanks them. `demand_price` has no form field, so new listings show
>   "Price on request". There is no commercial property type and no
>   sale/rent choice (the five types are Residential Plot, Independent House,
>   Villa, Flat/Apartment, Penthouse).
> - **Location** — the free-text address plus a Google Maps link (`maps_url`,
>   Google hosts only, https). Latitude/longitude were retired (migration
>   0004). City and locality are derived from the address
>   (`placeFromAddress` in `lib/locations.ts`) and still drive the city filter.
> - **Projects** carry the details every unit shares — address, maps link,
>   amenities, legal and loan flags, banks on panel, RERA number (0005).
>   Filing a unit under a project pre-fills those on the property form. A
>   unit's tower must belong to its own project (0007 cleared cross-project
>   links).
> - **Images** — `property_images`, files on disk under `UPLOAD_DIR`, served
>   untouched at `/api/images/<sha256>.<ext>` (see [TECH_STACK.md](TECH_STACK.md)).
> - **Documents** — `property_documents`, private, one row per file, grouped by
>   document type in the admin's document vault with inline preview; served
>   only to admins at `/api/admin/documents/<key>`.
> - **Owner submissions** from `/sell` land as draft properties; the seller's
>   exact address goes to `property_owners.address` (private), never the
>   public address line (0006).
> - **Builders and areas** — their pages were removed (redirects to
>   `/properties`); the tables stay so no stored data is lost.
> - **Deals** — date-windowed Deal of the Week queue; only live listings qualify.
> - **Demo data** — `scripts/seed-demo.mjs` adds invented projects and listings
>   marked `addedBy = "Dealer"`, `sourceName = "Demo data"`; see
>   [scripts/seed-demo/README.md](../scripts/seed-demo/README.md).

Data shapes for the primary entities. Framework-agnostic (works whether content ends up in a headless CMS, MDX, or a typed local dataset) — defined here as the contract, implementation lands in `lib/content/` per [TECH_STACK.md](TECH_STACK.md#folder-structure).

## Property / Listing

```ts
type Property = {
  slug: string
  title: string                 // e.g. "The Meridian Penthouse"
  status: "for-sale" | "for-rent" | "under-offer" | "sold" | "off-plan"
  price: number                 // base currency unit, formatted at render time
  currency: string               // ISO 4217, e.g. "USD"
  priceOnRequest?: boolean       // luxury listings often omit public price

  beds: number
  baths: number
  sqft: number
  lotSqft?: number
  yearBuilt?: number

  location: {
    address?: string             // may be withheld for privacy pre-inquiry
    communitySlug?: string        // FK to Community
    city: string
    region: string
    country: string
    lat: number
    lng: number
  }

  media: {
    heroImage: MediaAsset
    gallery: MediaAsset[]
    floorPlans?: MediaAsset[]
    video?: MediaAsset
  }

  features: string[]             // "Private Pool", "Wine Cellar", "Smart Home"
  description: string            // rich text / MDX
  agentSlug: string               // FK to Agent
  featured: boolean
  publishedAt: string             // ISO date
}

type MediaAsset = {
  url: string
  alt: string
  width: number
  height: number
  aspectRatio?: "4:5" | "3:2"     // per DESIGN_LANGUAGE.md imagery rules
}
```

## Agent

```ts
type Agent = {
  slug: string
  name: string
  title: string                  // "Founding Partner", "Senior Agent"
  photo: MediaAsset
  bio: string                    // rich text
  specialties: string[]          // "Waterfront", "New Development", "Investment"
  languages?: string[]
  phone: string
  email: string
  socialLinks?: { platform: string; url: string }[]
  officeSlug?: string             // FK to Office, if multi-office
}
```

## Community / Neighborhood

```ts
type Community = {
  slug: string
  name: string
  heroImage: MediaAsset
  gallery: MediaAsset[]
  description: string             // rich text
  stats?: {
    avgPrice?: number
    walkScore?: number
    propertyCount?: number
  }
  lat: number
  lng: number
}
```

## Journal / Insights Article

```ts
type Article = {
  slug: string
  title: string
  excerpt: string
  category: string                // "Market Report", "Buying Guide", "Lifestyle"
  coverImage: MediaAsset
  body: string                    // rich text / MDX
  authorSlug?: string              // FK to Agent, optional
  publishedAt: string
}
```

## Office / Location (supports multi-office footer, per aaronkirman.com pattern)

```ts
type Office = {
  slug: string
  name: string
  address: string
  phone: string
  lat: number
  lng: number
}
```

## Inquiry / Lead (form submission shape, not content)

```ts
type Inquiry = {
  type: "property" | "valuation" | "general" | "newsletter"
  name: string
  email: string
  phone?: string
  message?: string
  propertySlug?: string           // set when type === "property"
  submittedAt: string
}
```

## Notes

- All FK-style fields (`agentSlug`, `communitySlug`, `officeSlug`, `authorSlug`) are slugs, not numeric IDs — keeps content human-editable regardless of eventual CMS choice.
- `priceOnRequest` exists because ultra-luxury listings frequently withhold public pricing — the `PropertyCard`/`PropertySpecSheet` components ([COMPONENT_INVENTORY.md](COMPONENT_INVENTORY.md)) must handle this branch, not assume `price` always renders.
- `MediaAsset.aspectRatio` is a content-level hint so authors/CMS editors crop consistently at source, reinforcing the fixed-aspect-ratio rule in [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md#imagery-rules) rather than relying on CSS `object-fit` to paper over inconsistent source crops.
- No auth/user model — out of scope per [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md#scope-this-build).
