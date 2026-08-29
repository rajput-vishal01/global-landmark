import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { SellForm } from "@/components/SellForm";
import { COMPANY, SELL_PAGE } from "@/lib/data";
import { canonical } from "@/lib/seo";

const PAGE_TITLE = "Sell With Us";
const PAGE_DESCRIPTION =
  "Submit your property for a private valuation and a discreet, well-matched buyer pool across the Tricity.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/sell" },
  openGraph: {
    type: "website",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical("/sell"),
  },
  twitter: { card: "summary_large_image", title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

export default function SellPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-dark-deep px-5 pb-12 pt-36 md:px-12 md:pb-14 md:pt-44">
          <span className="mb-8 block h-px w-16 bg-gold" />
          <h1 className="max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
            {SELL_PAGE.title}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-body font-sans text-cream/75">
            {SELL_PAGE.sub}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-16 px-5 py-20 md:grid-cols-[1fr_1.4fr] md:gap-24 md:px-12 md:py-28">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Why list with us
              </span>
              <p className="text-body font-sans leading-relaxed text-ink">
                A private valuation from principals who know the Tricity market, followed by
                a discreet introduction to a well-matched buyer pool — not a public listing
                blitz.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Direct
              </span>
              <p className="text-body font-sans leading-relaxed text-ink">
                {COMPANY.email}
                <br />
                <a
                  href={COMPANY.phoneHref}
                  className="underline decoration-border underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {COMPANY.phone}
                </a>
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.2em] text-ink-muted">
                Markets
              </span>
              <p className="text-body font-sans leading-relaxed text-ink-muted">
                {COMPANY.markets.join(" · ")}
              </p>
            </div>
          </div>

          <SellForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
