import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin/auth";
import { COMPANY } from "@/lib/data";
import { AdminSidebar, type NavItem } from "@/components/admin/AdminSidebar";

/**
 * Panel information architecture (R-33). The order is the order a broker
 * works in: the portfolio first, the people around it second, the marketing
 * surfaces last.
 *
 * `href: null` means the page is not built yet. It renders as visibly
 * disabled text rather than a `#` or a link to a 404 — the IA is the useful
 * part (it tells the client what is coming and where it will live), a dead
 * link is not. Give one an `href` in the phase that ships its page.
 */
const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Properties", href: "/admin/properties" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Builders", href: "/admin/builders" },
  { label: "Areas", href: "/admin/areas" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Tour Requests", href: "/admin/tours" },
  { label: "CRM", href: "/admin/crm" },
  { label: "Deal of the Week", href: "/admin/deals" },
  // Two testimonial surfaces on purpose: reels and written quotes are
  // different content with different forms, so they get different screens
  // rather than one tab-switching page that is half-disabled either way.
  { label: "Testimonials", href: "/admin/testimonials" },
  { label: "Written Quotes", href: "/admin/text-testimonials" },
  { label: "Services", href: "/admin/services" },
  { label: "Subscribers", href: "/admin/subscribers" },
  { label: "Settings", href: "/admin/settings" },
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
    <div className="min-h-screen md:flex">
      <AdminSidebar companyName={COMPANY.name} nav={NAV} />
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
