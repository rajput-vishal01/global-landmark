import { resolveCompany } from "@/lib/site-settings";
import { COMPANY, SEO } from "@/lib/data";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Absolute canonical URL for a path (leading slash). */
export function canonical(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** The agency's JSON-LD node id, so a listing's `provider` points at the one entity. */
export const ORG_ID = canonical("/#organization");

/**
 * Spread first into every page's `openGraph`. Next merges metadata
 * shallowly, so a page that sets `openGraph` at all replaces the root
 * layout's whole object: every such page was being shared with no picture
 * and no site name. A page with its own photo sets `images` after the spread.
 */
export const OG_DEFAULTS = {
  siteName: COMPANY.legalName,
  locale: "en_IN",
  images: [{ url: SEO.ogImage, width: 1200, height: 630 }],
};

/**
 * The footer's address lines as a PostalAddress. The last line reads
 * "Town, District, State PIN" (see COMPANY.addressLines), so town, state and
 * PIN are read off it rather than retyped: an address changed in Settings
 * moves the structured data with it. A last line with no PIN is not guessed
 * at; the whole address becomes the street line.
 */
export function postalAddress(lines: string[]) {
  const last = lines.at(-1) ?? "";
  const pin = last.match(/\b\d{6}\b/)?.[0];
  if (!pin || lines.length < 2) {
    return { "@type": "PostalAddress", streetAddress: lines.join(", "), addressCountry: "IN" };
  }
  const [town, ...rest] = last.replace(pin, "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    "@type": "PostalAddress",
    streetAddress: lines.slice(0, -1).join(", "),
    addressLocality: town,
    ...(rest.length ? { addressRegion: rest.at(-1) } : {}),
    postalCode: pin,
    addressCountry: "IN",
  };
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
    "@id": ORG_ID,
    name: COMPANY.legalName,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: canonical("/logo.png"),
    image: canonical("/logo.png"),
    email: COMPANY.email,
    telephone: COMPANY.phone,
    areaServed: COMPANY.markets,
    // The office's own Google Maps listing, the same link as the footer's
    // "Get directions".
    hasMap: COMPANY.mapsUrl,
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
    // Built from the address lines rather than retyped, which is how this
    // drifted from the certificate the first time. The office is in
    // Zirakpur, Punjab — the old "Panchkula, Haryana" came from the road
    // name and was wrong.
    address: postalAddress(COMPANY.addressLines),
    sameAs: COMPANY.socials
      .map((s) => s.href)
      .filter((href) => href.startsWith("http")),
  };
}
