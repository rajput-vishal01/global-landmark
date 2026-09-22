import Link from "next/link";
import { resolveCompany } from "@/lib/site-settings";
import { SocialLinks } from "@/components/SocialLinks";

const BLOCK_HEADING =
  "text-eyebrow font-sans font-semibold uppercase tracking-[0.2em] text-cta";

const FOOTER_LINK =
  "text-meta font-sans text-cream/75 transition-colors hover:text-cta";

const LEGAL_LINK =
  "underline decoration-cream/25 underline-offset-4 transition-colors hover:text-cream hover:decoration-gold";

export async function Footer() {
  // Same identifier as the static default (lib/data.ts's COMPANY) so every
  // COMPANY.x reference below picks up an admin override automatically.
  const COMPANY = await resolveCompany();

  return (
    // Deepest graphite plus a gold hairline: the band above it is dark too,
    // and without a hard edge the two read as one section.
    <footer className="border-t border-gold/40 bg-dark-deep text-cream">
      <div className="px-5 md:px-12">
        {/* Three columns on desktop: who we are, how to reach us, where we
            are. The newsletter that used to fill the right-hand column was
            removed at the client's request. */}
        <div className="grid grid-cols-1 gap-12 border-b border-cream/10 py-14 md:grid-cols-2 md:py-16 lg:grid-cols-[1.15fr_1fr_1.2fr] lg:gap-14">
          <div className="flex flex-col gap-6">
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

            <div className="flex flex-col gap-3">
              <h3 className={BLOCK_HEADING}>Follow us</h3>
              <SocialLinks socials={COMPANY.socials} brand={COMPANY.name} phoneHref={COMPANY.phoneHref} />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className={BLOCK_HEADING}>Call</h3>
              <p className="flex flex-col gap-1">
                <a href={COMPANY.phoneHref} className={FOOTER_LINK}>
                  {COMPANY.phone}
                </a>
                <a href={COMPANY.phoneAltHref} className={FOOTER_LINK}>
                  {COMPANY.phoneAlt}
                </a>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className={BLOCK_HEADING}>Write</h3>
              <a href={`mailto:${COMPANY.email}`} className={`${FOOTER_LINK} break-all`}>
                {COMPANY.email}
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className={BLOCK_HEADING}>Visit</h3>
              <address className="not-italic text-meta font-sans leading-relaxed text-cream/60">
                {COMPANY.addressLines.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </address>
              {COMPANY.officeHours && (
                <p className="text-meta font-sans text-cream/60">{COMPANY.officeHours}</p>
              )}
              <a
                href={COMPANY.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-meta font-sans font-semibold text-cta underline-offset-4 hover:underline"
              >
                Get directions &rarr;
              </a>
            </div>
          </div>

          {/* Map preview. The iframe is display only (no pointer events, out
              of the tab order); the link laid over it is the real control,
              so a click anywhere opens the office in Google Maps instead of
              trapping the scroll wheel inside a tiny map. */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className={`${BLOCK_HEADING} mb-3`}>Find the office</h3>
            <div className="group relative aspect-[4/3] overflow-hidden border border-cream/15 bg-navy-deep md:aspect-[16/9] lg:aspect-[4/3]">
              <iframe
                src={COMPANY.mapsEmbedUrl}
                title={`Map showing ${COMPANY.name}'s office`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                tabIndex={-1}
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full border-0 grayscale-[35%] transition-[filter] duration-500 group-hover:grayscale-0"
              />
              <a
                href={COMPANY.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${COMPANY.name}'s office in Google Maps`}
                className="absolute inset-0 flex items-end p-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cta"
              >
                <span className="inline-flex items-center gap-2 bg-surface px-3.5 py-2 text-eyebrow font-sans font-semibold uppercase tracking-[0.14em] text-ink shadow-md transition-colors group-hover:bg-cta group-hover:text-cta-ink">
                  Open in Google Maps
                  <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Registration line (R-71). Indian property advertising is expected
            to carry the agency's registration number. RERA has been applied
            for and not issued, so what runs here is the Udyam/MSME number,
            which is real and verifiable. When HRERA issues the RERA number,
            add it to lib/data.ts — never hardcode a number at this call
            site, or the footer and the terms page start disagreeing. */}
        <div className="py-8">
          <div className="flex flex-col gap-4 text-meta font-sans text-cream/55 md:flex-row md:items-center md:justify-between">
            <span>
              &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights
              reserved.
            </span>
            {/* The footer is where a reader — and a Meta reviewer checking the
                business against its documents — looks for these. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/privacy" className={LEGAL_LINK}>
                Privacy policy
              </Link>
              <Link href="/terms" className={LEGAL_LINK}>
                Terms of use
              </Link>
              {/* Its own link, not a section of the policy: Meta asks for a
                  dedicated Data Deletion Instructions URL. */}
              <Link href="/data-deletion" className={LEGAL_LINK}>
                Data deletion
              </Link>
              {/* Checkable against udyamregistration.gov.in — which is the
                  whole point of printing it on every page. */}
              <span className="text-cream/45">
                Udyam {COMPANY.udyam} · {COMPANY.compliance}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
