import { unstable_cache } from "next/cache";
import type { ProjectPrefill } from "@/lib/admin/project-prefill";
import { and, asc, desc, eq, like, lte, gte, or, sql, inArray, count } from "drizzle-orm";
import { db } from "./index";
import { deals, projects, properties, propertyImages, propertyMedia, testimonialVideos } from "./schema";
import type { Deal, TestimonialVideo } from "./schema";
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
import { typesInCollection, type CollectionValue } from "@/lib/attributes";
import { PUBLIC_STATUSES } from "@/lib/taxonomy/status";
import { isCity, normaliseLocality } from "@/lib/locations";
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
 * Public AND listed. A deal-only listing (`hideFromListings`) is public —
 * its own page opens from the Deal of the Week strip — but it must not turn
 * up in anything that LISTS properties: the grid, the home strip, search,
 * the city and type filters, location covers, a project's unit table, the
 * sitemap. Only the two single-row lookups (the detail page and the deal
 * itself) use publicVisibility() alone.
 *
 * This used to be an extra condition added by hand in two places, and every
 * other list — the home page's "Our Listings" among them — showed the
 * listings the office had asked to keep off the market.
 */
const listedVisibility = () =>
  and(publicVisibility(), eq(properties.hideFromListings, false));

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
  // MySQL has no NULLS LAST. It sorts NULLs first ascending and last
  // descending, so "unknown at the bottom either way" has to be expressed as
  // a leading key: 1 for a withheld price, 0 for a real one. Same resulting
  // order the Postgres version produced.
  const nullsLast = sql`case when ${publicPrice} is null then 1 else 0 end`;
  switch (sort) {
    case "price-asc":
      return [asc(nullsLast), sql`${publicPrice} asc`, desc(properties.createdAt)];
    case "price-desc":
      return [asc(nullsLast), sql`${publicPrice} desc`, desc(properties.createdAt)];
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
 *
 * lib/db/content.ts deliberately keeps a separate no-retry `safe()`; see
 * the reasoning there.
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
    like(properties.title, term),
    like(properties.location, term),
    like(properties.locality, term),
    like(properties.propertyType, term),
    like(properties.configuration, term),
    sql`${properties.projectId} in (select p.id from projects p where p.name like ${term})`
  );
}

function buildPropertyConditions(filters: PropertyFilters) {
  // A locality is only meaningful under its own city — the same rule the
  // admin form enforces, so a stray `?locality=` from a stale link can't
  // silently narrow to nothing.
  //
  // normaliseLocality, not isLocalityIn: brokers add their own localities now,
  // and a link to one of those must narrow the grid like a built-in does.
  const locality = filters.city ? normaliseLocality(filters.city, filters.locality) : null;

  return [
    listedVisibility(),
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
 * The landing page's location grid: one tile per micro-market the client
 * sells in, each with a real listing photo. (It carried a live count until
 * the client had it taken off the tiles, Sep 2026.)
 *
 * Unlike listCityCounts below, the tile list is FIXED — a market with
 * nothing published yet still gets its tile (and its "0 listings"), because
 * the grid is telling a visitor where we operate, not only where we happen
 * to have stock this week. A locality tile (Aerocity) narrows on both city
 * and locality, which is the same pair the /properties filters accept.
 */
export type LocationCard = {
  city: string;
  locality?: string;
  label: string;
  coverUrl: string | null;
};

const listLocationCardsCached = unstable_cache(
  async (
    targets: { city: string; locality?: string }[]
  ): Promise<LocationCard[]> =>
    Promise.all(
      targets.map(async ({ city, locality }) => {
        const cover = await db
          .select({ url: propertyImages.url })
          .from(propertyImages)
          .innerJoin(properties, eq(propertyImages.propertyId, properties.id))
          .where(
            and(
              listedVisibility(),
              eq(properties.city, city),
              locality ? eq(properties.locality, locality) : undefined
            )
          )
          .orderBy(...IMAGE_ORDER)
          .limit(1);

        return { city, locality, label: locality ?? city, coverUrl: cover[0]?.url ?? null };
      })
    ),
  ["listLocationCards"],
  CACHE_OPTS
);

export const listLocationCards = failSoft(
  listLocationCardsCached,
  "listLocationCards",
  []
);

/** Live per-city counts for the city tab row (R-08) — cities with zero public listings are simply absent. */
const listCityCountsCached = unstable_cache(
  async (): Promise<{ city: string; count: number }[]> => {
    const rows = await db
      .select({ city: properties.city, count: count() })
      .from(properties)
      .where(and(listedVisibility(), sql`${properties.city} is not null`))
      .groupBy(properties.city);
    // Only cities still on the list: a row saved under a city the client
    // has since dropped must not bring that city back as a filter option.
    return rows
      .filter((r): r is { city: string; count: number } => r.city !== null && isCity(r.city))
      .sort((a, b) => b.count - a.count);
  },
  ["listCityCounts"],
  CACHE_OPTS
);

export const listCityCounts = failSoft(listCityCountsCached, "listCityCounts", []);

/**
 * Distinct property types on public listings, custom ones included, so a
 * type the broker typed in becomes a filter option like any built-in.
 */
const listPropertyTypesInUseCached = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db
      .selectDistinct({ type: properties.propertyType })
      .from(properties)
      .where(and(listedVisibility(), sql`${properties.propertyType} is not null`));
    return rows.flatMap((r) => (r.type ? [r.type] : []));
  },
  ["listPropertyTypesInUse"],
  CACHE_OPTS
);

