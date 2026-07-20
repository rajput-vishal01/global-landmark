import { ScrollReveals } from "@/components/ScrollReveals";
import { WhatsAppDock } from "@/components/WhatsAppDock";
import { SocialProofTicker } from "@/components/SocialProofTicker";

// Public site shell. Engagement layer (WhatsApp dock, inquiry pop-up,
// activity ticker) mounts here so the admin panel never renders it.
// ScrollReveals lives HERE, not in the root layout: inside this Suspense
// boundary its GSAP setup runs only after the page subtree hydrates, so it
// never stamps inline styles on server HTML mid-hydration (the source of
// the "attributes didn't match" console error).
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ScrollReveals />
      {children}
      <WhatsAppDock />
      <SocialProofTicker />
    </>
  );
}
