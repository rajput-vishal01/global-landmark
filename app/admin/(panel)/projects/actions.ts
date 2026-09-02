"use server";

import { redirect } from "next/navigation";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { builders, projects, properties, towers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slugify";
import { isLocalityIn } from "@/lib/locations";
import { parseAmenities } from "@/lib/admin/property-parse";
import type { DeleteState } from "../properties/actions";
import { textField, intField } from "@/lib/admin/form-fields";

export type ProjectFormState = { error?: string };



function date(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  // Native <input type="date"> already emits yyyy-mm-dd or nothing.
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

/**
 * Every field the project form can submit, minus name/slug which each
 * caller handles (create picks a fresh slug, update keeps the row's own
 * unless the name changed).
 */
async function parseSharedFields(formData: FormData) {
  const builderIdRaw = Number(formData.get("builderId"));
  const builderId = Number.isInteger(builderIdRaw) && builderIdRaw > 0 ? builderIdRaw : null;
  let builderName: string | null = null;
  if (builderId) {
    const [row] = await db.select({ name: builders.name }).from(builders).where(eq(builders.id, builderId));
    builderName = row?.name ?? null;
  }

  const city = textField(formData, "city", 120);
  const localityRaw = textField(formData, "locality", 200);
  const amenities = parseAmenities(String(formData.get("amenitiesJson") ?? "[]")) ?? [];

  return {
    builderId,
    builderName,
    description: textField(formData, "description", 2000),
    reraNumber: textField(formData, "reraNumber", 60),
    possessionStatus: textField(formData, "possessionStatus", 60),
    launchDate: date(formData, "launchDate"),
    possessionDate: date(formData, "possessionDate"),
    priceAppreciation: textField(formData, "priceAppreciation", 2000),
    totalTowers: intField(formData, "totalTowers", 500),
    totalUnits: intField(formData, "totalUnits", 50_000),
    numberOfFloors: intField(formData, "numberOfFloors", 500),
    greenAreaValue: intField(formData, "greenAreaValue", 10_000_000),
    greenAreaUnit: textField(formData, "greenAreaUnit", 20),
    amenities,
    country: textField(formData, "country", 60) ?? "India",
    city,
    // A locality is only meaningful under its own city — the same rule
    // LocationSection's property-side counterpart enforces.
    locality: city && localityRaw && isLocalityIn(city, localityRaw) ? localityRaw : null,
    sector: textField(formData, "sector", 120),
    coverImage: textField(formData, "coverImage", 2000),
  };
}

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  const name = textField(formData, "name", 200);
  if (!name) return { error: "A name is required." };

  const fields = await parseSharedFields(formData);

  try {
    const slug = slugify(name) || `project-${Date.now()}`;
    await db.insert(projects).values({ name, slug, ...fields });
  } catch (err) {
    console.error("createProject failed:", err);
    return { error: "Could not save — a project with that name may already exist." };
  }
  revalidatePublicSite();
  redirect("/admin/projects");
}

export async function updateProject(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing project id." };
  const name = textField(formData, "name", 200);
  if (!name) return { error: "A name is required." };

  const fields = await parseSharedFields(formData);

  try {
    const [current] = await db.select({ name: projects.name, slug: projects.slug }).from(projects).where(eq(projects.id, id));
    if (!current) return { error: "This project no longer exists." };
    // Only regenerate the slug when the name actually changed — a stable
    // slug means a bookmarked/shared project URL keeps working.
    const slug = name === current.name ? current.slug : slugify(name) || current.slug;
    await db.update(projects).set({ name, slug, ...fields }).where(eq(projects.id, id));
  } catch (err) {
    console.error("updateProject failed:", err);
    return { error: "Could not update — try again." };
  }
  revalidatePublicSite();
  redirect(`/admin/projects/${id}`);
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
  redirect("/admin/projects");
}

/**
 * Plain form action (not the `(prevState, formData)` shape) — called
 * directly from `<form action={createTower}>` on the pitch view with no
 * client wrapper, the same reasoning as `duplicateProperty`.
 */
export async function createTower(formData: FormData): Promise<void> {
  await requireAdmin();
  const projectId = Number(formData.get("projectId"));
  if (!Number.isInteger(projectId)) redirect("/admin/projects");
  const name = textField(formData, "name", 200);
  if (!name) redirect(`/admin/projects/${projectId}`);

  try {
    await db.insert(towers).values({
      projectId,
      name,
      totalFloors: intField(formData, "totalFloors", 500),
      unitsPerFloor: intField(formData, "unitsPerFloor", 500),
      totalUnits: intField(formData, "totalUnits", 50_000),
      notes: textField(formData, "notes", 2000),
    });
  } catch (err) {
    // Logged, not surfaced — matching duplicateProperty's fail-quiet
    // pattern for a low-stakes inline form (no unique constraint on tower
    // name to violate; this only guards a stale projectId or a DB hiccup).
    console.error("createTower failed:", err);
  }
  redirect(`/admin/projects/${projectId}`);
}

export async function deleteTower(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing tower id." };

  // Looked up rather than trusted from the form — DeleteButton only ever
  // submits `id`, and the tower's own row already knows which project to
  // return to.
  const [tower] = await db.select({ projectId: towers.projectId }).from(towers).where(eq(towers.id, id));
  if (!tower) return { error: "This tower no longer exists." };

  try {
    const [{ n }] = await db
      .select({ n: count() })
      .from(properties)
      .where(eq(properties.towerId, id));
    if (n > 0) {
      return {
        error: `${n} unit${n === 1 ? "" : "s"} still reference this tower. Reassign them first.`,
      };
    }
    await db.delete(towers).where(eq(towers.id, id));
  } catch (err) {
    console.error("deleteTower failed:", err);
    return { error: "Delete failed. Try again." };
  }
  redirect(`/admin/projects/${tower.projectId}`);
}

/** Builder options for the project form's selector, cheapest-first. */
export async function listBuildersForSelect(): Promise<{ id: number; name: string }[]> {
  try {
    return await db.select({ id: builders.id, name: builders.name }).from(builders).orderBy(sql`lower(${builders.name})`);
  } catch (err) {
    console.error("listBuildersForSelect failed:", err);
    return [];
  }
}
