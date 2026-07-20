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

export type PropertyFilters = {
  category?: CategoryValue;
  propertyType?: string;
  possessionStatus?: string;
  furnishing?: string;
};

async function listPropertiesUncached(
  filters: PropertyFilters = {}
): Promise<PropertyWithImages[]> {
  const conditions = [
    filters.category ? eq(properties.category, filters.category) : undefined,
    filters.propertyType ? eq(properties.propertyType, filters.propertyType) : undefined,
    filters.possessionStatus
      ? eq(properties.possessionStatus, filters.possessionStatus)
      : undefined,
    filters.furnishing ? eq(properties.furnishing, filters.furnishing) : undefined,
  ].filter((c): c is NonNullable<typeof c> => Boolean(c));

  try {
    return await db.query.properties.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        images: { orderBy: [asc(propertyImages.sortOrder), asc(propertyImages.id)] },
        project: true,
      },
      orderBy: [desc(properties.createdAt)],
    });
  } catch (err) {
    console.error("listProperties failed:", err);
    return [];
  }
}

export const listProperties = unstable_cache(
  listPropertiesUncached,
  ["listProperties"],
  CACHE_OPTS
);

async function getFeaturedPropertiesUncached(
  limit = 6
): Promise<PropertyWithImages[]> {
  try {
    return await db.query.properties.findMany({
      with: {
        images: { orderBy: [asc(propertyImages.sortOrder), asc(propertyImages.id)] },
        project: true,
      },
      orderBy: [desc(properties.createdAt)],
      limit,
    });
  } catch (err) {
    console.error("getFeaturedProperties failed:", err);
    return [];
  }
}

export const getFeaturedProperties = unstable_cache(
  getFeaturedPropertiesUncached,
  ["getFeaturedProperties"],
  CACHE_OPTS
);

async function getPropertyBySlugUncached(
  slug: string
): Promise<PropertyWithImages | null> {
  try {
    const row = await db.query.properties.findFirst({
      where: eq(properties.slug, slug),
      with: {
        images: { orderBy: [asc(propertyImages.sortOrder), asc(propertyImages.id)] },
        project: true,
      },
    });
    return row ?? null;
  } catch (err) {
    console.error("getPropertyBySlug failed:", err);
    return null;
  }
}

export const getPropertyBySlug = unstable_cache(
  getPropertyBySlugUncached,
  ["getPropertyBySlug"],
  CACHE_OPTS
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
        images: { orderBy: [asc(propertyImages.sortOrder), asc(propertyImages.id)] },
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

async function getActiveDealForDate(today: string): Promise<ActiveDeal | null> {
  try {
    const row = await db.query.deals.findFirst({
      where: and(lte(deals.startsAt, today), gte(deals.endsAt, today)),
      orderBy: [asc(deals.startsAt)],
      with: {
        property: {
          with: {
            images: {
              orderBy: [asc(propertyImages.sortOrder), asc(propertyImages.id)],
            },
            project: true,
          },
        },
      },
    });
    return (row as ActiveDeal | undefined) ?? null;
  } catch (err) {
    console.error("getActiveDeal failed:", err);
    return null;
  }
}

const getActiveDealCached = unstable_cache(
  getActiveDealForDate,
  ["getActiveDeal"],
  CACHE_OPTS
);

/**
 * The deal whose window covers today (IST); earliest start wins on overlap.
 * The date is part of the cache key, so the result rolls over at midnight.
 */
export function getActiveDeal(): Promise<ActiveDeal | null> {
  return getActiveDealCached(todayIST());
}

async function listTestimonialVideosUncached(): Promise<TestimonialVideo[]> {
  try {
    return await db.query.testimonialVideos.findMany({
      orderBy: [asc(testimonialVideos.sortOrder), desc(testimonialVideos.createdAt)],
    });
  } catch (err) {
    console.error("listTestimonialVideos failed:", err);
    return [];
  }
}

export const listTestimonialVideos = unstable_cache(
  listTestimonialVideosUncached,
  ["listTestimonialVideos"],
  CACHE_OPTS
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
