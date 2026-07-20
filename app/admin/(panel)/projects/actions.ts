"use server";

import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, properties } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slugify";
import type { DeleteState } from "../properties/actions";

export type ProjectFormState = { error?: string };

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  if (!name) return { error: "A name is required." };
  const description =
    String(formData.get("description") ?? "").trim().slice(0, 2000) || null;

  try {
    await db.insert(projects).values({ name, slug: slugify(name), description });
  } catch (err) {
    console.error("createProject failed:", err);
    return { error: "Could not save — a project with that name may already exist." };
  }
  revalidatePublicSite();
  redirect("/projects");
}

export async function deleteProject(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing project id." };

  try {
    // Properties keep existing (project_id set null) — deleting a society
    // must never silently delete its listings.
    const [{ n }] = await db
      .select({ n: count() })
      .from(properties)
      .where(eq(properties.projectId, id));
    if (n > 0) {
      return {
        error: `${n} propert${n === 1 ? "y" : "ies"} still reference this project. Reassign them first.`,
      };
    }
    await db.delete(projects).where(eq(projects.id, id));
  } catch (err) {
    console.error("deleteProject failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/projects");
}
