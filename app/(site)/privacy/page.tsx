import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { privacyPolicy } from "@/lib/legal";
import { resolveCompany } from "@/lib/site-settings";
import { COMPANY } from "@/lib/data";
import { canonical, OG_DEFAULTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: privacyPolicy(COMPANY).title,
  description: privacyPolicy(COMPANY).description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    ...OG_DEFAULTS,
    type: "website",
    title: privacyPolicy(COMPANY).title,
    description: privacyPolicy(COMPANY).description,
    url: canonical("/privacy"),
  },
  twitter: {
    card: "summary_large_image",
    title: privacyPolicy(COMPANY).title,
    description: privacyPolicy(COMPANY).description,
  },
};

export default async function PrivacyPage() {
  // The resolved company, not the static one: an address set through
  // Admin -> Settings has to reach this page too, or the footer and the
  // policy would disagree about where the business is — which is exactly
  // the mismatch Meta's verification rejects on.
  const company = await resolveCompany();
  return <LegalPage doc={privacyPolicy(company)} path="/privacy" />;
}
