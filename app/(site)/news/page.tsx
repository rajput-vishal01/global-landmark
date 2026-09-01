import type { Metadata } from "next";
import { connection } from "next/server";
import { NewsGrid } from "@/components/NewsGrid";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { PageHeader, SectionHeading, SECTION } from "../_components/page-chrome";
import { fetchRealEstateNews } from "@/lib/news";
import { NEWS_PAGE } from "@/lib/data";
import { canonical } from "@/lib/seo";

const PAGE_TITLE = "Market News";
const PAGE_DESCRIPTION =
  "Property and real-estate coverage from across the Tricity — Chandigarh, Panchkula, Mohali and Zirakpur.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/news" },
  openGraph: {
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
      <main>
        <PageHeader
          breadcrumbs={BREADCRUMBS}
          eyebrow="Market briefing"
          title={NEWS_PAGE.title}
          sub={NEWS_PAGE.sub}
        />

        <section className={SECTION}>
          <SectionHeading
            eyebrow="Tricity property desk"
            title="Latest coverage"
            aside={
              articles.length > 0
                ? `${articles.length} stor${articles.length === 1 ? "y" : "ies"}`
                : undefined
            }
          />

          {articles.length === 0 ? (
            <div className="max-w-xl">
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
