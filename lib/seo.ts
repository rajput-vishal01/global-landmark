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
    legalName: COMPANY.legalName,
    url: SITE_URL,
    email: COMPANY.email,
    telephone: COMPANY.phone,
    areaServed: COMPANY.markets,
    // No foundingDate. Schema.org offers the field and the certificate has
    // the date, but the client does not want a founding year published, and
    // structured data is published — Google reads it into the knowledge
    // panel, which is the most visible place it could end up.
    //
    // The MSME registration, as an identifier a machine can read rather
    // than only a line of footer text.
    identifier: {
      "@type": "PropertyValue",
      name: "Udyam Registration Number",
      value: COMPANY.udyam,
    },
    address: {
      "@type": "PostalAddress",
      // Built from COMPANY.addressLines rather than retyped, which is how
      // this drifted from the certificate the first time. The office is in
      // Zirakpur, Punjab — the old "Panchkula, Haryana" came from the road
      // name and was wrong. Last line is locality/district/state/PIN, which
      // the fields below carry, so only the first two make up the street.
      streetAddress: COMPANY.addressLines.slice(0, 2).join(", "),
      addressLocality: "Zirakpur",
      addressRegion: "Punjab",
      postalCode: "160104",
      addressCountry: "IN",
    },
    sameAs: COMPANY.socials
      .map((s) => s.href)
      .filter((href) => href.startsWith("http")),
  };
}
