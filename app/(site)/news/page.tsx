import type { Metadata } from "next";
import { connection } from "next/server";
import { NewsGrid } from "@/components/NewsGrid";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { PageHeader, SectionHeading, SECTION } from "../_components/page-chrome";
import { fetchRealEstateNews } from "@/lib/news";
import { NEWS_PAGE } from "@/lib/data";
import { canonical, OG_DEFAULTS } from "@/lib/seo";

const PAGE_TITLE = "Chandigarh Tricity Real Estate News";
const PAGE_DESCRIPTION =
  "Real estate and property news from Chandigarh, Mohali, Panchkula and Zirakpur, drawn from regional news outlets for buyers, sellers and investors.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/news" },
  openGraph: {
    ...OG_DEFAULTS,
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical("/news"),
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "News", path: "/news" },
];

export default async function NewsPage() {
  // Render per request (build has no API key to prerender against); the
  // newsdata fetch inside is cached for 12h — connection() keeps that fetch
  // cache working, unlike force-dynamic which would disable it.
  await connection();
  const articles = await fetchRealEstateNews();

  return (
    <>
      <Header />
      <main className="bg-surface">
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Market briefing"
          title={NEWS_PAGE.title}
          sub={NEWS_PAGE.sub}
        />

        <section className={`mx-auto max-w-7xl ${SECTION}`}>
          <SectionHeading
            eyebrow="Tricity property desk"
            title="Latest coverage"
          />

          {articles.length === 0 ? (
            <div className="max-w-xl border border-border border-t-2 border-t-gold bg-white p-8 md:p-10">
              <span aria-hidden className="mb-6 block h-px w-12 bg-gold" />
              <p className="font-serif text-h4 text-heading">{NEWS_PAGE.emptyTitle}</p>
              <p className="mt-4 text-pretty text-body font-sans text-ink-muted">
                {NEWS_PAGE.emptyBody}
              </p>
            </div>
          ) : (
            <NewsGrid articles={articles} />
          )}
        </section>

        <CTABand />
      </main>
      <Footer />
    </>
  );
}
