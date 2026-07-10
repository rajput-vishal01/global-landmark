import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { CredibilityBand } from "@/components/sections/CredibilityBand";
import { FeaturedListings } from "@/components/sections/FeaturedListings";
import { ArchReveal } from "@/components/sections/ArchReveal";
import { Pillars } from "@/components/sections/Pillars";
import { AboutSplit } from "@/components/sections/AboutSplit";
import { PressMarquee } from "@/components/sections/PressMarquee";
import { Manifesto } from "@/components/sections/Manifesto";
import { CommunityGrid } from "@/components/sections/CommunityGrid";
import { CTABand } from "@/components/sections/CTABand";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CredibilityBand />
        <FeaturedListings />
        <ArchReveal />
        <Pillars />
        <AboutSplit />
        <PressMarquee />
        <Manifesto />
        <CommunityGrid />
        <CTABand />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
