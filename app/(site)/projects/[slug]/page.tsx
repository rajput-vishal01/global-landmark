import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ContactForm } from "@/components/ContactForm";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { getProjectBySlug, type PublicProjectDetail } from "@/lib/db/queries";
import { PageHeader, SECTION, SECTION_BAND } from "../../_components/page-chrome";
import { AMENITY_GROUPS, formatArea, formatIndianShort } from "@/lib/attributes";
import { COMPANY, PROJECT_DETAIL } from "@/lib/data";
import { breadcrumbJsonLd, canonical, jsonLdHtml } from "@/lib/seo";

// ISR: cached and served instantly; admin edits bust the cache on save.
export const revalidate = 3600;

type Tower = PublicProjectDetail["towers"][number];
type ProjectUnit = PublicProjectDetail["units"][number];

function projectLocation(project: PublicProjectDetail): string {
  return [project.locality, project.sector, project.city].filter(Boolean).join(", ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Not found", robots: { index: false } };
  const path = `/projects/${project.slug}`;
  const location = projectLocation(project);
  // SERPs truncate around 60-65 chars; admin-entered names are unbounded.
  const title = `${project.name}${location ? ` — ${location}` : ""}`.slice(0, 65);
  const description =
    project.description?.slice(0, 160) ||
    `Residential project${location ? ` in ${location}` : ""}.`;
  // Absolute: uploaded images are same-origin paths, and a social crawler
  // has no origin to resolve them against.
  const ogImages = project.coverImage ? [{ url: canonical(project.coverImage) }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: COMPANY.legalName,
      title,
      description,
      url: canonical(path),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const location = projectLocation(project);
  const amenities = project.amenities ?? [];
  const amenityGroups = AMENITY_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.filter((item) => amenities.includes(item)),
  })).filter((g) => g.items.length > 0);

  const towerUnitCount = project.towers.reduce((sum, t) => sum + t.units.length, 0);
  const totalAvailable = towerUnitCount + project.units.length;

  // Units carry a cover image only (cards, not full galleries) — the project
  // itself has no dedicated gallery field, so the mosaic of unit cover shots
  // is the honest source for "gallery" rather than fabricating one.
  const galleryImages = [
    ...project.towers.flatMap((t) => t.units.flatMap((u) => u.images)),
    ...project.units.flatMap((u) => u.images),
  ];

  const mapsQuery = [project.name, location, project.country].filter(Boolean).join(", ");
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  const facts = (
    [
      ["Builder", project.builder?.name],
      ["RERA Number", project.reraNumber],
      ["Possession Status", project.possessionStatus],
      ["Launch Date", project.launchDate],
      ["Possession Date", project.possessionDate],
      ["Towers", project.totalTowers?.toString()],
      ["Total Units", project.totalUnits?.toString()],
      ["Floors", project.numberOfFloors?.toString()],
      [
        "Green Area",
        project.greenAreaValue != null
          ? formatArea(project.greenAreaValue, project.greenAreaUnit ?? "sqft")
          : null,
      ],
    ] as [string, string | null | undefined][]
  ).filter((row): row is [string, string] => Boolean(row[1]));

  // ApartmentComplex — the schema.org type built for a multi-unit society,
  // with the RERA number carried as an identifier the way Indian property
  // listings expect it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: project.name,
    ...(project.description ? { description: project.description } : {}),
    url: canonical(`/projects/${project.slug}`),
    ...(project.coverImage ? { image: [canonical(project.coverImage)] } : {}),
    ...(project.totalUnits != null ? { numberOfAccommodationUnits: project.totalUnits } : {}),
    ...(project.reraNumber
      ? { identifier: { "@type": "PropertyValue", propertyID: "RERA", value: project.reraNumber } }
      : {}),
    address: {
      "@type": "PostalAddress",
      ...(location ? { addressLocality: location } : {}),
      addressCountry: project.country === "India" ? "IN" : project.country || "IN",
    },
    provider: {
      "@type": "RealEstateAgent",
      name: COMPANY.legalName,
      url: canonical("/"),
    },
  };

  // Home > Properties > [project name] — /properties is the only crawlable
  // listing surface that leads here today (no standalone /projects index).
  // Shared between the JSON-LD below and the visible <Breadcrumbs> in the hero.
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
    { name: project.name, path: `/projects/${project.slug}` },
  ];
  const breadcrumbLd = breadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbLd) }}
      />
      <Header />
      <main>
        <PageHeader
          breadcrumbs={breadcrumbItems}
          image={project.coverImage ? { src: project.coverImage, alt: project.name } : null}
          eyebrow={`Project${project.builder ? ` · ${project.builder.name}` : ""}`}
          title={project.name}
          sub={location || undefined}
        />

        {/* Spec sheet beside content — same metadata-sidebar pattern as the property page */}
        <section className={`grid grid-cols-1 gap-14 md:grid-cols-[1.7fr_1fr] md:gap-20 ${SECTION}`}>
          <div className="flex flex-col gap-16">
            {project.description && (
              <div>
                <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Overview
                </span>
                <div className="mt-6 flex max-w-2xl flex-col gap-5">
                  {project.description
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((paragraph, i) => (
                      <p key={i} className="text-pretty text-body font-sans leading-relaxed text-ink">
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
            )}

            {project.builder?.about && (
              <div>
                <span className="mb-4 block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Developed By
                </span>
                <h2 className="font-serif text-h4 text-heading">{project.builder.name}</h2>
                {project.builder.belongsTo && (
                  <p className="mt-1 text-meta font-sans text-ink-muted">
                    {project.builder.belongsTo}
                  </p>
                )}
                <p className="mt-4 max-w-2xl text-pretty text-body font-sans text-ink">
                  {project.builder.about}
                </p>
              </div>
            )}

            {amenityGroups.length > 0 && (
              <div>
                <span className="mb-6 block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Amenities
                </span>
                <div className="flex max-w-2xl flex-col gap-5">
                  {amenityGroups.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-eyebrow font-sans font-medium uppercase tracking-[0.14em] text-gold-deep">
                        {group.label}
                      </p>
                      <ul className="flex flex-wrap gap-2.5">
                        {group.items.map((item) => (
                          <li
                            key={item}
                            className="border border-border bg-white px-3.5 py-2 font-sans text-meta text-ink"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tower / unit availability (R-12) */}
            <div>
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                <span className="block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Availability
                </span>
                {totalAvailable > 0 && (
                  <span className="text-meta font-sans text-ink-muted">
                    {totalAvailable} unit{totalAvailable === 1 ? "" : "s"} available
                  </span>
                )}
              </div>

              {project.towers.length === 0 && project.units.length === 0 ? (
                <p className="text-pretty text-body font-sans text-ink-muted">
                  {PROJECT_DETAIL.emptyUnitsNote}
                </p>
              ) : (
                <div className="flex flex-col gap-10">
                  {project.towers.map((tower) => (
                    <TowerBlock key={tower.id} tower={tower} />
                  ))}
                  {project.units.length > 0 && (
                    <div>
                      <div className="mb-4 border-b border-border pb-3">
                        <h3 className="font-serif text-h4 text-heading">Additional Units</h3>
                        <p className="text-meta font-sans text-ink-muted">
                          Not assigned to a tower
                        </p>
                      </div>
                      <UnitTable units={project.units} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {galleryImages.length > 0 && (
              <div>
                <span className="mb-6 block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Gallery
                </span>
                <GalleryLightbox images={galleryImages} title={project.name} />
              </div>
            )}

            {location && (
              <div>
                <span className="mb-4 block text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                  Location
                </span>
                <p className="max-w-xl text-pretty text-body font-sans text-ink">
                  {location}
                </p>
                <a
                 
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
                >
                  View on Google Maps ↗
                </a>
              </div>
            )}
          </div>

          <aside className="md:sticky md:top-28 md:self-start">
            <div className="border border-border bg-white p-8 md:p-10">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              {facts.length > 0 && (
                <dl className="flex flex-col">
                  {facts.map(([label, value], i) => (
                    <div
                      key={label}
                      className={`flex items-baseline justify-between gap-6 py-3.5 ${
                        i > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <dt className="text-eyebrow font-sans font-medium uppercase tracking-[0.15em] text-ink-muted">
                        {label}
                      </dt>
                      <dd className="break-words text-right font-sans text-meta text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-7 flex flex-col gap-3">
                <a
                  href="#inquire"
                  className="text-eyebrow inline-flex justify-center bg-cta px-7 py-4 text-center font-sans font-semibold uppercase tracking-[0.2em] text-cta-ink transition-colors duration-200 hover:bg-cta-hover"
                >
                  Request Details
                </a>
              </div>
            </div>
          </aside>
        </section>

        {/* Inquiry */}
        <section id="inquire" className={SECTION_BAND}>
          <div className="grid grid-cols-1 gap-14 md:grid-cols-[1fr_1.4fr] md:gap-24">
            <div className="md:sticky md:top-32 md:self-start">
              <p className="text-eyebrow mb-3 font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
                Enquire
              </p>
              <h2 className="max-w-sm text-balance font-serif text-h3 text-heading">
                {PROJECT_DETAIL.inquiryHeading}
              </h2>
              <p className="mt-5 max-w-sm text-pretty text-body font-sans text-ink-muted">
                Reference {project.name}. {PROJECT_DETAIL.inquirySub}
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        <CTABand />
      </main>
      <Footer />
    </>
  );
}

function TowerBlock({ tower }: { tower: Tower }) {
  const towerFacts = [
    tower.totalFloors && `${tower.totalFloors} floors`,
    tower.unitsPerFloor && `${tower.unitsPerFloor} units/floor`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <h3 className="font-serif text-h4 text-heading">{tower.name}</h3>
        <p className="text-meta font-sans text-ink-muted">
          {towerFacts}
          {tower.units.length > 0 ? `${towerFacts ? " · " : ""}${tower.units.length} available` : ""}
        </p>
      </div>
      {tower.units.length > 0 ? (
        <UnitTable units={tower.units} />
      ) : (
        <p className="text-meta font-sans text-ink-muted">No units currently listed in this tower.</p>
      )}
    </div>
  );
}

/** Config · area · floor · price/on-request — the R-12 inventory shape, no internal status column. */
function UnitTable({ units }: { units: ProjectUnit[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-border">
            {["Unit", "Configuration", "Area", "Floor", "Price"].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2.5 text-eyebrow font-sans font-medium uppercase tracking-[0.14em] text-ink-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-b-0">
              <td className="whitespace-nowrap px-3 py-3 font-sans text-meta text-ink">
                <Link
                  href={`/properties/${u.slug}`}
                  className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {u.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-sans text-meta text-ink-muted">
                {u.configuration || "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-sans text-meta tabular-nums text-ink-muted">
                {u.areaValue != null ? formatArea(u.areaValue, u.areaUnit) : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-sans text-meta tabular-nums text-ink-muted">
                {u.floorNumber ?? "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-sans text-meta tabular-nums text-ink">
                {u.publicPrice != null ? formatIndianShort(u.publicPrice) : "On request"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
