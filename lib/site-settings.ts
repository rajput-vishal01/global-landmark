import { unstable_cache } from "next/cache";
import { db } from "./db";
import { siteSettings } from "./db/schema";
import { COMPANY, CREDIBILITY } from "./data";
import { SITE_DATA_TAG } from "./db/queries";

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

/** Every row, keyed — used by both the admin form (uncached, always fresh) and the cached public helpers below. */
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

// ─── Public, cached reads — merged with lib/data.ts's static defaults ──────
// Same tag as lib/db/queries.ts's public reads, so an admin save (which
// calls revalidatePublicSite()) busts both in one pass.

const getContactOverrideCached = unstable_cache(getContactOverride, ["contactOverride"], {
  revalidate: 3600,
  tags: [SITE_DATA_TAG],
});

const getCredibilityOverrideCached = unstable_cache(
  getCredibilityOverride,
  ["credibilityOverride"],
  { revalidate: 3600, tags: [SITE_DATA_TAG] }
);

/** COMPANY merged with any saved override — undefined/missing fields fall through to the static default. */
export async function resolveCompany(): Promise<typeof COMPANY> {
  const override = await getContactOverrideCached();
  if (!override) return COMPANY;
  return {
    ...COMPANY,
    addressLines: override.addressLines?.length ? override.addressLines : COMPANY.addressLines,
    phone: override.phone ?? COMPANY.phone,
    phoneHref: override.phoneHref ?? COMPANY.phoneHref,
    phoneAlt: override.phoneAlt ?? COMPANY.phoneAlt,
    phoneAltHref: override.phoneAltHref ?? COMPANY.phoneAltHref,
    email: override.email ?? COMPANY.email,
    socials: override.socials?.length ? override.socials : COMPANY.socials,
  };
}

/** CREDIBILITY merged with any saved override. */
export async function resolveCredibility(): Promise<typeof CREDIBILITY> {
  const override = await getCredibilityOverrideCached();
  if (!override) return CREDIBILITY;
  return {
    ...CREDIBILITY,
    headingPre: override.headingPre ?? CREDIBILITY.headingPre,
    headingHighlight: override.headingHighlight ?? CREDIBILITY.headingHighlight,
    headingPost: override.headingPost ?? CREDIBILITY.headingPost,
    sub: override.sub ?? CREDIBILITY.sub,
    stats: override.stats?.length ? override.stats : CREDIBILITY.stats,
  };
}
