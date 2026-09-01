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
import { PageHeader, SectionHeading, SECTION } from "../_components/page-chrome";
import {
  listProperties,
  countProperties,
  listCityCounts,
  listLocationCards,
  PROPERTIES_PAGE_SIZE,
} from "@/lib/db/queries";
import type { PublicPropertyWithMedia } from "@/lib/db/public-columns";
import { isCategory } from "@/lib/categories";
import {
  FURNISHINGS,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  CONFIGURATIONS,
  isCollection,
} from "@/lib/attributes";
import { isCity } from "@/lib/locations";
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
import { COMPANY, PROPERTIES_PAGE } from "@/lib/data";
import { canonical } from "@/lib/seo";

const PAGE_TITLE = "Exclusive Listings";
const PAGE_DESCRIPTION = `The current portfolio of landmark residences represented by ${COMPANY.legalName}.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/properties" },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical("/properties"),
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

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
          ? "flex flex-col gap-10"
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
  searchParams: Promise<{
    category?: string;
    group?: string;
    type?: string;
    possession?: string;
    furnishing?: string;
    city?: string;
    locality?: string;
    sector?: string;
    configuration?: string;
    q?: string;
    sort?: string;
    view?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const category =
    params.category && isCategory(params.category) ? params.category : undefined;
  const group = params.group && isCollection(params.group) ? params.group : undefined;
  const propertyType = pick(params.type, PROPERTY_TYPES);
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

  const [properties, totalCount, cityCounts, locationCards] = await Promise.all([
    listProperties(activeFilters, page, sort),
    countProperties(activeFilters),
    listCityCounts(),
    listLocationCards(LANDING_LOCATIONS),
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

  return (
    <>
      <Header />
      <main>
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

        <section id="listings" className={SECTION}>
          <SectionHeading
            eyebrow="The portfolio"
            title="All listings"
            aside={
              totalCount > 0
                ? `Showing ${firstOnPage}-${lastOnPage} of ${totalCount}`
                : undefined
            }
          />

          <FilterBar current={current} cityCounts={cityCounts} />

          <ListingsToolbar sort={sort} view={view} current={current} rule={false} />

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
