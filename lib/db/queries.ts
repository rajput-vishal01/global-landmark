import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, ilike, lte, gte, or, sql, inArray, count } from "drizzle-orm";
import { db } from "./index";
import { builders, deals, projects, properties, propertyImages, propertyMedia, testimonialVideos } from "./schema";
import type { AdminProperty, Deal, TestimonialVideo } from "./schema";
import {
  PUBLIC_BUILDER_COLUMNS,
  PUBLIC_IMAGE_COLUMNS,
  PUBLIC_MEDIA_COLUMNS,
  PUBLIC_PROJECT_COLUMNS,
  PUBLIC_PROPERTY_COLUMNS,
  PUBLIC_TOWER_COLUMNS,
  type PublicBuilder,
  type PublicImage,
  type PublicMedium,
  type PublicProject,
  type PublicProperty,
  type PublicPropertyWithMedia,
  type PublicTower,
} from "./public-columns";
import type { CategoryValue } from "@/lib/categories";
import { COLLECTIONS, typesInCollection, type CollectionValue } from "@/lib/attributes";
import { PUBLIC_STATUSES } from "@/lib/taxonomy/status";
import { isLocalityIn } from "@/lib/locations";
import { DEFAULT_SORT, type PropertySort } from "@/lib/properties-url";

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
const publicPrice = sql<number | null>`case when ${properties.showPricePublicly} then ${properties.demandPrice} else null end`;

const PUBLIC_PRICE_EXTRA = { publicPrice: publicPrice.as("public_price") } as const;

/**
 * Sort order for /properties (Phase D). Price sorts run on the *public*
 * price expression, not `demandPrice` — sorting by a figure the visitor is
 * not allowed to see would let the ordering of the grid reveal it.
 *
 * NULLS LAST on both directions is deliberate: "Price on request" is an
 * unknown, not a cheap one, so it belongs at the bottom either way. The
 * createdAt tiebreak keeps paging stable when prices collide.
 */
function propertyOrder(sort: PropertySort = DEFAULT_SORT) {
  switch (sort) {
    case "price-asc":
      return [sql`${publicPrice} asc nulls last`, desc(properties.createdAt)];
    case "price-desc":
      return [sql`${publicPrice} desc nulls last`, desc(properties.createdAt)];
    default:
      return [desc(properties.createdAt)];
  }
}

/** The public shape of a joined project, allowlisted at the join. */
const PUBLIC_PROJECT_JOIN = { columns: PUBLIC_PROJECT_COLUMNS } as const;

/** Cards render the cover image only; the detail page asks for the gallery. */
const coverImageJoin = { columns: PUBLIC_IMAGE_COLUMNS, orderBy: IMAGE_ORDER, limit: 1 } as const;
const galleryJoin = { columns: PUBLIC_IMAGE_COLUMNS, orderBy: IMAGE_ORDER } as const;

