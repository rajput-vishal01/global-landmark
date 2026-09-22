import type { Metadata } from "next";
import { connection } from "next/server";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { CredibilityBand } from "@/components/sections/CredibilityBand";
import { FeaturedListings } from "@/components/sections/FeaturedListings";
import { LocationGrid } from "@/components/LocationGrid";
import { AboutSplit } from "@/components/sections/AboutSplit";
import { DeveloperMarquee } from "@/components/sections/DeveloperMarquee";
import { CTABand } from "@/components/sections/CTABand";
import { Testimonials } from "@/components/sections/Testimonials";
import { TextTestimonials } from "@/components/sections/TextTestimonials";
import { Services } from "@/components/sections/Services";
import { Footer } from "@/components/sections/Footer";
import { DealOfWeek } from "@/components/sections/DealOfWeek";
import {
  getActiveDeal,
  getFeaturedProperties,
  listLocationCards,
} from "@/lib/db/queries";
import { LANDING_LOCATIONS } from "@/lib/locations";

// Title, description and Open Graph come from the root layout's defaults.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  // Render per request (Docker builds have no DB to prerender against);
  // the queries themselves are cached and busted by admin mutations.
  await connection();
  const [featured, activeDeal, locationCards] = await Promise.all([
    getFeaturedProperties(),
    getActiveDeal(),
    listLocationCards(LANDING_LOCATIONS),
  ]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <div className="relative z-10">
          <CredibilityBand />
          <FeaturedListings properties={featured} />

          {/* Browse-by-location bento. This was the collection grid (Kothi /
              Plot / Flats ...) — buyers in this market start from a
              micro-market, not a property type, and the type filters are
              one click away on /properties, which still leads with the
              collection grid. */}
          <section className="bg-surface px-5 py-16 md:px-12 md:py-24">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <h2 className="text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
                Browse by Location
              </h2>
            </div>
            <LocationGrid cards={locationCards} />
          </section>

          <DealOfWeek deal={activeDeal} />
          <Services />
          <AboutSplit />
          <DeveloperMarquee />
          <CTABand />
          <TextTestimonials />
          <Testimonials />
        </div>
      </main>
      <Footer />
    </>
  );
}
