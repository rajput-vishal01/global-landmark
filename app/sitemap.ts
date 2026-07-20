import type { MetadataRoute } from "next";
import { listPropertySlugs } from "@/lib/db/queries";
import { SITE_URL } from "@/lib/seo";

// Evaluated per request, not at build — Docker builds have no database, and
// property slugs must always reflect the live portfolio.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listPropertySlugs();

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/properties`, changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((row) => ({
      url: `${SITE_URL}/properties/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/news`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.6 },
  ];
}
