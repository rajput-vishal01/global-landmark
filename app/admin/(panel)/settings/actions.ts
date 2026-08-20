"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { SETTING_KEYS, type ContactOverride, type CredibilityOverride } from "@/lib/site-settings";

export type SettingsFormState = { error?: string };

function str(formData: FormData, key: string, max: number): string | undefined {
  const v = String(formData.get(key) ?? "").trim().slice(0, max);
  return v || undefined;
}

function num(formData: FormData, key: string): number {
  const v = Number(String(formData.get(key) ?? "").trim());
  return Number.isFinite(v) ? v : 0;
}

async function upsertSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(siteSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}

export async function saveContactSettings(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const addressLines = str(formData, "addressLines", 500)
    ?.split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const value: ContactOverride = {
    addressLines,
    phone: str(formData, "phone", 40),
    phoneHref: str(formData, "phoneHref", 40),
    phoneAlt: str(formData, "phoneAlt", 40),
    phoneAltHref: str(formData, "phoneAltHref", 40),
    email: str(formData, "email", 200),
    officeHours: str(formData, "officeHours", 200),
    socials: [
      { label: "Instagram", href: str(formData, "socialInstagram", 300) ?? "#" },
      { label: "X", href: str(formData, "socialX", 300) ?? "#" },
      { label: "LinkedIn", href: str(formData, "socialLinkedin", 300) ?? "#" },
      { label: "YouTube", href: str(formData, "socialYoutube", 300) ?? "#" },
      { label: "Facebook", href: str(formData, "socialFacebook", 300) ?? "#" },
    ].filter((s) => s.href !== "#"),
  };

  try {
    await upsertSetting(SETTING_KEYS.contact, value);
  } catch (err) {
    console.error("saveContactSettings failed:", err);
    return { error: "Could not save. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/settings");
}

export async function saveCredibilitySettings(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const stats = [1, 2, 3].map((i) => ({
    value: num(formData, `stat${i}Value`),
    prefix: str(formData, `stat${i}Prefix`, 10) ?? "",
    suffix: str(formData, `stat${i}Suffix`, 10) ?? "",
    label: str(formData, `stat${i}Label`, 100) ?? "",
  }));

  const value: CredibilityOverride = {
    headingPre: str(formData, "headingPre", 60),
    headingHighlight: str(formData, "headingHighlight", 60),
    headingPost: str(formData, "headingPost", 60),
    sub: str(formData, "sub", 300),
    stats: stats.some((s) => s.label) ? stats : undefined,
  };

  try {
    await upsertSetting(SETTING_KEYS.credibility, value);
  } catch (err) {
    console.error("saveCredibilitySettings failed:", err);
    return { error: "Could not save. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/settings");
}
