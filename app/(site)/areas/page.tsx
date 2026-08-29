import type { Metadata } from "next";
import { connection } from "next/server";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { AreaCard } from "@/components/sections/AreaGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
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
        <section className="bg-dark-deep px-5 pb-12 pt-36 md:px-12 md:pb-14 md:pt-44">
          <div className="mb-6">
            <Breadcrumbs items={BREADCRUMBS} tone="dark" />
          </div>
          <span aria-hidden className="mb-8 block h-px w-16 bg-gold" />
          <h1 className="max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
            Explore by Location
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-body font-sans text-cream/75">
            {PAGE_DESCRIPTION}
          </p>
        </section>

        <section className="px-5 py-20 md:px-12 md:py-28">
          {areas.length === 0 ? (
            <div className="max-w-xl">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              <p className="font-serif text-h3 text-ink">No areas published yet.</p>
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
