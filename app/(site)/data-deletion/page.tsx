import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { dataDeletion } from "@/lib/legal";
import { resolveCompany } from "@/lib/site-settings";
import { COMPANY } from "@/lib/data";
import { canonical, OG_DEFAULTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: dataDeletion(COMPANY).title,
  description: dataDeletion(COMPANY).description,
  alternates: { canonical: "/data-deletion" },
  openGraph: {
    ...OG_DEFAULTS,
    type: "website",
    title: dataDeletion(COMPANY).title,
    description: dataDeletion(COMPANY).description,
    url: canonical("/data-deletion"),
  },
  twitter: {
    card: "summary_large_image",
    title: dataDeletion(COMPANY).title,
    description: dataDeletion(COMPANY).description,
  },
};

export default async function DataDeletionPage() {
  // The resolved company, not the static one: an address set through
  // Admin -> Settings has to reach this page too, or the footer and the
  // policy would disagree about where the business is — which is exactly
  // the mismatch Meta's verification rejects on.
  const company = await resolveCompany();
  return <LegalPage doc={dataDeletion(company)} path="/data-deletion" />;
}
