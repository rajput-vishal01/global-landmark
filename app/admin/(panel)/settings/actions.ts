"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { SETTING_KEYS, type ContactOverride, type CredibilityOverride } from "@/lib/site-settings";
import { textField } from "@/lib/admin/form-fields";

export type SettingsFormState = { error?: string };


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

  // ContactOverride's fields are optional, not nullable: an absent key
  // falls through to the lib/data.ts default, whereas an explicit null
  // would override the default with nothing.
  const opt = (key: string, max: number) => textField(formData, key, max) ?? undefined;

  const value: ContactOverride = {
    addressLines: opt("addressLines", 500)
      ?.split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    phone: opt("phone", 40),
    phoneHref: opt("phoneHref", 40),
    phoneAlt: opt("phoneAlt", 40),
    phoneAltHref: opt("phoneAltHref", 40),
    email: opt("email", 200),
    officeHours: opt("officeHours", 200),
    socials: [
      { label: "Instagram", href: opt("socialInstagram", 300) ?? "#" },
      { label: "X", href: opt("socialX", 300) ?? "#" },
      { label: "LinkedIn", href: opt("socialLinkedin", 300) ?? "#" },
      { label: "YouTube", href: opt("socialYoutube", 300) ?? "#" },
      { label: "Facebook", href: opt("socialFacebook", 300) ?? "#" },
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

  const value: CredibilityOverride = {
    headingPre: textField(formData, "headingPre", 60) ?? undefined,
    headingHighlight: textField(formData, "headingHighlight", 60) ?? undefined,
    headingPost: textField(formData, "headingPost", 60) ?? undefined,
    sub: textField(formData, "sub", 300) ?? undefined,
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
