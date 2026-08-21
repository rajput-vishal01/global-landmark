import { resolveCompany } from "@/lib/site-settings";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Absolute canonical URL for a path (leading slash). */
export function canonical(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Serializes a JSON-LD object for safe embedding in a <script> tag. Plain
 * JSON.stringify does NOT escape `</script>`, so admin-entered fields
 * (property title/description) could otherwise break out of the tag and
 * inject markup — escaping the HTML-significant characters prevents it.
 */
export function jsonLdHtml(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** BreadcrumbList JSON-LD — position in the site hierarchy for rich-result breadcrumbs. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

/** Organization / LocalBusiness JSON-LD for the whole site (R-36: contact details resolve through any admin override). */
export async function organizationJsonLd() {
  const COMPANY = await resolveCompany();
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: COMPANY.legalName,
    url: SITE_URL,
    email: COMPANY.email,
    telephone: COMPANY.phone,
    areaServed: COMPANY.markets,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Panchkula",
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
    sameAs: COMPANY.socials
      .map((s) => s.href)
      .filter((href) => href.startsWith("http")),
  };
}
