import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ListingCard } from "@/components/ui/ListingCard";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/FilterBar";
import { LocationGrid } from "@/components/LocationGrid";
import { LANDING_LOCATIONS } from "@/lib/locations";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { Pagination } from "@/components/Pagination";
import { ListingsToolbar } from "@/components/ListingsToolbar";
import { PageHeader, SectionHeading } from "../_components/page-chrome";
import {
  listProperties,
  countProperties,
  listCityCounts,
  listLocationCards,
  listPropertyTypesInUse,
  PROPERTIES_PAGE_SIZE,
} from "@/lib/db/queries";
import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";
import { isCategory } from "@/lib/categories";
import {
  FURNISHINGS,
  POSSESSION_STATUSES,
  CONFIGURATIONS,
  isCollection,
} from "@/lib/attributes";
import { isCity } from "@/lib/locations";
import { normalisePropertyType } from "@/lib/taxonomy/property";
import { firstValues } from "@/lib/search-params";
import {
  DEFAULT_SORT,
  DEFAULT_VIEW,
  isPropertySort,
  isPropertyView,
  type PropertyView,
  sortParam,
  viewParam,
  type PropertiesFilterParams,
} from "@/lib/properties-url";
import { PROPERTIES_PAGE } from "@/lib/data";
import { breadcrumbJsonLd, canonical, jsonLdHtml, OG_DEFAULTS } from "@/lib/seo";

const PAGE_TITLE =
  "Property Dealers in Panchkula | Global Landmark | 9882084786";

const PAGE_DESCRIPTION =
  "Global Landmark is among the trusted Property Dealers in Panchkula, offering premium property options and expert assistance for buyers and investors.";
/**
 * Canonical policy: the plain grid is its own canonical, page by page
 * (`?page=2` has listings page 1 does not). Any filter, search, sort or view
 * points at /properties — they are for visitors, not pages meant to rank.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { page, ...rest } = await searchParams;
  const n = Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1);
  const path = n > 1 && Object.keys(rest).length === 0 ? `/properties?page=${n}` : "/properties";
  // The full title has no room for a page number inside 60 characters.
  const title = n > 1 ? `Tricity Property Listings, Page ${n}` : PAGE_TITLE;
  return {
    title,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: path },
    openGraph: {
      ...OG_DEFAULTS,
      type: "website",
      title,
      description: PAGE_DESCRIPTION,
      url: canonical(path),
    },
    twitter: { card: "summary_large_image", title, description: PAGE_DESCRIPTION },
  };
}

// Filter-driven (reads searchParams), so this route renders per request.
export const dynamic = "force-dynamic";

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Properties", path: "/properties" },
];

/** Listings shown before the location bento interrupts the grid — two rows of three. */
const MID_BREAK = 6;

/** The listing grid itself, rendered either side of that break. */
function ListingsGrid({
  properties,
  view,
}: {
  properties: PublicPropertyWithMedia[];
  view: PropertyView;
}) {
  return (
    <div
      className={
        view === "list"
          ? "flex flex-col gap-6"
          : "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {properties.map((property) => (
        <div key={property.id}>
          <ListingCard property={property} variant={view} />
        </div>
      ))}
    </div>
  );
}

