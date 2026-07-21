import { Suspense } from "react";
import { ScrollReveals } from "@/components/ScrollReveals";
import { SmoothScroll } from "@/components/SmoothScroll";
import { WhatsAppDock } from "@/components/WhatsAppDock";
import { SocialProofTicker } from "@/components/SocialProofTicker";

// Public site shell. Smooth scroll + engagement layer (WhatsApp dock,
// inquiry pop-up, activity ticker) mount here so the admin panel never pays
// for them. ScrollReveals lives HERE, not in the root layout: inside this
// Suspense boundary its GSAP setup runs only after the page subtree
// hydrates, so it never stamps inline styles on server HTML mid-hydration
// (the source of the "attributes didn't match" console error).
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SmoothScroll />
      {/* Suspense: useSearchParams inside would otherwise force CSR bailout
          on the static pages (about/contact). */}
      <Suspense>
        <ScrollReveals />
      </Suspense>
      {children}
      <WhatsAppDock />
      <SocialProofTicker />
    </>
  );
}
