import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, ilike, lte, gte, or, sql, inArray } from "drizzle-orm";
import { db } from "./index";
import { deals, projects, properties, propertyImages, testimonialVideos } from "./schema";
import type { Deal, TestimonialVideo } from "./schema";
import {
  PUBLIC_IMAGE_COLUMNS,
  PUBLIC_PROJECT_COLUMNS,
  PUBLIC_PROPERTY_COLUMNS,
  type PublicProject,
  type PublicPropertyWithMedia,
} from "./public-columns";
import type { CategoryValue } from "@/lib/categories";
import { PUBLIC_STATUSES } from "@/lib/taxonomy/status";

/**
 * Public read layer. Every query fails soft (logs + empty result) so the
 * marketing site renders even when the database is unreachable — same
 * contract as lib/email.ts.
 *
 * Hot public reads are wrapped in unstable_cache (1h, tag "site-data") so
 * page renders skip the DB round-trip; admin mutations revalidate the tag.
 * Note: cached results are JSON-serialized — Date fields come back as
 * strings. No public component reads them (verified), sitemap uses the
 * uncached listPropertySlugs.
 *
 * TWO RULES, both load-bearing for the public/internal boundary:
 *
 * 1. Every query here passes an explicit `columns:` allowlist, and so does
 *    every nested `with:`. Drizzle returns all columns by default and
 *    `with: { project: true }` returns every column of the joined row —
 *    which is a leak the moment a joined table carries internal data.
 *
 * 2. Every query filters on `publicVisibility()`. A listing that is not
 *    published and Available must not appear on any public surface,
 *    including search results and the sitemap.
 */

export const SITE_DATA_TAG = "site-data";

const CACHE_OPTS = { revalidate: 3600, tags: [SITE_DATA_TAG] };

/** Today's date (YYYY-MM-DD) in the site's timezone, not UTC. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date()
  );
}

/** Canonical gallery order — admin edit page must match the public pages. */
export const IMAGE_ORDER = [asc(propertyImages.sortOrder), asc(propertyImages.id)];

/**
 * The publication gate, as a SQL condition. Mirrors isPubliclyVisible() in
 * lib/taxonomy/status.ts — that one guards a row in hand, this one keeps
 * hidden rows from ever being selected. Both read PUBLIC_STATUSES, so the
 * two cannot disagree about what "public" means.
 */
const publicVisibility = () =>
  and(
    eq(properties.publicationState, "published"),
    inArray(properties.listingStatus, [...PUBLIC_STATUSES])
  );

/**
 * Price resolution happens in SQL, not in a component.
 *
 * Selecting `demandPrice` and deciding whether to render it is NOT enough:
 * the value still ships in the RSC payload for every listing, so a withheld
 * price is readable in page source. Resolving it here means the database
 * returns null for anything not flagged public, and there is no hidden
 * figure in the payload to find.
 */
const PUBLIC_PRICE_EXTRA = {
  publicPrice:
    sql<number | null>`case when ${properties.showPricePublicly} then ${properties.demandPrice} else null end`.as(
      "public_price"
    ),
} as const;

/** The public shape of a joined project, allowlisted at the join. */
const PUBLIC_PROJECT_JOIN = { columns: PUBLIC_PROJECT_COLUMNS } as const;

/** Cards render the cover image only; the detail page asks for the gallery. */
const coverImageJoin = { columns: PUBLIC_IMAGE_COLUMNS, orderBy: IMAGE_ORDER, limit: 1 } as const;
const galleryJoin = { columns: PUBLIC_IMAGE_COLUMNS, orderBy: IMAGE_ORDER } as const;

type PropertyFilters = {
  category?: CategoryValue;
  propertyType?: string;
  possessionStatus?: string;
  furnishing?: string;
};

/**
 * Fail-soft wrapper OUTSIDE the cache: the cached inner query throws on DB
 * failure (unstable_cache never stores errors), so a DB blip degrades that
 * one render instead of poisoning the cache with empty data for an hour.
 * One delayed retry absorbs serverless-Postgres cold starts (Neon suspends
 * on idle and the first query after wake often fails).
 */
function failSoft<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  label: string,
  fallback: R
): (...args: A) => Promise<R> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error(`${label} failed, retrying once:`, err);
      await new Promise((r) => setTimeout(r, 1500));
      try {
        return await fn(...args);
      } catch (retryErr) {
        console.error(`${label} failed after retry:`, retryErr);
        return fallback;
      }
    }
  };
}

const listPropertiesCached = unstable_cache(
  async (filters: PropertyFilters = {}): Promise<PublicPropertyWithMedia[]> => {
    const conditions = [
      publicVisibility(),
      filters.category ? eq(properties.category, filters.category) : undefined,
      filters.propertyType ? eq(properties.propertyType, filters.propertyType) : undefined,
      filters.possessionStatus
        ? eq(properties.possessionStatus, filters.possessionStatus)
        : undefined,
      filters.furnishing ? eq(properties.furnishing, filters.furnishing) : undefined,
    ].filter((c): c is NonNullable<typeof c> => Boolean(c));

    // Cards only render the cover image — fetching whole galleries here
    // would bloat every cached list entry.
    return db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      where: and(...conditions),
      with: { images: coverImageJoin, project: PUBLIC_PROJECT_JOIN },
      orderBy: [desc(properties.createdAt)],
    });
  },
  ["listProperties"],
  CACHE_OPTS
);

