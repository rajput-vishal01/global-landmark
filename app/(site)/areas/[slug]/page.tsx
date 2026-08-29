import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ListingCard } from "@/components/ui/ListingCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
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
        <section className="relative flex min-h-[55vh] flex-col justify-end overflow-hidden bg-dark-deep">
          {area.coverImage && (
            <Image
              src={area.coverImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-80"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
          />
          <div className="relative px-5 pb-16 pt-40 md:px-12 md:pb-20">
            <div className="mb-4">
              <Breadcrumbs items={breadcrumbItems} tone="dark" />
            </div>
            <span aria-hidden className="mb-8 block h-px w-16 bg-gold" />
            <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.25em] text-cream/70">
              {cityContext(area.name, area.city) ?? "Area"}
            </p>
            <h1 className="mt-4 max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
              {area.name}
            </h1>
            {area.blurb && (
              <p className="mt-6 max-w-2xl text-pretty text-body font-sans text-cream/80">
                {area.blurb}
              </p>
            )}
          </div>
        </section>

        <section className="px-5 py-20 md:px-12 md:py-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5 md:mb-12">
            <h2 className="font-serif text-h3 text-ink">
              Available in {area.name}
            </h2>
            <span className="text-meta font-sans text-ink-muted">
              {properties.length} propert{properties.length === 1 ? "y" : "ies"}
            </span>
          </div>

          {properties.length === 0 ? (
            <div className="max-w-xl">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              <p className="font-serif text-h4 text-ink">
                Nothing listed in {area.name} right now.
              </p>
              <p className="mt-4 text-pretty text-body font-sans text-ink-muted">
                Stock here moves quickly and a good deal often never reaches the
                site. Tell us what you are looking for and we will call when it
                comes up.
              </p>
              <div className="mt-8">
                <Button href="/contact" variant="outline">
                  Register your requirement
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
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
