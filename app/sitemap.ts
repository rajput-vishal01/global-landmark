import type { MetadataRoute } from "next";
import { listPropertySlugs, listProjectSlugs, listBuilderSlugs } from "@/lib/db/queries";
import { SITE_URL } from "@/lib/seo";

// Evaluated per request, not at build — Docker builds have no database, and
// property slugs must always reflect the live portfolio.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, projectSlugs, builderSlugs] = await Promise.all([
    listPropertySlugs(),
    listProjectSlugs(),
    listBuilderSlugs(),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/properties`, changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((row) => ({
      url: `${SITE_URL}/properties/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...projectSlugs.map((row) => ({
      url: `${SITE_URL}/projects/${row.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...builderSlugs.map((row) => ({
      url: `${SITE_URL}/builders/${row.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/news`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    // Sellers searching "sell my flat in Zirakpur" are the whole point of
    // this page, so it is worth more than the contact page to a crawler.
    { url: `${SITE_URL}/sell`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.6 },
    // Low priority, but present: a reachable privacy policy is a condition of
    // the WhatsApp Business Platform, and a crawler finding it is one more
    // signal that the business is what it says it is.
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/data-deletion`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
