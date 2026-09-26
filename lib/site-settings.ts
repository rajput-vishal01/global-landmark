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

/** Every row, keyed. Throws on a DB failure — callers choose their fallback. */
async function readSettings(): Promise<Record<string, unknown>> {
  const rows = await db.select().from(siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** The admin form's read: uncached, always fresh, empty on failure. */
async function getAllSiteSettings(): Promise<Record<string, unknown>> {
  try {
    return await readSettings();
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
//
// One cached read of the whole (tiny) table, and it THROWS on failure: the
// old version caught inside the cache, so one DB blip was stored as "no
// settings" for an hour and the site showed the code defaults the whole
// time. unstable_cache never stores a thrown error; the fallback is taken
// out here, per render, instead. It also used to read the table twice, once
// per key.
const readSettingsCached = unstable_cache(readSettings, ["siteSettings"], {
  revalidate: 3600,
  tags: [SITE_DATA_TAG],
});

async function cachedSetting<T>(key: string): Promise<T | null> {
  try {
    return ((await readSettingsCached())[key] as T) ?? null;
  } catch (err) {
    console.error(`site setting "${key}" unavailable, using defaults:`, err);
    return null;
  }
}

/** COMPANY merged with any saved override — undefined/missing fields fall through to the static default. */
export async function resolveCompany(): Promise<typeof COMPANY> {
  const override = await cachedSetting<ContactOverride>(SETTING_KEYS.contact);
  if (!override) return COMPANY;
  return {
    ...COMPANY,
    addressLines: override.addressLines?.length ? override.addressLines : COMPANY.addressLines,
    phone: override.phone ?? COMPANY.phone,
    phoneHref: override.phoneHref ?? COMPANY.phoneHref,
    phoneAlt: override.phoneAlt ?? COMPANY.phoneAlt,
    phoneAltHref: override.phoneAltHref ?? COMPANY.phoneAltHref,
    email: override.email ?? COMPANY.email,
    // Saved in Settings all along, but never applied — the site had no
    // hours line to put it on. The footer and contact page show it now.
    officeHours: override.officeHours ?? COMPANY.officeHours,
    socials: mergeSocials(override.socials),
  };
}

/**
 * Per network, not all-or-nothing: a saved Instagram link used to replace
 * the whole list, so a profile added in code (YouTube) never showed on a
 * site whose settings had been saved once.
 */
function mergeSocials(saved: ContactOverride["socials"]): typeof COMPANY.socials {
  if (!saved?.length) return COMPANY.socials;
  const byLabel = new Map(saved.map((s) => [s.label, s.href]));
  const known = new Set(COMPANY.socials.map((s) => s.label));
  return [
    ...COMPANY.socials.map((s) => ({ label: s.label, href: byLabel.get(s.label) ?? s.href })),
    ...saved.filter((s) => !known.has(s.label)),
  ];
}

/** CREDIBILITY merged with any saved override. */
export async function resolveCredibility(): Promise<typeof CREDIBILITY> {
  const override = await cachedSetting<CredibilityOverride>(SETTING_KEYS.credibility);
  if (!override) return CREDIBILITY;
  return {
    ...CREDIBILITY,
    headingPre: override.headingPre ?? CREDIBILITY.headingPre,
    headingHighlight: override.headingHighlight ?? CREDIBILITY.headingHighlight,
    headingPost: override.headingPost ?? CREDIBILITY.headingPost,
    sub: override.sub ?? CREDIBILITY.sub,
  };
}
