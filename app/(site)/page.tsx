import { connection } from "next/server";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { CredibilityBand } from "@/components/sections/CredibilityBand";
import { FeaturedListings } from "@/components/sections/FeaturedListings";
import { ArchReveal } from "@/components/sections/ArchReveal";
import { Pillars } from "@/components/sections/Pillars";
import { AboutSplit } from "@/components/sections/AboutSplit";
import { PressMarquee } from "@/components/sections/PressMarquee";
import { CTABand } from "@/components/sections/CTABand";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/sections/Footer";
import { DealOfWeek } from "@/components/sections/DealOfWeek";
import { getActiveDeal, getFeaturedProperties } from "@/lib/db/queries";

export default async function Home() {
  // Render per request (Docker builds have no DB to prerender against);
  // the queries themselves are cached and busted by admin mutations.
  await connection();
  const [featured, activeDeal] = await Promise.all([
    getFeaturedProperties(),
    getActiveDeal(),
  ]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <CredibilityBand />
        <FeaturedListings properties={featured} />
        <DealOfWeek deal={activeDeal} />
        <ArchReveal />
        <Pillars />
        <AboutSplit />
        <PressMarquee />
        <CTABand />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