const pick = (value: string | undefined, allowed: readonly string[]) =>
  value && allowed.includes(value) ? value : undefined;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = firstValues(await searchParams);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const category =
    params.category && isCategory(params.category) ? params.category : undefined;
  const group = params.group && isCollection(params.group) ? params.group : undefined;
  // Not `pick` against the built-in list: a type the broker typed in is a
  // real type, so the URL has to carry it. normalisePropertyType is the same
  // validation the admin write path uses.
  const propertyType = normalisePropertyType(params.type) ?? undefined;
  const possessionStatus = pick(params.possession, POSSESSION_STATUSES);
  const furnishing = pick(params.furnishing, FURNISHINGS);
  const configuration = pick(params.configuration, CONFIGURATIONS);
  const city = params.city && isCity(params.city) ? params.city : undefined;
  const locality = params.locality?.trim() || undefined;
  const sector = params.sector?.trim() || undefined;
  // Trimmed and length-capped: this reaches an ILIKE, and an unbounded
  // string from a URL is not something to hand the database verbatim.
  const q = params.q?.trim().slice(0, 100) || undefined;
  // Presentation, not filtering — these two never reach buildPropertyConditions.
  const sort = params.sort && isPropertySort(params.sort) ? params.sort : DEFAULT_SORT;
  const view = params.view && isPropertyView(params.view) ? params.view : DEFAULT_VIEW;

  const activeFilters = {
    category,
    collection: group,
    propertyType,
    configuration,
    possessionStatus,
    furnishing,
    city,
    locality,
    sector,
    q,
  };

  const [properties, totalCount, cityCounts, locationCards, typesInUse] = await Promise.all([
    listProperties(activeFilters, page, sort),
    countProperties(activeFilters),
    listCityCounts(),
    listLocationCards(LANDING_LOCATIONS),
    listPropertyTypesInUse(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PROPERTIES_PAGE_SIZE));
  // The "Showing 25-48 of 112" orientation line every portal carries above
  // its grid. Derived from what the query already returned rather than a
  // second count.
  const firstOnPage = (page - 1) * PROPERTIES_PAGE_SIZE + 1;
  const lastOnPage = firstOnPage + properties.length - 1;

  // Every server-rendered filter link (category chips, collection cards,
  // configuration tabs) merges its own override onto this — so clicking one
  // filter never drops the others (R-04/R-08/R-09's "all of it must
  // compose" requirement, taken literally).
  const current: PropertiesFilterParams = {
    category,
    group,
    type: propertyType,
    possession: possessionStatus,
    furnishing,
    city,
    locality,
    sector,
    configuration,
    q,
    sort: sortParam(sort),
    view: viewParam(view),
  };

  // The listings on this page of the grid, numbered across pages.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: totalCount,
    itemListElement: properties.map((property, i) => ({
      "@type": "ListItem",
      position: firstOnPage + i,
      url: canonical(`/properties/${property.slug}`),
      name: property.title,
    })),
  };

  return (
    <>
      {properties.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(itemListLd) }} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd(BREADCRUMBS)) }}
      />
      <Header />
      <main className="bg-surface">
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Portfolio"
          title={PROPERTIES_PAGE.title}
          sub={
            totalCount === 0
              ? `${PROPERTIES_PAGE.emptySub} ${PROPERTIES_PAGE.subSuffix}`
              : `${totalCount} residence${totalCount === 1 ? "" : "s"} represented. ${PROPERTIES_PAGE.subSuffix}`
          }
        />

        {/* The search console lifts over the header's bottom edge, so the
            first thing under the title is the way to narrow the portfolio. */}
        <div className="relative z-10 -mt-10 px-5 md:-mt-14 md:px-12">
          <FilterBar current={current} cityCounts={cityCounts} types={typesInUse} />
        </div>

        <section id="listings" className="scroll-mt-24 px-5 pb-16 pt-10 md:px-12 md:pb-24 md:pt-12">
          <ListingsToolbar
            sort={sort}
            view={view}
            current={current}
            summary={
              totalCount > 0
                ? `Showing ${firstOnPage}–${lastOnPage} of ${totalCount} listing${totalCount === 1 ? "" : "s"}`
                : "No listings match these filters"
            }
          />

          {properties.length === 0 ? (
            <div className="max-w-xl">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              <p className="text-body font-sans text-ink-muted">
                {PROPERTIES_PAGE.emptyBody}
              </p>
              <div className="mt-8">
                <Button href="/contact" variant="primary">
                  Tell us what you need
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ListingsGrid properties={properties.slice(0, MID_BREAK)} view={view} />

              {/* The location bento, dropped into the middle of the results
                  rather than above them: a visitor who has scrolled one row
                  deep and not found it is looking to jump markets, and this
                  is where that decision happens. It only earns the break
                  when there are listings on both sides of it — otherwise it
                  is a divider under a short grid. */}
              {properties.length > MID_BREAK && (
                <>
                  <div className="my-16 border-y border-border py-12 md:my-20">
                    <SectionHeading
                      eyebrow="Not finding it here?"
                      title="Browse by location"
                    />
                    <LocationGrid cards={locationCards} />
                  </div>

                  <ListingsGrid properties={properties.slice(MID_BREAK)} view={view} />
                </>
              )}
            </>
          )}

          <Pagination page={page} totalPages={totalPages} current={current} />
        </section>

        {/* R-45. Read-only here (no `record`) — an index page is not a view
            of any one listing. Renders nothing until the visitor has some. */}
        <RecentlyViewed />

        <CTABand />
      </main>
      <Footer />
    </>
  );
}
