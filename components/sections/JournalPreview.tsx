import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const ARTICLES = [
  {
    title: "Where the Quiet Money Is Buying in 2026",
    category: "Market Insight",
    date: "July 2026",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=800&auto=format&fit=crop",
    href: "/journal/where-quiet-money-buys",
  },
  {
    title: "The Case for Buying Architecture, Not Address",
    category: "Perspective",
    date: "June 2026",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop",
    href: "/journal/architecture-not-address",
  },
  {
    title: "Inside a Record Harbor Point Sale",
    category: "Sold Stories",
    date: "May 2026",
    image:
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=800&auto=format&fit=crop",
    href: "/journal/record-harbor-point-sale",
  },
];

/**
 * Journal preview: sticky serif intro on the left, editorial article rows
 * on the right with thumbnail, meta line, and italic-on-hover titles.
 */
export function JournalPreview() {
  return (
    <section className="grid grid-cols-1 gap-14 bg-cream px-5 py-20 md:grid-cols-[1fr_1.6fr] md:gap-20 md:px-12 md:py-28">
      <div className="md:sticky md:top-32 md:self-start">
        <h2 data-reveal className="max-w-sm text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
          The Journal
        </h2>
        <p data-reveal className="mt-5 max-w-sm text-pretty text-body font-sans text-ink-muted">
          Market intelligence and stories from inside landmark transactions,
          written by the people who closed them.
        </p>
        <div data-reveal className="mt-8">
          <Button href="/journal">Read the Journal</Button>
        </div>
      </div>

      <div className="flex flex-col">
        {ARTICLES.map((article, i) => (
          <Link
            key={article.href}
            href={article.href}
            data-reveal
            className={`group flex items-center gap-6 py-7 md:gap-10 ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div className="relative aspect-[3/2] w-28 shrink-0 overflow-hidden md:w-44">
              <Image
                src={article.image}
                alt=""
                fill
                sizes="(min-width: 768px) 176px, 112px"
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <p className="text-meta font-sans text-ink-muted">
                {article.category} · {article.date}
              </p>
              <h3 className="text-balance font-serif text-h4 leading-snug text-ink transition-[font-style] duration-300 group-hover:italic">
                {article.title}
              </h3>
            </div>
            <svg
              width="26"
              height="10"
              viewBox="0 0 30 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="hidden shrink-0 text-ink-muted transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-gold-deep md:block"
            >
              <path d="M0 5h28M24 1l4 4-4 4" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
