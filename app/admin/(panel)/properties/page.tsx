import Link from "next/link";
import { and, asc, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, properties } from "@/lib/db/schema";
import { PropertiesTable } from "@/components/admin/PropertiesTable";
import {
  PropertyFilters,
  type PropertyFilterValues,
} from "@/components/admin/PropertyFilters";
import { PUBLICATION_STATES } from "@/lib/taxonomy/status";
import { normalisePropertyType } from "@/lib/taxonomy/property";
import { listAllPropertyTypes } from "@/lib/db/queries";
import { CITY_NAMES } from "@/lib/locations";
import {
  EmptyState,
  PageHead,
  deskButton,
  deskButtonPrimary,} from "@/components/admin/desk";
import { bulkDeleteProperties, deleteProperty, duplicateProperty } from "./actions";

export const metadata = { title: "Properties" };

const PAGE_SIZE = 25;

/**
 * The four sorts, their labels and their SQL in one place — the filter bar
 * renders the labels off this record, so a new sort cannot be offered in the
 * UI without an order clause behind it.
 *
 * "Longest on market" is `listedAt` ascending rather than a computed
 * `daysOnMarket`: the two are the same ordering, and sorting on the stored
 * column keeps it index-eligible.
 */
const SORTS = {
  updated: { label: "Recently updated", order: desc(properties.updatedAt) },
  newest: { label: "Newest first", order: desc(properties.createdAt) },
  oldest: { label: "Oldest first", order: asc(properties.createdAt) },
  dom: { label: "Longest on market", order: asc(properties.listedAt) },
} as const;

type SortKey = keyof typeof SORTS;

const SORT_OPTIONS = Object.entries(SORTS).map(([value, s]) => ({
  value,
  label: s.label,
}));

const isSortKey = (v: string): v is SortKey => v in SORTS;

/** Unknown values are dropped rather than rejected — a stale link still works. */
const pick = (value: string | undefined, allowed: readonly string[]) =>
  value && allowed.includes(value) ? value : "";

/**
 * `%`, `_` and `\` are LIKE metacharacters. Drizzle parameterises the value,
 * so this is about matching what the broker typed, not injection: searching
 * for the literal "100%" must not match everything.
 */
const likeEscape = (q: string) => q.replace(/[\\%_]/g, (m) => `\\${m}`);

type AdminRow = {
  id: number;
  refCode: string | null;
  title: string;
  city: string | null;
  locality: string | null;
  listingStatus: string;
  publicationState: string;
  addedBy: string;
  listedAt: Date;
  updatedAt: Date;
  projectName: string | null;
  coverUrl: string | null;
};

/**
 * The admin list query. Local to this page on purpose: it is the only caller,
 * it is uncached and unfiltered by publication state (a draft must be visible
 * to the broker who just saved it), and keeping it here means R-34 reverts as
 * one commit if the client re-tags it.
 *
 * ponytail: search is `ILIKE '%…%'`, which sequential-scans. The existing
 * indexes cover the publication/city/type filters but nothing covers the text
 * search, and at a few thousand listings it is still milliseconds. R-75
 * (Phase 9) is the upgrade trigger: B-tree/trigram indexes on the searched
 * columns, or a generated tsvector.
 */
async function listPage(
  values: PropertyFilterValues,
  page: number
): Promise<{ rows: AdminRow[]; total: number }> {
  const conditions: SQL[] = [];

  if (values.q) {
    const pattern = `%${likeEscape(values.q)}%`;
    // Non-null because every operand is a defined column comparison.
    conditions.push(
      or(
        like(properties.refCode, pattern),
        like(properties.title, pattern),
        like(properties.locality, pattern),
        like(projects.name, pattern)
      )!
    );
  }
  if (values.publication)
    conditions.push(eq(properties.publicationState, values.publication));
  if (values.type) conditions.push(eq(properties.propertyType, values.type));
  if (values.city) conditions.push(eq(properties.city, values.city));

  const where = conditions.length ? and(...conditions) : undefined;

  // Cover image as a correlated subquery rather than a join: the join would
  // multiply rows before LIMIT and break the page size. Same ordering the
  // public queries use for the cover (sortOrder, then id).
  //
  // The correlation is written as literal `property_images.property_id =
  // properties.id`, NOT `${propertyImages.propertyId} = ${properties.id}`:
  // once `properties.id` is also selected at the top level of this query,
  // Drizzle renders that second reference unqualified ("id"), which inside
  // this subquery resolves against property_images' OWN "id" column instead
  // of the outer properties row — always false, so every row silently got a
  // null cover and the admin list showed no thumbnails at all. Spelling the
  // table names out in the raw SQL sidesteps the ambiguity entirely.
  const coverUrl = sql<string | null>`(
    select url from property_images
    where property_images.property_id = properties.id
    order by property_images.sort_order asc, property_images.id asc
    limit 1
  )`.as("cover_url");

  try {
    const [rows, [totals]] = await Promise.all([
      db
        .select({
          id: properties.id,
          refCode: properties.refCode,
          title: properties.title,
          city: properties.city,
          locality: properties.locality,
          listingStatus: properties.listingStatus,
          publicationState: properties.publicationState,
          addedBy: properties.addedBy,
          listedAt: properties.listedAt,
          updatedAt: properties.updatedAt,
          projectName: projects.name,
          coverUrl,
        })
        .from(properties)
        .leftJoin(projects, eq(properties.projectId, projects.id))
        .where(where)
        .orderBy(SORTS[values.sort as SortKey].order, desc(properties.id))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db
        .select({ n: count() })
        .from(properties)
        .leftJoin(projects, eq(properties.projectId, projects.id))
        .where(where),
    ]);
    return { rows, total: totals?.n ?? 0 };
  } catch (err) {
    // Same fail-soft contract as lib/db/queries.ts: the panel renders and
    // says "nothing here" rather than throwing a 500 at the broker.
    console.error("admin property list failed:", err);
    return { rows: [], total: 0 };
  }
}

