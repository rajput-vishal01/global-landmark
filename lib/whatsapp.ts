import { COMPANY } from "@/lib/data";
import { formatIndianShort } from "@/lib/attributes";

// Env override for launch; falls back to the agency's real primary number
// from lib/data.ts — never a fake placeholder that could message a stranger.
const NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || COMPANY.phoneHref.replace(/\D/g, "");

export function whatsAppHref(message = "Hi"): string {
  return `https://wa.me/${NUMBER}?text=${encodeURIComponent(message)}`;
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