export const listPropertyTypesInUse = failSoft(
  listPropertyTypesInUseCached,
  "listPropertyTypesInUse",
  []
);

/**
 * City + locality pairs already stored, so a locality the broker typed on one
 * listing is offered back on the next one in that city.
 */
export async function listAllPlaces(): Promise<{ city: string; locality: string }[]> {
  try {
    const rows = await db
      .selectDistinct({ city: properties.city, locality: properties.locality })
      .from(properties)
      .where(sql`${properties.city} is not null and ${properties.locality} is not null`);
    return rows.flatMap((r) => (r.city && r.locality ? [{ city: r.city, locality: r.locality }] : []));
  } catch (err) {
    console.error("listAllPlaces failed:", err);
    return [];
  }
}

/** The same list for the admin, where drafts and sold rows count too. */
export async function listAllPropertyTypes(): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ type: properties.propertyType })
      .from(properties)
      .where(sql`${properties.propertyType} is not null`);
    return rows.flatMap((r) => (r.type ? [r.type] : []));
  } catch (err) {
    console.error("listAllPropertyTypes failed:", err);
    return [];
  }
}

const getFeaturedPropertiesCached = unstable_cache(
  async (limit = 6): Promise<PublicPropertyWithMedia[]> =>
    db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      where: listedVisibility(),
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
  where: listedVisibility(),
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
      where: and(eq(properties.projectId, project.id), sql`${properties.towerId} is null`, listedVisibility()),
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
        like(properties.title, term),
        like(properties.location, term),
        like(properties.description, term),
        like(properties.configuration, term),
        like(properties.propertyType, term),
        // Raw identifiers: interpolating drizzle columns here would inherit
        // the outer query's "properties" alias and break the subquery.
        sql`${properties.projectId} in (select p.id from projects p where p.name like ${term})`
      );
    });

    return await db.query.properties.findMany({
      columns: PUBLIC_PROPERTY_COLUMNS,
      extras: PUBLIC_PRICE_EXTRA,
      // This feeds /api/search, a public JSON endpoint — the visibility gate
      // matters more here than anywhere else.
      where: and(listedVisibility(), ...tokenConditions),
      with: { images: coverImageJoin, project: PUBLIC_PROJECT_JOIN },
      // Relevance: whole-phrase title hits first, then location hits,
      // then newest.
      // No ::int cast — MySQL comparisons already yield 1/0, and `::` is
      // Postgres-only syntax that fails to parse here.
      orderBy: [
        desc(sql`(${properties.title} like ${full})`),
        desc(sql`(${properties.location} like ${full})`),
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
      where: like(projects.name, term),
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
      where: and(
        lte(deals.startsAt, today),
        gte(deals.endsAt, today),
        // The visibility gate. A relation join cannot carry a WHERE, so it
        // lives here as a subquery: a deal on a draft, sold or archived
        // listing is skipped and the next live window (if any) shows
        // instead. Without it, a deal scheduled on an owner's unreviewed
        // submission put that submission on the homepage.
        inArray(
          deals.propertyId,
          db.select({ id: properties.id }).from(properties).where(publicVisibility())
        )
      ),
      orderBy: [asc(deals.startsAt)],
      with: {
        // Deal of the Week renders on the homepage, so the deal's property
        // needs the same allowlist and the same visibility gate as any
        // other public read — a sold property must not resurface here.
        property: {
          columns: PUBLIC_PROPERTY_COLUMNS,
          extras: PUBLIC_PRICE_EXTRA,
          // The strip shows the cover and nothing else; the gallery lives
          // on the detail page this links to.
          with: { images: coverImageJoin, project: PUBLIC_PROJECT_JOIN },
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

/** Projects for the property form’s picker, with what a unit inherits. */
export async function listProjectsForAdmin(): Promise<ProjectPrefill[]> {
  try {
    return await db
      .select({
        id: projects.id,
        name: projects.name,
        address: projects.address,
        mapsUrl: projects.mapsUrl,
        amenities: projects.amenities,
        legalFlags: projects.legalFlags,
        loanFlags: projects.loanFlags,
        banksOnPanel: projects.banksOnPanel,
        reraNumber: projects.reraNumber,
      })
      .from(projects)
      .orderBy(asc(projects.name));
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
      .where(listedVisibility());
  } catch (err) {
    console.error("listPropertySlugs failed:", err);
    return [];
  }
}

