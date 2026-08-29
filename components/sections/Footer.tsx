import type { ReactNode } from "react";
import Link from "next/link";
import { FOOTER } from "@/lib/data";
import { resolveCompany } from "@/lib/site-settings";
import { NewsletterForm } from "@/components/NewsletterForm";
import { listPublishedAreas } from "@/lib/db/areas";
import { COLLECTIONS } from "@/lib/attributes";
import { propertiesHref } from "@/lib/properties-url";
import { CITY_NAMES } from "@/lib/locations";

// Icons keyed by social label; a label without an icon falls back to text.
const SOCIAL_ICONS: Record<string, ReactNode> = {
  Instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  X: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  ),
  LinkedIn: (
    <span className="font-sans text-[13px] font-semibold leading-none">in</span>
  ),
  YouTube: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z" />
    </svg>
  ),
};

/** Column label — yellow, so the eye can find a block in a dense navy field. */
const BLOCK_HEADING =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-cta";

/**
 * One SEO link block. Rendered as a wrapped, pipe-separated run rather than
 * a stacked list: three of these as columns of <li>s would add a screen of
 * height to every page, which is exactly the footer sprawl we are trying to
 * avoid while still giving crawlers the links.
 */
function LinkBlock({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  if (!links.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <h3 className={BLOCK_HEADING}>{heading}</h3>
      <ul className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {links.map((link, i) => (
          <li key={link.href} className="flex items-center gap-x-2">
            {i > 0 && (
              <span aria-hidden className="text-cream/25">
                |
              </span>
            )}
            <Link
              href={link.href}
              className="text-meta font-sans text-cream/70 transition-colors hover:text-cta"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  // Same identifier as the static default (lib/data.ts's COMPANY) so every
  // COMPANY.x reference below picks up an admin override automatically —
  // R-36 without rewriting the rest of this file.
  const [COMPANY, areas] = await Promise.all([
    resolveCompany(),
    listPublishedAreas(),
  ]);

  return (
    <footer className="bg-navy text-cream">
      {/* Brand block */}
      <div className="flex flex-col items-center gap-2 px-5 pb-12 pt-16 text-center md:pt-20">
        <p className="font-serif text-3xl uppercase tracking-[0.18em] md:text-4xl">
          {COMPANY.name}
        </p>
        <p className="text-eyebrow font-sans font-medium uppercase tracking-[0.35em] text-cta">
          {COMPANY.tagline}
        </p>
        <p className="mt-2 text-meta font-sans text-cream/60">{COMPANY.license}</p>
      </div>

      {/* Contact / Office / Social */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 pb-14 md:grid-cols-[1fr_auto_1.4fr_auto_1fr] md:items-start md:gap-0">
        <div className="flex flex-col gap-3 md:pr-10">
          <span className={BLOCK_HEADING}>Contact</span>
          <p className="text-meta font-sans leading-relaxed text-cream/80">
            <a
              href={`mailto:${COMPANY.email}`}
              className="underline decoration-cream/25 underline-offset-4 transition-colors hover:decoration-cta hover:text-cta"
            >
              {COMPANY.email}
            </a>
            <br />
            <a href={COMPANY.phoneHref} className="underline decoration-cream/25 underline-offset-4 transition-colors hover:decoration-cta hover:text-cta">
              {COMPANY.phone}
            </a>
            {" · "}
            <a href={COMPANY.phoneAltHref} className="underline decoration-cream/25 underline-offset-4 transition-colors hover:decoration-cta hover:text-cta">
              {COMPANY.phoneAlt}
            </a>
          </p>
        </div>

        <span aria-hidden className="hidden w-px self-stretch bg-cream/15 md:block" />

        <div className="flex flex-col gap-3 md:px-10">
          <span className={BLOCK_HEADING}>Office</span>
          <p className="text-meta font-sans leading-relaxed text-cream/80">
            {COMPANY.addressLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-0 gap-y-2">
            {COMPANY.markets.map((city, i) => (
              <li
                key={city}
                className={`text-meta font-sans text-cream/60 ${
                  i > 0 ? "border-l border-cream/15 pl-4" : ""
                } ${i < COMPANY.markets.length - 1 ? "pr-4" : ""}`}
              >
                {city}
              </li>
            ))}
          </ul>
        </div>

        <span aria-hidden className="hidden w-px self-stretch bg-cream/15 md:block" />

        <div className="flex flex-col gap-3 md:pl-10">
          <span className={BLOCK_HEADING}>Follow</span>
          <ul className="flex flex-wrap gap-3">
            {COMPANY.socials.filter((s) => s.href.startsWith("http")).map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream transition-colors duration-300 hover:border-cta hover:text-cta"
                >
                  {SOCIAL_ICONS[social.label] ?? (
                    <span className="font-sans text-[11px]">{social.label}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SEO link blocks — every link derived from live data, so a new area or
          a retired collection changes this without anyone editing the footer. */}
      <div className="border-t border-cream/10 px-5 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <LinkBlock
            heading="Properties by location"
            links={areas.map((area) => ({
              href: `/areas/${area.slug}`,
              label: area.name,
            }))}
          />
          <LinkBlock
            heading="Browse by collection"
            links={COLLECTIONS.map((collection) => ({
              href: propertiesHref({}, { group: collection.value }),
              label: collection.label,
            }))}
          />
          <LinkBlock
            heading="Browse by city"
            links={CITY_NAMES.map((city) => ({
              href: propertiesHref({}, { city }),
              label: city,
            }))}
          />
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-cream/10 px-5 py-10 md:px-12">
        <div className="mx-auto w-full max-w-xl">
          <NewsletterForm />
        </div>
      </div>

      {/* Disclaimer + compliance */}
      <div className="border-t border-cream/10 px-5 py-8 md:px-12">
        <p className="max-w-4xl text-meta font-sans leading-relaxed text-cream/55">
          {FOOTER.disclaimer}
        </p>
        {/* RERA line (R-71). Indian property advertising is expected to carry
            the agency's registration number, and the client has not supplied
            one yet — so this renders the generic compliance sentence only. Do
            NOT write a number in here: when the client confirms it, append it
            to COMPANY.license / COMPANY.compliance in lib/data.ts (or set it
            through the admin contact override) and it appears here and in the
            brand block above at once. Never hardcode it at this call site. */}
        <p className="mt-4 text-meta font-sans text-cream/70">{COMPANY.compliance}</p>
      </div>

      <div className="flex flex-col items-start gap-2 border-t border-cream/10 px-5 py-6 text-meta font-sans text-cream/55 md:flex-row md:items-center md:justify-between md:px-12">
        <span>&copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</span>
        <span>{COMPANY.markets.join(" · ")}</span>
      </div>
    </footer>
  );
}
