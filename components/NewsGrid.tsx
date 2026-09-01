"use client";

import { useState } from "react";
import Image from "next/image";
import type { NewsArticle } from "@/lib/news";

/** Two rows of three, so "load more" is reachable on a thin news day. */
const PAGE_SIZE = 6;

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

/**
 * The news grid with its "load more" control.
 *
 * ponytail: the whole (already filtered and deduped) set arrives with the
 * page and this reveals it nine at a time — no cursor round-trip, no
 * loading state, and nothing to get wrong when the API is rate-limited
 * mid-session. The upstream fetch is cached for 12h, so paging on the
 * client is also the only version of this that does not spend a request
 * per click. Move to a server action only if the pool ever grows past a
 * single page's worth of payload.
 */
export function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = articles.slice(0, shown);
  const remaining = articles.length - visible.length;

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((article) => {
          const published = formatDate(article.publishedAt);
          return (
            <a
              key={article.link}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col border border-border bg-surface transition-colors duration-300 hover:border-gold"
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-navy">
                {article.image ? (
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
                ) : (
                  // Wire-copy fallback rather than dropping the article:
                  // Tricity property stories are thin enough that requiring a
                  // photograph would empty the page on a quiet day.
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <span aria-hidden className="h-px w-10 bg-gold" />
                    <span className="text-eyebrow font-sans font-semibold uppercase tracking-[0.25em] text-cta">
                      {article.source}
                    </span>
                  </div>
                )}
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

      {remaining > 0 && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="text-eyebrow cursor-pointer border border-ink/25 px-8 py-4 font-sans font-medium uppercase tracking-[0.22em] text-ink transition-colors duration-300 hover:border-gold hover:text-gold-deep"
          >
            Load more ({remaining})
          </button>
        </div>
      )}
    </>
  );
}
