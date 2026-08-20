import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin/auth";
import { COMPANY } from "@/lib/data";
import { LogoutButton } from "../LogoutButton";

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
const NAV: { label: string; href: string | null }[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Properties", href: "/admin/properties" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Builders", href: null },
  { label: "Leads", href: null },
  { label: "Deal of the Week", href: "/admin/deals" },
  { label: "Testimonials", href: "/admin/testimonials" },
];

const NAV_ITEM =
  "text-eyebrow font-sans font-medium uppercase tracking-[0.18em] transition-colors";

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
    <>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/admin" className="flex items-baseline gap-3">
            <span className="font-serif text-lg uppercase tracking-[0.18em] text-ink">
              {COMPANY.name}
            </span>
            <span className="text-eyebrow font-sans font-medium uppercase tracking-[0.3em] text-gold-deep">
              Admin
            </span>
          </Link>
          {/* Wraps rather than overflows: seven items do not fit on one line
              at 360px, and the panel is used on a phone at site visits. */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {NAV.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${NAV_ITEM} text-ink-muted hover:text-ink`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  aria-disabled="true"
                  title="Not built yet"
                  className={`${NAV_ITEM} cursor-default text-ink-muted/40`}
                >
                  {item.label}
                </span>
              )
            )}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </>
  );
}
