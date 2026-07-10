import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { CTABand } from "@/components/sections/CTABand";
import { ListingCard } from "@/components/ui/ListingCard";
import { LISTINGS } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Exclusive Listings | Global Landmark Realty Group",
  description:
    "The current portfolio of landmark residences represented by Global Landmark Realty Group.",
};

export default function PropertiesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="flex min-h-[78vh] flex-col justify-end bg-dark-deep px-5 pb-16 pt-40 md:px-12 md:pb-20">
          <span data-reveal className="mb-8 block h-px w-16 bg-gold" />
          <h1 data-reveal className="max-w-4xl text-balance font-serif text-h1 uppercase tracking-[0.04em] text-cream">
            Exclusive Listings
          </h1>
          <p data-reveal className="mt-6 max-w-xl text-pretty text-body font-sans text-cream/75">
            {LISTINGS.length} residences currently represented. Off-market
            introductions are available on request.
          </p>
        </section>

        <section className="px-5 py-20 md:px-12 md:py-28">
          <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {LISTINGS.map((listing) => (
              <div key={listing.title} data-reveal>
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </section>

        <CTABand />
      </main>
      <Footer />
    </>
  );
}
