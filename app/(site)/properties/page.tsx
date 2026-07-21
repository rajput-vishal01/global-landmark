import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ListingCard } from "@/components/ui/ListingCard";
import { PropertiesFilters } from "@/components/PropertiesFilters";
import { listProperties } from "@/lib/db/queries";
import { CATEGORIES, isCategory, type CategoryValue } from "@/lib/categories";
import {
  FURNISHINGS,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/attributes";
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

const FILTERS: { value: CategoryValue | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

const pick = (value: string | undefined, allowed: readonly string[]) =>
  value && allowed.includes(value) ? value : undefined;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    type?: string;
    possession?: string;
    furnishing?: string;
  }>;
}) {
  const params = await searchParams;
  const category =
    params.category && isCategory(params.category) ? params.category : undefined;
  const propertyType = pick(params.type, PROPERTY_TYPES);
  const possessionStatus = pick(params.possession, POSSESSION_STATUSES);
  const furnishing = pick(params.furnishing, FURNISHINGS);
  const properties = await listProperties({
    category,
    propertyType,
    possessionStatus,
    furnishing,
  });

  return (
    <>
      <Header />
      <main>
        <section className="bg-dark-deep px-5 pb-12 pt-36 md:px-12 md:pb-14 md:pt-44">
          <span data-reveal className="mb-8 block h-px w-16 bg-gold" />
          <h1 data-reveal className="max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
            {PROPERTIES_PAGE.title}
          </h1>
          <p data-reveal className="mt-6 max-w-xl text-pretty text-body font-sans text-cream/75">
            {properties.length === 0
              ? `${PROPERTIES_PAGE.emptySub} ${PROPERTIES_PAGE.subSuffix}`
              : `${properties.length} residence${properties.length === 1 ? "" : "s"} represented. ${PROPERTIES_PAGE.subSuffix}`}
          </p>
        </section>

        <section className="px-5 py-20 md:px-12 md:py-28">
          <nav
            aria-label="Filter by category"
            data-reveal
            className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-border pb-5"
          >
            {/* h2, not a span — the page would otherwise jump h1 → h3 (cards) */}
            <h2 className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
              Portfolio
            </h2>
            {FILTERS.map((filter) => {
              const isActive =
                filter.value === "all" ? !category : category === filter.value;
              const chipParams = new URLSearchParams();
              if (propertyType) chipParams.set("type", propertyType);
              if (possessionStatus) chipParams.set("possession", possessionStatus);
              if (furnishing) chipParams.set("furnishing", furnishing);
              if (filter.value !== "all") chipParams.set("category", filter.value);
              return (
                <Link
                  key={filter.value}
                  href={`/properties${chipParams.size ? `?${chipParams}` : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`text-eyebrow relative pb-1 font-sans font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
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

          <div data-reveal className="mb-14">
            <PropertiesFilters
              propertyType={propertyType ?? ""}
              possession={possessionStatus ?? ""}
              furnishing={furnishing ?? ""}
            />
          </div>

          {properties.length === 0 ? (
            <p className="text-body font-sans text-ink-muted">{PROPERTIES_PAGE.emptyBody}</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div key={property.id} data-reveal>
                  <ListingCard property={property} />
                </div>
              ))}
            </div>
          )}
        </section>

        <CTABand />
      </main>
      <Footer />
    </>
  );
}
