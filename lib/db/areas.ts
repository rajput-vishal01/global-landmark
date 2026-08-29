import { unstable_cache } from "next/cache";
import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "./index";
import { areas, properties } from "./schema";
import {
  PUBLIC_AREA_COLUMNS,
  PUBLIC_IMAGE_COLUMNS,
  PUBLIC_PROJECT_COLUMNS,
  PUBLIC_PROPERTY_COLUMNS,
  type PublicArea,
  type PublicPropertyWithMedia,
} from "./public-columns";
import { IMAGE_ORDER, SITE_DATA_TAG } from "./queries";
import { PUBLIC_STATUSES } from "@/lib/taxonomy/status";

/**
 * Areas — the "explore by location" read layer (R-46).
 *
 * Lives beside lib/db/queries.ts rather than inside it, and obeys the same
 * two rules: every query carries an explicit `columns:` allowlist, and every
 * query filters on the publication gate. Property counts are computed here
 * on every read and never stored — a cached count is a number that goes
 * stale silently and then lies on a public page.
 *
 * `publicVisibility()` and the price expression below are reconstructions of
 * their twins in queries.ts, not copies of a value: both read PUBLIC_STATUSES
 * and `showPricePublicly`, so the two files cannot end up disagreeing about
 * what "public" means without the shared source changing first.
 */

const CACHE_OPTS = { revalidate: 3600, tags: [SITE_DATA_TAG] };

const publicVisibility = () =>
  and(
    eq(properties.publicationState, "published"),
    inArray(properties.listingStatus, [...PUBLIC_STATUSES])
  );

/** Resolved in SQL so a withheld figure never reaches the RSC payload. */
const PUBLIC_PRICE_EXTRA = {
  publicPrice:
    sql<number | null>`case when ${properties.showPricePublicly} then ${properties.demandPrice} else null end`.as(
      "public_price"
    ),
} as const;

/**
 * The claim rule, correlated against the `areas` table — used by the counts
 * query, which resolves it per row inside one join.
 *
 * `lower(a) = lower(b)` rather than ILIKE: an admin-entered match value
 * containing `%` or `_` would act as a wildcard under ILIKE and quietly pull
 * in a neighbouring locality. A null match column yields NULL, not true, so
 * an area that sets neither value claims nothing — which is the safe answer,
 * the alternative being the entire catalogue filed under one name.
 */
const AREA_CLAIMS_PROPERTY = or(
  sql`lower(${properties.city}) = lower(${areas.matchCity})`,
  sql`lower(${properties.locality}) = lower(${areas.matchLocality})`
);

/** The same rule against known values, for one area's own listing query. */
function areaMatch(area: { matchCity: string | null; matchLocality: string | null }): SQL {
  const clauses = [
    area.matchCity ? sql`lower(${properties.city}) = lower(${area.matchCity})` : undefined,
    area.matchLocality
      ? sql`lower(${properties.locality}) = lower(${area.matchLocality})`
      : undefined,
  ].filter((c): c is SQL => Boolean(c));
  return or(...clauses) ?? sql`false`;
}

/** Fail soft: a database blip degrades one section, it does not 500 the page. */
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

export type AreaWithCount = PublicArea & { propertyCount: number };

/**
 * Published areas with their live counts. One grouped query rather than a
 * count per area: unlike the collection counts in queries.ts, every area
 * matches with the same WHERE shape, so a single join expresses it.
 */
const listPublishedAreasCached = unstable_cache(
  async (): Promise<AreaWithCount[]> =>
    db
      .select({
        id: areas.id,
        name: areas.name,
        slug: areas.slug,
        city: areas.city,
        coverImage: areas.coverImage,
        blurb: areas.blurb,
        sortOrder: areas.sortOrder,
        // Counting properties.id, not *, so an area with no listings counts
        // 0 instead of the 1 the left-joined null row would otherwise give.
        propertyCount: count(properties.id),
      })
      .from(areas)
      .leftJoin(properties, and(publicVisibility(), AREA_CLAIMS_PROPERTY))
      .where(eq(areas.isPublished, true))
      .groupBy(areas.id)
      .orderBy(asc(areas.sortOrder), asc(areas.name)),
  ["listPublishedAreas"],
  CACHE_OPTS
);

export const listPublishedAreas = failSoft(
  listPublishedAreasCached,
  "listPublishedAreas",
  []
);

/**
 * The admin list — every area, published or not, carrying the same live
 * count the public grid shows. Uncached on purpose: an admin who just saved
 * must see the row they saved, and the tag that busts the public caches says
 * nothing about how fresh this list needs to be.
 */
export async function listAllAreasWithCounts() {
  try {
    return await db
      .select({
        id: areas.id,
        name: areas.name,
        slug: areas.slug,
        city: areas.city,
        matchCity: areas.matchCity,
        matchLocality: areas.matchLocality,
        sortOrder: areas.sortOrder,
        isPublished: areas.isPublished,
        propertyCount: count(properties.id),
      })
      .from(areas)
      .leftJoin(properties, and(publicVisibility(), AREA_CLAIMS_PROPERTY))
      .groupBy(areas.id)
      .orderBy(asc(areas.sortOrder), asc(areas.name));
  } catch (err) {
    console.error("listAllAreasWithCounts failed:", err);
    return [];
  }
}

export type AreaPage = { area: PublicArea; properties: PublicPropertyWithMedia[] };

/**
 * One landing page's worth of data. Area and listings are fetched together
 * because the match values are needed to find the listings and must not
 * leave the server — returning the area's public projection alongside its
 * properties keeps them out of the payload without a second round trip.
 */
const getAreaPageCached = unstable_cache(
  async (slug: string): Promise<AreaPage | null> => {
    const area = await db.query.areas.findFirst({
      columns: { ...PUBLIC_AREA_COLUMNS, matchCity: true, matchLocality: true },
      // A direct link to an unpublished area must 404, not render.
      where: and(eq(areas.slug, slug), eq(areas.isPublished, true)),
    });
    if (!area) return null;

    const { matchCity, matchLocality, ...publicArea } = area;
    const rows = await db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      where: and(publicVisibility(), areaMatch({ matchCity, matchLocality })),
      with: {
        images: { columns: PUBLIC_IMAGE_COLUMNS, orderBy: IMAGE_ORDER, limit: 1 },
        project: { columns: PUBLIC_PROJECT_COLUMNS },
      },
      orderBy: [desc(properties.createdAt)],
    });
    return { area: publicArea, properties: rows };
  },
  ["getAreaPage"],
  CACHE_OPTS
);

export const getAreaPage = failSoft(getAreaPageCached, "getAreaPage", null);
