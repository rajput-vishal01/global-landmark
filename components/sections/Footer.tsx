import type { ReactNode } from "react";
import Link from "next/link";
import { FOOTER } from "@/lib/data";
import { resolveCompany } from "@/lib/site-settings";
import { NewsletterForm } from "@/components/NewsletterForm";
import { listPublishedAreas } from "@/lib/db/areas";
import { COLLECTIONS } from "@/lib/attributes";
import { propertiesHref } from "@/lib/properties-url";
import { CITY_NAMES } from "@/lib/locations";
import { MENU_GROUPS } from "@/components/sections/nav-links";

/**
 * Icons keyed by social label; a label without an icon falls back to text.
 * Hand-drawn rather than lucide: lucide v1 dropped brand glyphs, and these
 * are the four marks the client's profiles actually need.
 */
const SOCIAL_ICONS: Record<string, ReactNode> = {
  Instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 8h3V5h-3a4 4 0 0 0-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9a1 1 0 0 1 1-1Z" />
    </svg>
  ),
};

const BLOCK_HEADING =
  "text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-cta";

const FOOTER_LINK =
  "text-meta font-sans text-cream/65 transition-colors hover:text-cta";

/**
 * A stacked link column. The old footer ran these as pipe-separated prose to
 * save height; at three blocks it read as a wall of grey text with no shape.
 * Columns cost the same vertical space inside the grid and give the eye a
 * structure to scan.
 */
function LinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  if (!links.length) return null;
  return (
    <div className="flex flex-col gap-4">
      <h3 className={BLOCK_HEADING}>{heading}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={FOOTER_LINK}>
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

  const socials = COMPANY.socials.filter((s) => s.href.startsWith("http"));

  return (
    <footer className="bg-navy text-cream">
      <div className="mx-auto max-w-6xl px-5 md:px-12">
        {/* Masthead: the wordmark and the newsletter share one row, so the
            signup reads as part of the brand address block rather than as
            the isolated full-width band it used to be. */}
        <div className="grid grid-cols-1 gap-10 border-b border-cream/10 py-14 md:grid-cols-[1.1fr_1fr] md:gap-20 md:py-16">
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-serif text-3xl uppercase tracking-[0.16em] md:text-4xl">
                {COMPANY.name}
              </p>
              <p className="mt-1.5 text-eyebrow font-sans font-semibold uppercase tracking-[0.35em] text-cta">
                {COMPANY.tagline}
              </p>
            </div>
            <p className="max-w-sm text-pretty text-meta font-sans leading-relaxed text-cream/60">
              {COMPANY.license}
            </p>
            {socials.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2.5">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors duration-300 hover:border-cta hover:text-cta"
                    >
                      {SOCIAL_ICONS[social.label] ?? (
                        <span className="font-sans text-[11px]">{social.label}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:pt-2">
            <NewsletterForm />
          </div>
        </div>

        {/* Four columns: how to reach us, then the three crawlable link sets.
            Every link is derived from live data, so a new area or a retired
            collection changes this without anyone editing the footer. */}
        <div className="grid grid-cols-1 gap-10 border-b border-cream/10 py-12 sm:grid-cols-2 lg:grid-cols-4 md:gap-12">
          <div className="flex flex-col gap-4">
            <h3 className={BLOCK_HEADING}>Contact</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href={`mailto:${COMPANY.email}`} className={FOOTER_LINK}>
                  {COMPANY.email}
                </a>
              </li>
              <li>
                <a href={COMPANY.phoneHref} className={FOOTER_LINK}>
                  {COMPANY.phone}
                </a>
              </li>
              <li>
                <a href={COMPANY.phoneAltHref} className={FOOTER_LINK}>
                  {COMPANY.phoneAlt}
                </a>
              </li>
            </ul>
            <address className="not-italic text-meta font-sans leading-relaxed text-cream/60">
              {COMPANY.addressLines.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </address>
          </div>

          <LinkColumn
            heading="Explore"
            links={MENU_GROUPS.map((link) => ({
              href: link.href,
              label: link.label,
            }))}
          />

          <LinkColumn
            heading="Browse by collection"
            links={COLLECTIONS.map((collection) => ({
              href: propertiesHref({}, { group: collection.value }),
              label: collection.label,
            }))}
          />

          <LinkColumn
            heading={areas.length ? "Popular localities" : "Browse by city"}
            links={
              areas.length
                ? areas.slice(0, 8).map((area) => ({
                    href: `/areas/${area.slug}`,
                    label: area.name,
                  }))
                : CITY_NAMES.map((city) => ({
                    href: propertiesHref({}, { city }),
                    label: city,
                  }))
            }
          />
        </div>

        <div className="flex flex-col gap-5 py-8">
          <p className="max-w-4xl text-[0.72rem] font-sans leading-relaxed text-cream/45">
            {FOOTER.disclaimer}
          </p>
          {/* RERA line (R-71). Indian property advertising is expected to carry
              the agency's registration number, and the client has not supplied
              one yet — so this renders the generic compliance sentence only. Do
              NOT write a number in here: when the client confirms it, append it
              to COMPANY.license / COMPANY.compliance in lib/data.ts (or set it
              through the admin contact override) and it appears here and in the
              masthead above at once. Never hardcode it at this call site. */}
          <div className="flex flex-col gap-2 border-t border-cream/10 pt-6 text-meta font-sans text-cream/55 md:flex-row md:items-center md:justify-between">
            <span>
              &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights
              reserved.
            </span>
            <span className="text-cream/45">{COMPANY.compliance}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
