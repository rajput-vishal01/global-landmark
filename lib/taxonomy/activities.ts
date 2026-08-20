/** CRM activity kinds (R-30) — call, site visit, note, WhatsApp, email. */
export const ACTIVITY_KINDS = ["Call", "Site Visit", "Note", "WhatsApp", "Email"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