export const listProperties = failSoft(listPropertiesCached, "listProperties", []);

const getFeaturedPropertiesCached = unstable_cache(
  async (limit = 6): Promise<PublicPropertyWithMedia[]> =>
    db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      where: publicVisibility(),
      with: { images: coverImageJoin, project: PUBLIC_PROJECT_JOIN },
      orderBy: [desc(properties.createdAt)],
      limit,
    }),
  ["getFeaturedProperties"],
  CACHE_OPTS
);

export const getFeaturedProperties = failSoft(
  getFeaturedPropertiesCached,
  "getFeaturedProperties",
  []
);

const getPropertyBySlugCached = unstable_cache(
  async (slug: string): Promise<PublicPropertyWithMedia | null> => {
    const row = await db.query.properties.findFirst({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      // A direct-link visit to a sold or draft listing must 404, not render.
      where: and(eq(properties.slug, slug), publicVisibility()),
      with: {
        // Full gallery — the detail page renders every image.
        images: galleryJoin,
        project: PUBLIC_PROJECT_JOIN,
      },
    });
    return row ?? null;
  },
  ["getPropertyBySlug"],
  CACHE_OPTS
);

export const getPropertyBySlug = failSoft(
  getPropertyBySlugCached,
  "getPropertyBySlug",
  null
);

export async function searchProperties(
  q: string,
  limit = 8
): Promise<PublicPropertyWithMedia[]> {
  // Multi-word queries match token-by-token: every word must hit at least
  // one field, so "penthouse chandigarh" finds a penthouse in Chandigarh
  // even though no single column contains that exact substring.
  const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!tokens.length) return [];
  const full = `%${q.trim()}%`;

  try {
    const tokenConditions = tokens.map((token) => {
      const term = `%${token}%`;
      return or(
        ilike(properties.title, term),
        ilike(properties.location, term),
        ilike(properties.description, term),
        ilike(properties.configuration, term),
        ilike(properties.propertyType, term),
        // Raw identifiers: interpolating drizzle columns here would inherit
        // the outer query's "properties" alias and break the subquery.
        sql`${properties.projectId} in (select p.id from projects p where p.name ilike ${term})`
      );
    });

    return await db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      // This feeds /api/search, a public JSON endpoint — the visibility gate
      // matters more here than anywhere else.
      where: and(publicVisibility(), ...tokenConditions),
      with: { images: coverImageJoin, project: PUBLIC_PROJECT_JOIN },
      // Relevance: whole-phrase title hits first, then location hits,
      // then newest.
      orderBy: [
        desc(sql`(${properties.title} ilike ${full})::int`),
        desc(sql`(${properties.location} ilike ${full})::int`),
        desc(properties.createdAt),
      ],
      limit,
    });
  } catch (err) {
    console.error("searchProperties failed:", err);
    return [];
  }
}

export type ActiveDeal = Deal & { property: PublicPropertyWithMedia };

const getActiveDealCached = unstable_cache(
  async (today: string): Promise<ActiveDeal | null> => {
    const row = await db.query.deals.findFirst({
      where: and(lte(deals.startsAt, today), gte(deals.endsAt, today)),
      orderBy: [asc(deals.startsAt)],
      with: {
        // Deal of the Week renders on the homepage, so the deal's property
        // needs the same allowlist and the same visibility gate as any
        // other public read — a sold property must not resurface here.
        property: {
          columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
          with: { images: galleryJoin, project: PUBLIC_PROJECT_JOIN },
        },
      },
    });
    return (row as ActiveDeal | undefined) ?? null;
  },
  ["getActiveDeal"],
  CACHE_OPTS
);

/**
 * The deal whose window covers today (IST); earliest start wins on overlap.
 * The date is part of the cache key, so the result rolls over at midnight.
 */
export const getActiveDeal = (): Promise<ActiveDeal | null> =>
  failSoft(getActiveDealCached, "getActiveDeal", null)(todayIST());

const listTestimonialVideosCached = unstable_cache(
  async (): Promise<TestimonialVideo[]> =>
    db.query.testimonialVideos.findMany({
      orderBy: [asc(testimonialVideos.sortOrder), desc(testimonialVideos.createdAt)],
    }),
  ["listTestimonialVideos"],
  CACHE_OPTS
);

export const listTestimonialVideos = failSoft(
  listTestimonialVideosCached,
  "listTestimonialVideos",
  []
);

/**
 * ADMIN ONLY — the project picker on the property form. Returns the full
 * row including internal fields, so it must never be called from
 * `app/(site)/**`. Public project reads use PUBLIC_PROJECT_COLUMNS.
 */
export async function listProjectsForAdmin(): Promise<PublicProject[]> {
  try {
    return await db.query.projects.findMany({
      columns: PUBLIC_PROJECT_COLUMNS,
      orderBy: [asc(projects.name)],
    });
  } catch (err) {
    console.error("listProjectsForAdmin failed:", err);
    return [];
  }
}

/**
 * Sitemap source. Uncached on purpose (cached results JSON-serialize Dates)
 * and gated: a sold, draft or archived listing must not be advertised to
 * search engines and then 404 when crawled.
 */
export async function listPropertySlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  try {
    return await db
      .select({ slug: properties.slug, updatedAt: properties.updatedAt })
      .from(properties)
      .where(publicVisibility());
  } catch (err) {
    console.error("listPropertySlugs failed:", err);
    return [];
  }
}
