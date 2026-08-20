import { db } from "./db";
import { siteSettings } from "./db/schema";

/**
 * Admin-editable overrides for company details and stats (R-36) — so
 * changing a phone number or a headline stat is not a code deploy.
 * `lib/data.ts`'s COMPANY/CREDIBILITY/WHATSAPP objects remain the
 * fallback default; nothing here replaces that file, it only lets an
 * admin override specific keys of it at runtime.
 *
 * ponytail: a fixed, typed set of keys rather than a free-form settings
 * table — the client's own §11 follow-up list names exactly which fields
 * they'll eventually confirm (address, phones, socials, RERA, stats), so
 * an open-ended key/value editor would just be UI for fields nobody asked
 * to add. Extend SETTING_KEYS when a new one is actually needed.
 */

export type ContactOverride = {
  addressLines?: string[];
  phone?: string;
  phoneHref?: string;
  phoneAlt?: string;
  phoneAltHref?: string;
  email?: string;
  officeHours?: string;
  socials?: { label: string; href: string }[];
};

export type CredibilityStat = { value: number; prefix: string; suffix: string; label: string };

export type CredibilityOverride = {
  headingPre?: string;
  headingHighlight?: string;
  headingPost?: string;
  sub?: string;
  stats?: CredibilityStat[];
};

export const SETTING_KEYS = {
  contact: "company_contact",
  credibility: "credibility",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/** Every row, keyed — admin reads use this directly; public reads should go through a small per-key helper once wired into lib/data.ts's consumers. */
export async function getAllSiteSettings(): Promise<Record<string, unknown>> {
  try {
    const rows = await db.select().from(siteSettings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch (err) {
    console.error("getAllSiteSettings failed:", err);
    return {};
  }
}

export async function getContactOverride(): Promise<ContactOverride | null> {
  const all = await getAllSiteSettings();
  return (all[SETTING_KEYS.contact] as ContactOverride) ?? null;
}

export async function getCredibilityOverride(): Promise<CredibilityOverride | null> {
  const all = await getAllSiteSettings();
  return (all[SETTING_KEYS.credibility] as CredibilityOverride) ?? null;
}
