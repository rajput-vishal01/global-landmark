import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin/auth";
import { COMPANY } from "@/lib/data";
import { LogoutButton } from "../LogoutButton";

const NAV = [
  { label: "Properties", href: "/admin/properties" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Deals", href: "/admin/deals" },
  { label: "Testimonials", href: "/admin/testimonials" },
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
          <nav className="flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-eyebrow font-sans font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </>
  );
}
