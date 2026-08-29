import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { PageHeader, SectionHeading, SECTION } from "../_components/page-chrome";
import { fetchRealEstateNews } from "@/lib/news";
import { NEWS_PAGE } from "@/lib/data";
import { canonical } from "@/lib/seo";

const PAGE_TITLE = "Market News";
const PAGE_DESCRIPTION =
  "Curated real-estate market coverage — the stories shaping property, development, and investment.";

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

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

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
            eyebrow="Updated daily"
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
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const published = formatDate(article.publishedAt);
                return (
                  <a
                    key={article.link}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col border border-border bg-surface transition-colors duration-300 hover:border-gold"
                  >
                    <div className="relative aspect-[3/2] overflow-hidden bg-ink/5">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        // News images come from arbitrary publisher hosts, which
                        // remotePatterns intentionally does not allow.
                        unoptimized
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="img-zoom"
                      />
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
                        {article.source}
                        {published ? ` · ${published}` : ""}
                      </p>
                      <h3 className="text-balance font-serif text-h4 leading-snug text-heading transition-colors duration-300 group-hover:text-gold-deep">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="line-clamp-3 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <CTABand />
      </main>
      <Footer />
    </>
  );
}
