import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin/auth";
import { COMPANY } from "@/lib/data";
import { AdminSidebar, type NavGroup } from "@/components/admin/AdminSidebar";

/**
 * Panel information architecture (R-33), grouped.
 *
 * The list was fourteen flat items, which is where a non-technical user
 * gets lost: nothing said which screens are the portfolio, which are people
 * who contacted us, and which are website content. The groups below are
 * the four jobs, in the order a broker works through them.
 *
 * Two renames matter more than they look:
 *
 * - "Deal of the Week" is now "Featured Deal". The panel had TWO unrelated
 *   things called deals — this one (a listing promoted on the landing page)
 *   and the CRM sales pipeline — and a broker being told to "check the
 *   deals" had no way to know which was meant.
 * - "Testimonials" / "Written Quotes" are now "Video Reels" / "Client
 *   Quotes", because both were testimonials and neither name said which
 *   one held videos.
 *
 * An item with a null href renders as disabled text, not a dead link.
 */
const NAV: NavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin" }] },
  {
    heading: "Portfolio",
    items: [
      { label: "Properties", href: "/admin/properties" },
      { label: "Projects", href: "/admin/projects" },
      { label: "Builders", href: "/admin/builders" },
      { label: "Areas", href: "/admin/areas" },
    ],
  },
  {
    heading: "People who contacted us",
    items: [
      { label: "Leads", href: "/admin/leads" },
      { label: "Tour Requests", href: "/admin/tours" },
      // Owners offering a property through /sell. It sits with the other
      // inboxes rather than under Portfolio because the job is the same one
      // — someone got in touch and is waiting on a reply — even though what
      // arrives is a draft listing.
      { label: "Property Submissions", href: "/admin/submissions" },
      { label: "Newsletter Signups", href: "/admin/subscribers" },
    ],
  },
  {
    heading: "Sales",
    items: [
      { label: "Clients", href: "/admin/crm" },
      { label: "Deal Pipeline", href: "/admin/crm/deals" },
    ],
  },
  {
    heading: "Website content",
    items: [
      { label: "Featured Deal", href: "/admin/deals" },
      { label: "Video Reels", href: "/admin/testimonials" },
      { label: "Client Quotes", href: "/admin/text-testimonials" },
      { label: "Services", href: "/admin/services" },
    ],
  },
  { items: [{ label: "Settings", href: "/admin/settings" }] },
];

export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Defense in depth: the proxy gates /admin, but panel pages must never
  // depend on the matcher alone (Next data-security guidance).
  const store = await cookies();
  if (!verifyAdminToken(store.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  return (
    // `admin-panel` scopes the dense type scale in globals.css. Without it
    // every screen here inherits the public site's editorial sizing, which
    // is what made the panel read as oversized.
    <div className="admin-panel min-h-screen md:flex">
      <AdminSidebar companyName={COMPANY.name} nav={NAV} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
