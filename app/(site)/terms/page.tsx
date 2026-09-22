import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { termsOfUse } from "@/lib/legal";
import { resolveCompany } from "@/lib/site-settings";
import { COMPANY } from "@/lib/data";
import { canonical, OG_DEFAULTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: termsOfUse(COMPANY).title,
  description: termsOfUse(COMPANY).description,
  alternates: { canonical: "/terms" },
  openGraph: {
    ...OG_DEFAULTS,
    type: "website",
    title: termsOfUse(COMPANY).title,
    description: termsOfUse(COMPANY).description,
    url: canonical("/terms"),
  },
  twitter: {
    card: "summary_large_image",
    title: termsOfUse(COMPANY).title,
    description: termsOfUse(COMPANY).description,
  },
};

export default async function TermsPage() {
  // The resolved company, not the static one: an address set through
  // Admin -> Settings has to reach this page too, or the footer and the
  // policy would disagree about where the business is — which is exactly
  // the mismatch Meta's verification rejects on.
  const company = await resolveCompany();
  return <LegalPage doc={termsOfUse(company)} path="/terms" />;
}
