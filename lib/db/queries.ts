import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, ilike, lte, gte, or, sql } from "drizzle-orm";
import { db } from "./index";
import { deals, projects, properties, propertyImages, testimonialVideos } from "./schema";
import type { Deal, Project, PropertyWithImages, TestimonialVideo } from "./schema";
import type { CategoryValue } from "@/lib/categories";

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
      console.error(`${label} failed:`, err);
      return fallback;
    }
  };
}

const listPropertiesCached = unstable_cache(
  async (filters: PropertyFilters = {}): Promise<PropertyWithImages[]> => {
    const conditions = [
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
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        images: { orderBy: IMAGE_ORDER, limit: 1 },
        project: true,
      },
      orderBy: [desc(properties.createdAt)],
    });
  },
  ["listProperties"],
  CACHE_OPTS
);

export const listProperties = failSoft(listPropertiesCached, "listProperties", []);

const getFeaturedPropertiesCached = unstable_cache(
  async (limit = 6): Promise<PropertyWithImages[]> =>
    db.query.properties.findMany({
      with: {
        images: { orderBy: IMAGE_ORDER, limit: 1 },
        project: true,
      },
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
  async (slug: string): Promise<PropertyWithImages | null> => {
    const row = await db.query.properties.findFirst({
      where: eq(properties.slug, slug),
      with: {
        // Full gallery — the detail page renders every image.
        images: { orderBy: IMAGE_ORDER },
        project: true,
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
): Promise<PropertyWithImages[]> {
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
      where: and(...tokenConditions),
      with: {
        images: { orderBy: IMAGE_ORDER, limit: 1 },
        project: true,
      },
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

export type ActiveDeal = Deal & { property: PropertyWithImages };

const getActiveDealCached = unstable_cache(
  async (today: string): Promise<ActiveDeal | null> => {
    const row = await db.query.deals.findFirst({
      where: and(lte(deals.startsAt, today), gte(deals.endsAt, today)),
      orderBy: [asc(deals.startsAt)],
      with: {
        property: {
          with: {
            images: {
              orderBy: IMAGE_ORDER,
            },
            project: true,
          },
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

export async function listProjects(): Promise<Project[]> {
  try {
    return await db.query.projects.findMany({
      orderBy: [asc(projects.name)],
    });
  } catch (err) {
    console.error("listProjects failed:", err);
    return [];
  }
}

export async function listPropertySlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  try {
    return await db
      .select({ slug: properties.slug, updatedAt: properties.updatedAt })
      .from(properties);
  } catch (err) {
    console.error("listPropertySlugs failed:", err);
    return [];
  }
}
