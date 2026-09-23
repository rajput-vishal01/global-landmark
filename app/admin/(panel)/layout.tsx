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
    ],
  },
  {
    heading: "Sales",
    items: [
      { label: "Clients", href: "/admin/crm" },
      { label: "Deal Pipeline", href: "/admin/crm/deals" },
    ],
  },
  // Featured Deal, Video Reels, Client Quotes and Services now sit behind
  // /admin/website. Four rows named after their tables told a broker nothing
  // about which part of the public page each one moved; the hub says it, and
  // carries the live count of what is on each strip. Their routes are
  // unchanged — only the way in is.
  //
  // No heading over it, because a heading above a single row is a section
  // label for a section that does not exist. It joins Settings in the loose
  // run at the bottom, where the two site-wide rows belong.
  {
    items: [
      { label: "Deal of the Week", href: "/admin/deals" },
      { label: "Website content", href: "/admin/website" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
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
    // `desk-body` is what puts cream behind the cards. The old panel was white
    // cards on a white page, which is most of why it read as flat — a card
    // with nothing behind it is just a region with a shadow nobody can see.
    <div className="admin-panel desk-body min-h-screen md:flex">
      <AdminSidebar companyName={COMPANY.name} nav={NAV} />
      <main className="desk-main min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
