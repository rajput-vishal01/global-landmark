/**
 * Lead lifecycle vocabulary (R-32). Admin-only — leads never reach the
 * public site.
 *
 * "converted" is a status value only: it does NOT create a `crm_client`
 * record. That table doesn't exist yet (Phase 6 — CRM & Brokerage). Wiring a
 * real "convert to CRM client" action is out of scope here; this just lets a
 * lead be marked converted so the inbox reflects reality in the meantime.
 */
export const LEAD_STATUSES = ["new", "contacted", "converted", "dropped"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_BADGE: Record<LeadStatus, string> = {
  new: "border-gold bg-gold/10 text-gold-deep",
  contacted: "border-ink-muted/40 bg-ink/5 text-ink-muted",
  converted: "border-gold-deep/40 bg-gold-deep/10 text-gold-deep",
  dropped: "border-error/40 bg-error/5 text-error",
};

export const isLeadStatus = (v: string): v is LeadStatus =>
  (LEAD_STATUSES as readonly string[]).includes(v);
