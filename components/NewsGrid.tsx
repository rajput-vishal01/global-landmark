"use client";

import { useState } from "react";
import Image from "next/image";
import type { NewsArticle } from "@/lib/news";

/**
 * Ten stories per view, at the client's request (the API's own page size):
 * the top story plus three rows of three. "Load more" adds ten at a time.
 */
const PAGE_SIZE = 10;

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The picture, or a branded tile when the publisher sent none. The tile is
 * the site's graphite band (data-band picks up its gradient) with the
 * source set large, so an image-less story still reads as a designed card
 * rather than an empty grey box.
 */
function Visual({ article, sizes }: { article: NewsArticle; sizes: string }) {
  if (article.image) {
    return (
      <Image
        src={article.image}
        alt=""
        fill
        // News images come from arbitrary publisher hosts, which
        // remotePatterns intentionally does not allow.
        unoptimized
        sizes={sizes}
        className="img-zoom"
      />
    );
  }
  return (
    <div data-band className="flex h-full flex-col justify-between bg-navy p-6">
      <span aria-hidden className="h-px w-10 bg-gold" />
      <span className="font-serif text-h3 leading-tight text-cream/90">{article.source}</span>
      <span className="text-eyebrow font-sans font-semibold uppercase tracking-[0.25em] text-cta">
        Market briefing
      </span>
    </div>
  );
}

function Meta({ article }: { article: NewsArticle }) {
  const published = formatDate(article.publishedAt);
  return (
    <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-gold-deep">
      {article.source}
      {published ? ` · ${published}` : ""}
    </p>
  );
}

function ReadOn({ source }: { source: string }) {
  return (
    <span className="mt-auto inline-flex items-center gap-2 pt-4 text-eyebrow font-sans font-semibold uppercase tracking-[0.16em] text-ink transition-colors duration-300 group-hover:text-gold-deep">
      Read on {source}
      <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    </span>
  );
}

/** The lead story, set wide: picture on one side, headline and summary on the other. */
function TopStory({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group mb-12 grid grid-cols-1 overflow-hidden border border-border bg-white shadow-[0_30px_60px_-40px_rgba(40,30,15,0.45)] transition-colors duration-300 hover:border-gold md:grid-cols-12"
    >
      <div className="relative aspect-[16/10] overflow-hidden md:col-span-7 md:aspect-auto md:min-h-[22rem]">
        <Visual article={article} sizes="(min-width: 768px) 58vw, 100vw" />
        <span className="absolute left-4 top-4 bg-cta px-3 py-1.5 text-eyebrow font-sans font-bold uppercase tracking-[0.18em] text-cta-ink">
          Top story
        </span>
      </div>
      <div className="flex flex-col gap-4 p-6 md:col-span-5 md:p-10">
        <Meta article={article} />
        <h3 className="text-balance font-serif text-h3 leading-snug text-heading transition-colors duration-300 group-hover:text-gold-deep">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="line-clamp-5 text-pretty text-body font-sans leading-relaxed text-ink-muted">
            {article.excerpt}
          </p>
        )}
        <ReadOn source={article.source} />
      </div>
    </a>
  );
}

/**
 * The news page: a lead story, then a grid with "load more".
 *
 * The lead is the newest story that has a photograph — opening the page on
 * an image-less tile made it look broken. Every story links out to its
 * publisher; nothing is republished here.
 *
 * ponytail: the whole (already filtered and deduped) set arrives with the
 * page and this reveals it ten at a time — no cursor round-trip, no
 * loading state, and nothing to get wrong when the API is rate-limited
 * mid-session. The upstream fetch is cached for 12h, so paging on the
 * client is also the only version of this that does not spend a request
 * per click. Move to a server action only if the pool ever grows past a
 * single page's worth of payload.
 */
export function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  // Counts the top story too, so the first view is exactly PAGE_SIZE cards.
  const [shown, setShown] = useState(PAGE_SIZE - 1);

  const leadIndex = Math.max(0, articles.findIndex((a) => a.image));
  const lead = articles[leadIndex];
  const rest = articles.filter((_, i) => i !== leadIndex);
  const visible = rest.slice(0, shown);
  const remaining = rest.length - visible.length;

  return (
    <>
      {lead && <TopStory article={lead} />}

      {visible.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((article) => (
            <a
              key={article.link}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden border border-border bg-white transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_24px_48px_-28px_rgba(40,30,15,0.45)]"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Visual
                  article={article}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <Meta article={article} />
                <h3 className="text-balance font-serif text-h4 leading-snug text-heading transition-colors duration-300 group-hover:text-gold-deep">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="line-clamp-3 text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                    {article.excerpt}
                  </p>
                )}
                <ReadOn source={article.source} />
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-3">
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="text-eyebrow cursor-pointer border border-ink/25 bg-white px-8 py-4 font-sans font-medium uppercase tracking-[0.22em] text-ink transition-colors duration-300 hover:border-gold hover:text-gold-deep"
          >
            Load more stories ({remaining})
          </button>
        ) : (
          // Said plainly, so an empty button is never the reason a reader
          // thinks the page is broken.
          <p className="text-meta font-sans text-ink-muted">
            That is every Tricity property story from the last 48 hours. New
            stories arrive with the next refresh.
          </p>
        )}
      </div>
    </>
  );
}
