import Link from "next/link";
import { resolveCredibility } from "@/lib/site-settings";
import { ABOUT_PAGE } from "@/lib/data";

/**
 * The band under the hero: the claim, and what it rests on.
 *
 * Redesigned (Sep 2026) as a split. The claim sets large on the left; on
 * the right, the supporting line and the first three of the group's own
 * values (from the About page, so the two never disagree). Still no
 * figures of any kind — the client's standing rule: nothing on the site
 * that could not be backed up to a buyer, which is surest with no numbers.
 */
export async function CredibilityBand() {
  // Same identifier as the static default so an admin override applies (R-36).
  const CREDIBILITY = await resolveCredibility();
  const pillars = ABOUT_PAGE.values.slice(0, 3);

  return (
    <section className="bg-surface px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <p className="text-eyebrow flex items-center gap-3 font-sans font-semibold uppercase tracking-[0.24em] text-gold-deep">
            <span aria-hidden className="h-px w-10 bg-gold" />
            {CREDIBILITY.eyebrow}
          </p>
          <h2 className="mt-6 text-balance font-serif text-[clamp(2.25rem,3.6vw+1rem,4.25rem)] leading-[1.05] text-heading">
            {CREDIBILITY.headingPre}{" "}
            <em className="italic text-gold-deep">{CREDIBILITY.headingHighlight}</em>{" "}
            {CREDIBILITY.headingPost}
          </h2>
        </div>

        <div className="flex flex-col justify-end gap-8 lg:col-span-5">
          <p className="text-pretty text-body font-sans leading-relaxed text-ink-muted">
            {CREDIBILITY.sub}
          </p>
          <ol className="flex flex-col">
            {pillars.map(([term, description], i) => (
              <li key={term} className="flex gap-5 border-t border-border py-5 last:border-b">
                <span aria-hidden className="font-serif text-h4 leading-none text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-h4 text-heading">{term}</span>
                  <span className="text-pretty text-meta font-sans leading-relaxed text-ink-muted">
                    {description}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/about"
            className="text-eyebrow group inline-flex w-fit items-center gap-2 font-sans font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:text-gold-deep"
          >
            How we work
            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
