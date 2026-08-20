"use server";

import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { builders, projects } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slugify";
import type { DeleteState } from "../properties/actions";

export type BuilderFormState = { error?: string };

/** `formData.get(...)` → trimmed string capped at `max`, or null when empty. */
function textField(formData: FormData, key: string, max: number): string | null {
  return String(formData.get(key) ?? "").trim().slice(0, max) || null;
}

function parseBuilder(formData: FormData) {
  return {
    belongsTo: textField(formData, "belongsTo", 200),
    about: textField(formData, "about", 2000),
    website: textField(formData, "website", 300),
    logoUrl: textField(formData, "logoUrl", 500),
    contactName: textField(formData, "contactName", 200),
    contactPhone: textField(formData, "contactPhone", 30),
    pastProjects: textField(formData, "pastProjects", 2000),
    priceAppreciation: textField(formData, "priceAppreciation", 2000),
  };
}

export async function createBuilder(
  _prev: BuilderFormState,
  formData: FormData
): Promise<BuilderFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) return { error: "A name is required." };

  try {
    // Fallback mirrors createProject: a symbols-only name slugifies to ""
    // and would collide on the unique index.
    const slug = slugify(name) || `builder-${Date.now()}`;
    await db.insert(builders).values({ name, slug, ...parseBuilder(formData) });
  } catch (err) {
    console.error("createBuilder failed:", err);
    return { error: "Could not save — a builder with that name may already exist." };
  }
  revalidatePublicSite();
  redirect("/admin/builders");
}

export async function updateBuilder(
  _prev: BuilderFormState,
  formData: FormData
): Promise<BuilderFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing builder id." };
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) return { error: "A name is required." };

  try {
    const slug = slugify(name) || `builder-${Date.now()}`;
    await db
      .update(builders)
      .set({ name, slug, ...parseBuilder(formData) })
      .where(eq(builders.id, id));
  } catch (err) {
    console.error("updateBuilder failed:", err);
    return { error: "Could not save — a builder with that name may already exist." };
  }
  revalidatePublicSite();
  redirect("/admin/builders");
}

export async function deleteBuilder(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing builder id." };

  try {
    // Projects keep existing (builder_id set null at the DB level) — but the
    // UX should still warn before an admin loses the link, same guard shape
    // as deleteProject.
    const [{ n }] = await db
      .select({ n: count() })
      .from(projects)
      .where(eq(projects.builderId, id));
    if (n > 0) {
      return {
        error: `${n} project${n === 1 ? "" : "s"} still reference this builder. Reassign them first.`,
      };
    }
    await db.delete(builders).where(eq(builders.id, id));
  } catch (err) {
    console.error("deleteBuilder failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/builders");
}