type PropertyFilters = {
  category?: CategoryValue;
  collection?: CollectionValue;
  propertyType?: string;
  configuration?: string;
  possessionStatus?: string;
  furnishing?: string;
  city?: string;
  locality?: string;
  sector?: string;
  /** Free-text search across the public-facing text columns — see `keywordCondition`. */
  q?: string;
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

/**
 * A collection is derived, not stored (R-04) — "projects" means `kind =
 * 'project'`, every other collection means `propertyType IN (...)` over
 * `typesInCollection()`'s list. Returns `undefined` (no-op filter) for an
 * empty list so a collection with zero mapped types doesn't `IN ()`, which
 * some drivers reject outright.
 */
function collectionCondition(collection: CollectionValue) {
  if (collection === "projects") return eq(properties.kind, "project");
  const types = typesInCollection(collection);
  // `kind` wins in collectionOf() (a whole society is Projects whatever its
  // unit type) — the filter must agree, or a project-kind row could match
  // both `?group=projects` and `?group=flats` while its own card only ever
  // shows one badge.
  const typeMatch = types.length ? inArray(properties.propertyType, types) : undefined;
  return typeMatch ? and(eq(properties.kind, "unit"), typeMatch) : undefined;
}

/** Shared by listProperties and countProperties so the two can never disagree about what matches. */
/**
 * Free-text search for the listing grid.
 *
 * Only the columns a visitor can already see are searched — title,
 * location, locality, project name, type, configuration. Description is
 * deliberately excluded: it is long, it makes every stray word a match, and
 * the results stop feeling related to what was typed. Nothing internal is
 * searchable, so a keyword can never be used to probe for a hidden field.
 *
 * `%`/`_`/`\` are escaped so a literal "100%" searches for 100%, not for
 * everything. Drizzle parameterises the value, so this is about matching
 * what the visitor typed, not about injection.
 *
 * ponytail: ILIKE '%…%' sequential-scans. At this portfolio size it is
 * milliseconds; R-75 is the upgrade trigger (trigram index or tsvector).
 */
function keywordCondition(raw: string) {
  const term = `%${raw.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  return or(
    ilike(properties.title, term),
    ilike(properties.location, term),
    ilike(properties.locality, term),
    ilike(properties.propertyType, term),
    ilike(properties.configuration, term),
    sql`${properties.projectId} in (select p.id from projects p where p.name ilike ${term})`
  );
}

function buildPropertyConditions(filters: PropertyFilters) {
  // A locality is only meaningful under its own city — the same rule the
  // admin form enforces, so a stray `?locality=` from a stale link can't
  // silently narrow to nothing.
  const locality =
    filters.city && filters.locality && isLocalityIn(filters.city, filters.locality)
      ? filters.locality
      : undefined;

  return [
    publicVisibility(),
    filters.category ? eq(properties.category, filters.category) : undefined,
    filters.collection ? collectionCondition(filters.collection) : undefined,
    filters.propertyType ? eq(properties.propertyType, filters.propertyType) : undefined,
    filters.configuration ? eq(properties.configuration, filters.configuration) : undefined,
    filters.possessionStatus
      ? eq(properties.possessionStatus, filters.possessionStatus)
      : undefined,
    filters.furnishing ? eq(properties.furnishing, filters.furnishing) : undefined,
    filters.city ? eq(properties.city, filters.city) : undefined,
    locality ? eq(properties.locality, locality) : undefined,
    filters.sector ? eq(properties.sector, filters.sector) : undefined,
    filters.q?.trim() ? keywordCondition(filters.q.trim()) : undefined,
  ].filter((c): c is NonNullable<typeof c> => Boolean(c));
}

/** R-75: fixed page size for the public listing grid. */
export const PROPERTIES_PAGE_SIZE = 24;

const listPropertiesCached = unstable_cache(
  // `page` omitted (undefined) means "no pagination" — existing internal
  // callers (similar-properties ranking, the homepage strip) rely on getting
  // every match back, not just the first page's worth.
  async (
    filters: PropertyFilters = {},
    page?: number,
    sort?: PropertySort
  ): Promise<PublicPropertyWithMedia[]> => {
    const conditions = buildPropertyConditions(filters);
    // Cards only render the cover image — fetching whole galleries here
    // would bloat every cached list entry.
    return db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      where: and(...conditions),
      with: { images: coverImageJoin, project: PUBLIC_PROJECT_JOIN },
      orderBy: propertyOrder(sort),
      ...(page != null
        ? { limit: PROPERTIES_PAGE_SIZE, offset: (Math.max(1, page) - 1) * PROPERTIES_PAGE_SIZE }
        : {}),
    });
  },
  ["listProperties"],
  CACHE_OPTS
);

export const listProperties = failSoft(listPropertiesCached, "listProperties", []);

/** Total matching rows across every page — drives the pagination control and the "N residences" copy. */
const countPropertiesCached = unstable_cache(
  async (filters: PropertyFilters = {}): Promise<number> => {
    const conditions = buildPropertyConditions(filters);
    const [{ n }] = await db
      .select({ n: count() })
      .from(properties)
      .where(and(...conditions));
    return n;
  },
  ["countProperties"],
  CACHE_OPTS
);

export const countProperties = failSoft(countPropertiesCached, "countProperties", 0);

/**
 * Live per-collection counts for the six-card grid (R-04). One query per
 * collection rather than a single grouped query: "projects" filters on
 * `kind`, every other collection filters on `propertyType IN (...)` — two
 * different WHERE shapes a single `GROUP BY` can't express cleanly, and six
 * collections is cheap enough that the extra round trips don't matter.
 */
/**
 * Counts and a representative cover per collection tile.
 *
 * The cover comes back from an inner join rather than a correlated
 * subquery on purpose: this file has been bitten before by interpolating
 * `${properties.id}` inside a `sql` subquery while the same column is
 * selected at the top level, which Drizzle renders unqualified so it
 * resolves against the subquery's own `id` and silently returns null. A
 * join has no such ambiguity.
 *
 * A collection with no public listings simply has no cover, and the tile
 * falls back to its solid ground — which is the honest rendering, since
 * there is nothing behind it to show.
 */
const listCollectionCountsCached = unstable_cache(
  async (): Promise<
    { value: CollectionValue; count: number; coverUrl: string | null }[]
  > => {
    const rows = await Promise.all(
      COLLECTIONS.map(async ({ value }) => {
        const condition = collectionCondition(value);
        const where = condition
          ? and(publicVisibility(), condition)
          : publicVisibility();

        const [[{ n }], cover] = await Promise.all([
          db.select({ n: count() }).from(properties).where(where),
          db
            .select({ url: propertyImages.url })
            .from(propertyImages)
            .innerJoin(properties, eq(propertyImages.propertyId, properties.id))
            .where(where)
            .orderBy(...IMAGE_ORDER)
            .limit(1),
        ]);

        return { value, count: n, coverUrl: cover[0]?.url ?? null };
      })
    );
    return rows;
  },
  ["listCollectionCounts"],
  CACHE_OPTS
);

export const listCollectionCounts = failSoft(
  listCollectionCountsCached,
  "listCollectionCounts",
  []
);

/** Live per-city counts for the city tab row (R-08) — cities with zero public listings are simply absent. */
const listCityCountsCached = unstable_cache(
  async (): Promise<{ city: string; count: number }[]> => {
    const rows = await db
      .select({ city: properties.city, count: count() })
      .from(properties)
      .where(and(publicVisibility(), sql`${properties.city} is not null`))
      .groupBy(properties.city);
    return rows
      .filter((r): r is { city: string; count: number } => r.city !== null)
      .sort((a, b) => b.count - a.count);
  },
  ["listCityCounts"],
  CACHE_OPTS
);

export const listCityCounts = failSoft(listCityCountsCached, "listCityCounts", []);

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

/** The detail page's shape — the only public read that also carries link media (R-28). */
export type PublicPropertyDetail = PublicPropertyWithMedia & { media: PublicMedium[] };

const getPropertyBySlugCached = unstable_cache(
  async (slug: string): Promise<PublicPropertyDetail | null> => {
    const row = await db.query.properties.findFirst({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      // A direct-link visit to a sold or draft listing must 404, not render.
      where: and(eq(properties.slug, slug), publicVisibility()),
      with: {
        // Full gallery — the detail page renders every image.
        images: galleryJoin,
        project: PUBLIC_PROJECT_JOIN,
        // Video / drone / virtual-tour / map / brochure links (R-28).
        media: { columns: PUBLIC_MEDIA_COLUMNS, orderBy: [asc(propertyMedia.sortOrder)] },
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

/** A tower's public units, sorted the way a buyer reads a floor plate: top-down, then unit. */
const towerUnitsJoin = {
  columns: PUBLIC_PROPERTY_COLUMNS,
  extras: PUBLIC_PRICE_EXTRA,
  where: publicVisibility(),
  with: { images: coverImageJoin },
  orderBy: [desc(properties.floorNumber), asc(properties.unitNumber)],
};

/** A unit within its own project's page — `project` is the page itself, so it isn't repeated per row. */
type PublicUnit = PublicProperty & { images: PublicImage[] };

export type PublicProjectDetail = PublicProject & {
  builder: PublicBuilder | null;
  towers: (PublicTower & { units: PublicUnit[] })[];
  /** Units belonging to the project directly, with no tower (R-12). */
  units: PublicUnit[];
};

/**
 * `/projects/[slug]` (R-27): builder line, RERA, dates, project amenities,
 * and every available unit grouped by tower — the public half of the same
 * pitch view the admin gets, minus everything internal.
 */
const getProjectBySlugCached = unstable_cache(
  async (slug: string): Promise<PublicProjectDetail | null> => {
    const project = await db.query.projects.findFirst({
      columns: PUBLIC_PROJECT_COLUMNS,
      where: eq(projects.slug, slug),
      with: {
        builder: { columns: PUBLIC_BUILDER_COLUMNS },
        towers: {
          columns: PUBLIC_TOWER_COLUMNS,
          with: { units: towerUnitsJoin },
        },
      },
    });
    if (!project) return null;

    // Units on this project with no tower — a standalone plot sold under
    // the same society banner, for instance (R-12).
    const units = await db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      where: and(eq(properties.projectId, project.id), sql`${properties.towerId} is null`, publicVisibility()),
      with: { images: coverImageJoin },
    });

    return { ...project, units };
  },
  ["getProjectBySlug"],
  CACHE_OPTS
);

export const getProjectBySlug = failSoft(getProjectBySlugCached, "getProjectBySlug", null);

/**
 * Sitemap source. Every project gets its own page regardless of whether it
 * currently has any live units — unlike a property, "no units yet" is not
 * a reason to hide a society's page from search.
 */
export async function listProjectSlugs(): Promise<{ slug: string }[]> {
  try {
    return await db.select({ slug: projects.slug }).from(projects);
  } catch (err) {
    console.error("listProjectSlugs failed:", err);
    return [];
  }
}

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

/** Matches project names for the search dropdown (R-27) — same ILIKE shape as searchProperties. */
export async function searchProjects(q: string, limit = 4): Promise<PublicProject[]> {
  const term = `%${q.trim()}%`;
  try {
    return await db.query.projects.findMany({
      columns: PUBLIC_PROJECT_COLUMNS,
      where: ilike(projects.name, term),
      orderBy: [asc(projects.name)],
      limit,
    });
  } catch (err) {
    console.error("searchProjects failed:", err);
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
/**
 * ADMIN ONLY — the property list at /admin/properties.
 *
 * Deliberately NOT gated on publication state or listing status. The public
 * queries hide drafts and sold listings, which is right for the site and
 * exactly wrong for the admin: a broker saving a draft must still be able to
 * find it. This is the one property read that intentionally sees everything,
 * which is why it lives here under an explicit name rather than being a flag
 * on listProperties().
 *
 * Returns the full row — the admin is the only surface allowed to.
 */
export async function listPropertiesForAdmin(): Promise<
  (AdminProperty & { images: { id: number; url: string }[]; project: { name: string } | null })[]
> {
  try {
    return await db.query.properties.findMany({
      with: {
        images: { columns: { id: true, url: true }, orderBy: IMAGE_ORDER },
        project: { columns: { name: true } },
      },
      orderBy: [desc(properties.updatedAt)],
    });
  } catch (err) {
    console.error("listPropertiesForAdmin failed:", err);
    return [];
  }
}

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

/** Builder profile page's shape (R-47) — public builder facts plus their public projects. */
export type PublicBuilderDetail = PublicBuilder & { projects: PublicProject[] };

/**
 * `/builders/[slug]` (R-47): a developer's public profile plus every
 * project they're linked to, allowlisted the same way `/projects/[slug]`
 * allowlists its builder join.
 */
const getBuilderBySlugCached = unstable_cache(
  async (slug: string): Promise<PublicBuilderDetail | null> => {
    const builder = await db.query.builders.findFirst({
      columns: PUBLIC_BUILDER_COLUMNS,
      where: eq(builders.slug, slug),
      with: {
        projects: { columns: PUBLIC_PROJECT_COLUMNS, orderBy: [asc(projects.name)] },
      },
    });
    return builder ?? null;
  },
  ["getBuilderBySlug"],
  CACHE_OPTS
);

export const getBuilderBySlug = failSoft(getBuilderBySlugCached, "getBuilderBySlug", null);

/** Sitemap source — every builder gets a page regardless of current project count. */
export async function listBuilderSlugs(): Promise<{ slug: string }[]> {
  try {
    return await db.select({ slug: builders.slug }).from(builders);
  } catch (err) {
    console.error("listBuilderSlugs failed:", err);
    return [];
  }
}
