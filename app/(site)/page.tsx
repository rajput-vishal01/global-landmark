import { connection } from "next/server";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { CredibilityBand } from "@/components/sections/CredibilityBand";
import { FeaturedListings } from "@/components/sections/FeaturedListings";
import { CollectionGrid } from "@/components/CollectionGrid";
import { AboutSplit } from "@/components/sections/AboutSplit";
import { PressMarquee } from "@/components/sections/PressMarquee";
import { CTABand } from "@/components/sections/CTABand";
import { Testimonials } from "@/components/sections/Testimonials";
import { Services } from "@/components/sections/Services";
import { Footer } from "@/components/sections/Footer";
import { DealOfWeek } from "@/components/sections/DealOfWeek";
import {
  getActiveDeal,
  getFeaturedProperties,
  listCollectionCounts,
} from "@/lib/db/queries";

export default async function Home() {
  // Render per request (Docker builds have no DB to prerender against);
  // the queries themselves are cached and busted by admin mutations.
  await connection();
  const [featured, activeDeal, collectionCounts] = await Promise.all([
    getFeaturedProperties(),
    getActiveDeal(),
    listCollectionCounts(),
  ]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <div className="relative z-10">
          <CredibilityBand />
          <FeaturedListings properties={featured} />

          {/* Browse-by-collection bento, the same one /properties uses.
              It replaced the areas grid here: two card grids back to back
              (listings, then areas) read as the same section rendered
              twice, and this one is doing a different job — it sorts the
              portfolio by what KIND of thing you want rather than showing
              more of the individual listings directly above it. The areas
              pages themselves are untouched and still live at /areas. */}
          <section className="bg-surface px-5 py-16 md:px-12 md:py-24">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <h2 className="text-balance font-serif text-h2 uppercase tracking-[0.04em] text-ink">
                Browse by Collection
              </h2>
            </div>
            <CollectionGrid counts={collectionCounts} current={{}} />
          </section>

          <DealOfWeek deal={activeDeal} />
          <Services />
          <AboutSplit />
          <PressMarquee />
          <CTABand />
          <Testimonials />
        </div>
      </main>
      <Footer />
    </>
  );
}
