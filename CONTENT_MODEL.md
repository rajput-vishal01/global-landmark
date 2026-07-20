# Content Model

> **Superseded for properties (July 2026):** the live schema is
> [lib/db/schema.ts](lib/db/schema.ts) (PostgreSQL via Drizzle) — projects,
> properties (kind: project|unit, category: sale|purchase|lease|invest,
> **no price by client decision** — deals close over calls), property_images
> (Cloudinary `publicId` or pasted URL), deals (date-windowed Deal of the
> Week queue). The shapes below remain the reference for entities not yet
> built (agents, communities, journal, offices).

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
