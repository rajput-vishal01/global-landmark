import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CTA_BAND } from "@/lib/data";

/**
 * The closing conversion band. The button used to be a magnetic gold-corner
 * frame; a primary action that drifts away from the pointer is a flourish a
 * portal cannot afford, so it is now the same yellow fill as every other
 * primary on the site.
 */
export function CTABand() {
  return (
    <section className="overflow-hidden bg-navy-deep px-5 py-20 md:px-12 md:py-28">
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <SectionHeading
          flush
          align="center"
          tone="dark"
          eyebrow="List with us"
          title={CTA_BAND.heading}
          sub={CTA_BAND.sub}
        />
        <div className="mt-9">
          <Button href="/sell" variant="primary">
            {CTA_BAND.ctaLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
