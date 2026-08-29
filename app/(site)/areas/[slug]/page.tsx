import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ListingCard } from "@/components/ui/ListingCard";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionHeading, SECTION } from "../../_components/page-chrome";
import { getAreaPage } from "@/lib/db/areas";
import { COMPANY } from "@/lib/data";
import { breadcrumbJsonLd, canonical, jsonLdHtml } from "@/lib/seo";

/**
 * The city is only worth stating when the name does not already say it —
 * an area called "Panchkula" in the city Panchkula would otherwise render
 * as "Panchkula, Panchkula" in the title and twice over in the hero.
 */
function cityContext(name: string, city: string | null): string | null {
  if (!city) return null;
  return name.toLowerCase().includes(city.toLowerCase()) ? null : city;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getAreaPage(slug);
  if (!page) return { title: "Not found", robots: { index: false } };
  const { area } = page;
  const path = `/areas/${area.slug}`;
  // SERPs truncate around 60-65 chars; admin-entered names are unbounded.
  const city = cityContext(area.name, area.city);
  const title = `Property in ${area.name}${city ? `, ${city}` : ""}`.slice(0, 65);
  const description =
    area.blurb?.slice(0, 160) ||
    `${page.properties.length} listing${page.properties.length === 1 ? "" : "s"} in ${area.name}.`;
  const ogImages = area.coverImage ? [{ url: canonical(area.coverImage) }] : undefined;
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
    twitter: { card: "summary_large_image", title, description, images: ogImages },
  };
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Rendered per request; see the note in ../page.tsx — the counts and the
  // listing grid must reflect the last admin save, not an hour-old snapshot.
  await connection();
  const { slug } = await params;
  const page = await getAreaPage(slug);
  if (!page) notFound();
  const { area, properties } = page;

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Areas", path: "/areas" },
    { name: area.name, path: `/areas/${area.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd(breadcrumbItems)) }}
      />
      <Header />
      <main>
        <PageHeader
          breadcrumbs={breadcrumbItems}
          image={area.coverImage ? { src: area.coverImage } : null}
          eyebrow={cityContext(area.name, area.city) ?? "Area"}
          title={area.name}
          sub={area.blurb}
        />

        <section className={SECTION}>
          <SectionHeading
            eyebrow="Current stock"
            title={`Available in ${area.name}`}
            aside={`${properties.length} propert${properties.length === 1 ? "y" : "ies"}`}
          />

          {properties.length === 0 ? (
            <div className="max-w-xl">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              <p className="font-serif text-h4 text-heading">
                Nothing listed in {area.name} right now.
              </p>
              <p className="mt-4 text-pretty text-body font-sans text-ink-muted">
                Stock here moves quickly and a good deal often never reaches the
                site. Tell us what you are looking for and we will call when it
                comes up.
              </p>
              <div className="mt-8">
                <Button href="/contact" variant="primary">
                  Register your requirement
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
              {properties.map((property) => (
                <ListingCard key={property.id} property={property} />
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
