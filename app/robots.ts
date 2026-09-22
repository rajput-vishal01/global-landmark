import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Property photos are served from /api/images/, so that one API path
      // stays open: the longer rule wins, and without it the listing photos
      // and the images in each page's JSON-LD were blocked from crawlers.
      allow: ["/", "/api/images/"],
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
