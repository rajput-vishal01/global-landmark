import type { Metadata } from "next";
import { connection } from "next/server";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { AreaCard } from "@/components/sections/AreaCard";
import { PageHeader, SectionHeading, SECTION } from "../_components/page-chrome";
import { listPublishedAreas } from "@/lib/db/areas";
import { breadcrumbJsonLd, canonical, jsonLdHtml } from "@/lib/seo";

const PAGE_TITLE = "Areas";
const PAGE_DESCRIPTION =
  "Browse property by location — every area we cover, with what is available in each right now.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/areas" },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical("/areas"),
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Areas", path: "/areas" },
];

export default async function AreasPage() {
  // Rendered per request. The query inside is cached and busted on every
  // admin save, so this is fresh without an ISR window that would keep a
  // just-published area invisible for the next hour.
  await connection();
  const areas = await listPublishedAreas();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd(BREADCRUMBS)) }}
      />
      <Header />
      <main>
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Where we work"
          title="Explore by Location"
          sub={PAGE_DESCRIPTION}
        />

        <section className={SECTION}>
          <SectionHeading
            eyebrow="Locality guides"
            title="Areas we cover"
            aside={
              areas.length > 0
                ? `${areas.length} area${areas.length === 1 ? "" : "s"}`
                : undefined
            }
          />

          {areas.length === 0 ? (
            <div className="max-w-xl">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              <p className="font-serif text-h4 text-heading">No areas published yet.</p>
              <p className="mt-4 text-pretty text-body font-sans text-ink-muted">
                Locality guides are on their way. In the meantime, every listing
                is on the properties page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
              {areas.map((area) => (
                <AreaCard key={area.id} area={area} />
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
