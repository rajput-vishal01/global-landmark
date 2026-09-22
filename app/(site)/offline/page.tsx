import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/Button";
import { PageHeader, SECTION } from "../_components/page-chrome";
import { resolveCompany } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "You are offline",
  // Precached by the service worker and only ever shown without a
  // connection — there is nothing here for a crawler to index.
  robots: { index: false, follow: false },
};

/**
 * The page the service worker falls back to when a navigation fails and
 * nothing is cached for that URL.
 *
 * It carries the phone number as a real tel: link, which is the point: a
 * buyer standing at a site visit with no signal can still call. Everything
 * else on this page is decoration by comparison.
 */
export default async function OfflinePage() {
  const COMPANY = await resolveCompany();
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="No connection"
          title="You are offline"
          sub="This page needs a connection. Pages you have already visited will still open."
        />

        <section className={SECTION}>
          <div className="max-w-xl">
            <p className="text-pretty text-body font-sans leading-relaxed text-ink">
              If you were part-way through an enquiry, nothing has been sent —
              reconnect and send it again. To reach us right now:
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href={COMPANY.phoneHref} variant="primary">
                Call {COMPANY.phone}
              </Button>
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-meta font-sans text-ink-muted underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-gold"
              >
                {COMPANY.email}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