/** Preserves the whole filter state across a page step. */
function pageHref(values: PropertyFilterValues, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  return `/admin/properties${params.size ? `?${params}` : ""}`;
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    publication?: string;
    type?: string;
    city?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const values: PropertyFilterValues = {
    q: (params.q ?? "").trim().slice(0, 100),
    publication: pick(params.publication, PUBLICATION_STATES),
    // A typed-in custom type is a real type; same validation as the write path.
    type: normalisePropertyType(params.type) ?? "",
    city: pick(params.city, CITY_NAMES),
    sort: params.sort && isSortKey(params.sort) ? params.sort : "updated",
  };

  // "Filtered" excludes sort: sorting an unfiltered list is not a filter, and
  // offering "clear filters" on it would be a no-op button.
  const isFiltered = Boolean(
    values.q || values.publication || values.type || values.city
  );

  const requestedPage = Math.max(1, Number(params.page) || 1);
  const [{ rows, total }, types] = await Promise.all([
    listPage(values, requestedPage),
    listAllPropertyTypes(),
  ]);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, lastPage);
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title="Properties"
        sub="Every listing the brokerage holds, drafts included — filter it down, then open one to edit it."
        actions={
          <Link href="/admin/properties/new" className={deskButtonPrimary}>
            Add property
          </Link>
        }
      />

      <PropertyFilters
        values={values}
        sortOptions={SORT_OPTIONS}
        isFiltered={isFiltered}
        types={types}
      />

      {/* What came back. Reading "1–25 of 60 matching" under the filters you
          just set is what tells you they did something. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="ml-auto text-[12px] tabular-nums text-muted">
          {firstRow}–{Math.min(page * PAGE_SIZE, total)} of {total}
          {isFiltered ? " matching" : ""} propert{total === 1 ? "y" : "ies"}
        </span>
      </div>

      {rows.length === 0 ? (
        // Two different dead ends need two different exits: an empty portfolio
        // wants the add button, a filtered miss wants the filters cleared.
        isFiltered ? (
          <EmptyState
            title="Nothing matches that"
            note="No listing in the portfolio fits every filter you have set. Loosen one — type and city together are usually the pair that empties it."
            action={
              <Link href="/admin/properties" className={deskButton}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No properties yet"
            note="Add the first listing and it appears on the public site as soon as it is published — until then it stays a draft only you can see."
            action={
              <Link href="/admin/properties/new" className={deskButton}>
                Add the first property
              </Link>
            }
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <PropertiesTable
            rows={rows}
            duplicateAction={duplicateProperty}
            deleteAction={deleteProperty}
            bulkDeleteAction={bulkDeleteProperties}
          />

          {lastPage > 1 && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <PageLink
                href={pageHref(values, page - 1)}
                disabled={page <= 1}
                label="Previous"
              />
              <span className="text-[12px] tabular-nums text-muted">
                Page {page} of {lastPage}
              </span>
              <PageLink
                href={pageHref(values, page + 1)}
                disabled={page >= lastPage}
                label="Next"
              />
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

/** A step that would leave the result set renders as a dead twin of the
 *  button, not a dead link — so the row keeps its shape at page 1. */
function PageLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span aria-disabled className={`${deskButton} pointer-events-none opacity-40`}>
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className={deskButton}>
      {label}
    </Link>
  );
}
