import type { Metadata } from "next";
import { COMPANY } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s | ${COMPANY.name} Admin` },
  robots: { index: false, follow: false },
};

// Admin is always live data — never prerendered or cached.
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-cream">{children}</div>;
}
