"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { SERVICE_ICON_KEYS } from "@/components/service-icons";
import type { DeleteState } from "../properties/actions";
import { textField } from "@/lib/admin/form-fields";

export type ServiceFormState = { error?: string };

const ICON_KEYS: ReadonlySet<string> = new Set(SERVICE_ICON_KEYS);

/** `formData.get(...)` → trimmed string capped at `max`, or null when empty. */

/**
 * A link is rendered into next/link's href, so `javascript:` typed here
 * would execute on a public page. Only a site-relative path or an explicit
 * http(s) URL survives; anything else is dropped and the card renders as
 * plain text instead of a link.
 */
function linkField(formData: FormData): string | null {
  const href = textField(formData, "href", 300);
  if (!href) return null;
  return /^\/(?!\/)/.test(href) || /^https?:\/\//i.test(href) ? href : null;
}

function parseService(formData: FormData) {
  const icon = textField(formData, "icon", 50);
  const sortOrder = Number(formData.get("sortOrder"));
  return {
    description: textField(formData, "description", 1000),
    // Unknown key → null, which renders the fallback mark rather than a hole.
    icon: icon && ICON_KEYS.has(icon) ? icon : null,
    href: linkField(formData),
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    isPublished: formData.get("isPublished") === "on",
  };
}

export async function createService(
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return { error: "A title is required." };

  try {
    await db.insert(services).values({ title, ...parseService(formData) });
  } catch (err) {
    console.error("createService failed:", err);
    return { error: "Could not save the service. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/services");
}

export async function updateService(
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing service id." };
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return { error: "A title is required." };

  try {
    await db
      .update(services)
      .set({ title, ...parseService(formData) })
      .where(eq(services.id, id));
  } catch (err) {
    console.error("updateService failed:", err);
    return { error: "Could not save the service. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/services");
}

export async function deleteService(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing service id." };

  try {
    await db.delete(services).where(eq(services.id, id));
  } catch (err) {
    console.error("deleteService failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/services");
}
