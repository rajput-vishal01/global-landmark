import { COMPANY } from "@/lib/data";
import { formatIndianShort } from "@/lib/attributes";

/**
 * Chat link to the office. The number is, in order: the env override, the
 * primary phone from admin Settings (pass resolveCompany().phoneHref), and
 * the agency's real number in lib/data.ts — never a placeholder that could
 * message a stranger.
 */
export function whatsAppHref(message = "Hi", phoneHref: string = COMPANY.phoneHref): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || phoneHref.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Share-to-anyone (R-44). No recipient in the URL, so WhatsApp opens its own
 * contact picker — this is the visitor forwarding a listing to their spouse
 * or their broker, NOT messaging us. Sending these to `NUMBER` would silently
 * turn every share into an inbound enquiry.
 */
export function whatsAppShareHref(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export type ShareableProperty = {
  title: string;
  location: string;
  /** Pre-joined spec line, e.g. "3+1 BHK · 1,850 sq.ft · Ready to Move". */
  specs?: string | null;
  publicPrice: number | null;
  /** Absolute URL — a relative path is dead text inside a WhatsApp message. */
  url: string;
};

function priceLine(publicPrice: number | null): string {
  return publicPrice != null ? formatIndianShort(publicPrice) : "Price on request";
}

/** Single listing, as a broker would actually paste it into a chat. */
export function propertyShareMessage(property: ShareableProperty): string {
  return [
    property.title,
    property.location,
    property.specs || null,
    priceLine(property.publicPrice),
    "",
    property.url,
    `— ${COMPANY.legalName}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** The whole enquiry shortlist as one numbered message. */
export function shortlistShareMessage(properties: ShareableProperty[]): string {
  const heading = `${properties.length} ${
    properties.length === 1 ? "property" : "properties"
  } from ${COMPANY.legalName}:`;
  const entries = properties.map(
    (p, i) => `${i + 1}. ${p.title} — ${p.location} — ${priceLine(p.publicPrice)}\n${p.url}`
  );
  return [heading, "", ...entries].join("\n\n");
}
