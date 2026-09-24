import { Button } from "@/components/ui/Button";
import { CTA_BAND } from "@/lib/data";
import { resolveCompany } from "@/lib/site-settings";

/**
 * The closing conversion band (Sep 2026 redesign): the pitch on the left,
 * two ways to act on the right — the valuation form (the /sell page) and a
 * direct call, because a seller who is ready usually wants a person. It
 * was one centred button before.
 */
export async function CTABand() {
  const COMPANY = await resolveCompany();

  return (
    <section className="overflow-hidden bg-navy-deep px-5 py-20 md:px-12 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <p className="text-eyebrow flex items-center gap-3 font-sans font-semibold uppercase tracking-[0.24em] text-cta">
            <span aria-hidden className="h-px w-10 bg-cta" />
            List with us
          </p>
          <h2 className="mt-5 text-balance font-serif text-[clamp(2.25rem,3.4vw+1rem,4rem)] leading-[1.05] text-cream">
            {CTA_BAND.heading}
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-body font-sans leading-relaxed text-cream/70">
            {CTA_BAND.sub}
          </p>
        </div>

        <div className="flex flex-col gap-4 border-cream/15 lg:col-span-5 lg:border-l lg:pl-12">
          <Button href="/sell" variant="primary" fullWidth>
            {CTA_BAND.ctaLabel}
          </Button>
          <a
            href={COMPANY.phoneHref}
            className="group flex items-center justify-between gap-4 border border-cream/25 px-6 py-4 transition-colors hover:border-cta"
          >
            <span className="flex flex-col">
              <span className="text-eyebrow font-sans font-semibold uppercase tracking-[0.18em] text-cream/60">
                Or call us
              </span>
              <span className="tel font-serif text-h4 text-cream transition-colors group-hover:text-cta">
                {COMPANY.phone}
              </span>
            </span>
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-cta">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
