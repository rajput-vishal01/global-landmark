import { WhatsAppDock } from "@/components/WhatsAppDock";
import { EnquiryDock } from "@/components/EnquiryDock";
import { LeadCapturePopup } from "@/components/LeadCapturePopup";
import { BackToTop } from "@/components/BackToTop";
import { resolveCompany } from "@/lib/site-settings";

// Public site shell. The engagement layer (WhatsApp dock, enquiry pop-up,
// back-to-top) mounts here so the admin panel never pays
// for it.
//
// Phase A removed two things that used to live here: Lenis smooth scroll
// and the global ScrollReveals engine. Between them they owned every
// scroll-driven effect on the site — fade-ups, image settles, scrubbed
// unveils, column drift, and the momentum-scroll feel. Scrolling is now
// native and nothing animates because the page moved, which is what the
// client was actually asking for. Motion that responds to a user action
// (menus, modals, hover, carousels) is untouched.
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <WhatsAppDock phoneHref={(await resolveCompany()).phoneHref} />
      <EnquiryDock />
      {/* Ten seconds in, once per session. Mounted here rather than per
          page so it is not re-armed by a client-side navigation. */}
      <LeadCapturePopup />
      <BackToTop />
    </>
  );
}
