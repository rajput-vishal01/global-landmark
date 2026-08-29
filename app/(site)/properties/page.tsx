import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ListingCard } from "@/components/ui/ListingCard";
import { Button } from "@/components/ui/Button";
import { PropertiesFilters } from "@/components/PropertiesFilters";
import { CollectionGrid } from "@/components/CollectionGrid";
import { CityTabs } from "@/components/CityTabs";
import { ConfigTabs } from "@/components/ConfigTabs";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { Pagination } from "@/components/Pagination";
import { ListingsToolbar } from "@/components/ListingsToolbar";
import {
  PageHeader,
  SectionHeading,
  SECTION,
  SECTION_BAND,
} from "../_components/page-chrome";
import {
  listProperties,
  countProperties,
  listCollectionCounts,
  listCityCounts,
  PROPERTIES_PAGE_SIZE,
} from "@/lib/db/queries";
import { CATEGORIES, isCategory, type CategoryValue } from "@/lib/categories";
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
  propertiesHref,
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

const FILTERS: { value: CategoryValue | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

/** The label that opens each row of the filter panel. */
const FILTER_LABEL =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted";

/** One row inside the filter panel — hairline-separated, evenly padded. */
const FILTER_ROW = "border-b border-border px-5 py-5 last:border-b-0 md:px-6";

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

  const [properties, totalCount, collectionCounts, cityCounts] = await Promise.all([
    listProperties(activeFilters, page, sort),
    countProperties(activeFilters),
    listCollectionCounts(),
    listCityCounts(),
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

        <section className={SECTION_BAND}>
          <SectionHeading
            eyebrow="Start here"
            title="Browse by collection"
            aside={
              <Link href="#listings" className="font-sans transition-colors hover:text-ink">
                Skip to all listings
              </Link>
            }
          />
          <CollectionGrid counts={collectionCounts} current={current} />
        </section>

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

          {/* One bordered panel instead of four loose bands. The controls
              themselves were already right; stacked down the page with a
              full-width rule under each, they read as four separate features
              rather than one place to narrow the list. */}
          <div className="mb-10 border border-border bg-cream">
            <nav
              aria-label="Filter by category"
              className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${FILTER_ROW}`}
            >
              <span className={FILTER_LABEL}>Category</span>
              {FILTERS.map((filter) => {
                const isActive =
                  filter.value === "all" ? !category : category === filter.value;
                return (
                  <Link
                    key={filter.value}
                    href={propertiesHref(
                      current,
                      {
                        category: filter.value === "all" ? undefined : filter.value,
                        page: undefined,
                      },
                      "listings"
                    )}
                    aria-current={isActive ? "page" : undefined}
                    className={`text-eyebrow relative pb-1 font-sans font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
                      isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {filter.label}
                    <span
                      aria-hidden
                      className={`absolute bottom-0 left-0 h-px w-full origin-left bg-gold transition-transform duration-500 ease-out ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className={FILTER_ROW}>
              <CityTabs
                cities={cityCounts}
                city={city ?? ""}
                locality={locality ?? ""}
                sector={sector ?? ""}
              />
            </div>

            <div className={FILTER_ROW}>
              <ConfigTabs configuration={configuration} current={current} />
            </div>

            <div className={FILTER_ROW}>
              <PropertiesFilters
                propertyType={propertyType ?? ""}
                possession={possessionStatus ?? ""}
                furnishing={furnishing ?? ""}
              />
            </div>
          </div>

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
