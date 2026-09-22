"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, properties, towers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slugify";
import { placeFromAddress } from "@/lib/locations";
import {
  isAllowedImageUrl,
  parseAmenities,
  parseChoice,
  parseList,
  parseMapsUrl,
} from "@/lib/admin/property-parse";
import { AREA_UNITS, LEGAL_FLAGS, LOAN_FLAGS, POSSESSION_STATUSES } from "@/lib/attributes";
import type { DeleteState } from "../properties/actions";
import { textField, intField, idField } from "@/lib/admin/form-fields";

export type ProjectFormState = { error?: string };



function date(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  // Native <input type="date"> already emits yyyy-mm-dd or nothing.
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

/**
 * Every field the project form sends, minus the name (each caller handles
 * the slug). Fields the form no longer asks — builder link, price
 * appreciation, country, sector — are not returned, so an update leaves
 * whatever they hold alone. City and locality come from the address, and
 * only when it names a city, the same rule a property follows.
 */
function parseSharedFields(
  formData: FormData
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const mapsUrl = parseMapsUrl(formData.get("mapsUrl"));
  if (mapsUrl === "invalid") {
    return {
      ok: false,
      error: "The map link must be a Google Maps link. In Google Maps press Share, then Copy link, and paste that.",
    };
  }
  const coverImage = textField(formData, "coverImage", 2000);
  if (coverImage && !isAllowedImageUrl(coverImage)) {
    return { ok: false, error: "Upload the cover photo instead of pasting a link to it." };
  }
  const address = textField(formData, "address", 300);
  const place = address ? placeFromAddress(address) : null;
  const list = (name: string, allowed: readonly string[] | null) =>
    parseList(String(formData.get(name) ?? "[]"), allowed, 60) ?? [];

  return {
    ok: true,
    data: {
      builderName: textField(formData, "builderName", 200),
      description: textField(formData, "description", 2000),
      possessionStatus: parseChoice(formData.get("possessionStatus"), POSSESSION_STATUSES),
      launchDate: date(formData, "launchDate"),
      possessionDate: date(formData, "possessionDate"),
      totalTowers: intField(formData, "totalTowers", 500),
      totalUnits: intField(formData, "totalUnits", 50_000),
      numberOfFloors: intField(formData, "numberOfFloors", 500),
      greenAreaValue: intField(formData, "greenAreaValue", 10_000_000),
      greenAreaUnit: parseChoice(formData.get("greenAreaUnit"), AREA_UNITS.map((u) => u.value)),
      amenities: parseAmenities(String(formData.get("amenitiesJson") ?? "[]")) ?? [],
      address,
      mapsUrl,
      coverImage,
      legalFlags: list("legalFlagsJson", LEGAL_FLAGS),
      reraNumber: textField(formData, "reraNumber", 100),
      loanFlags: list("loanFlagsJson", LOAN_FLAGS),
      banksOnPanel: list("banksOnPanelJson", null),
      ...(place ? { city: place.city, locality: place.locality } : {}),
    },
  };
}

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  const name = textField(formData, "name", 200);
  if (!name) return { error: "A name is required." };

  const parsed = parseSharedFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    const slug = slugify(name) || `project-${Date.now()}`;
    await db.insert(projects).values({ name, slug, ...parsed.data });
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
  const id = idField(formData);
  if (id === null) return { error: "Missing project id." };
  const name = textField(formData, "name", 200);
  if (!name) return { error: "A name is required." };

  const parsed = parseSharedFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    const [current] = await db.select({ name: projects.name, slug: projects.slug }).from(projects).where(eq(projects.id, id));
    if (!current) return { error: "This project no longer exists." };
    // Only regenerate the slug when the name actually changed — a stable
    // slug means a bookmarked/shared project URL keeps working.
    const slug = name === current.name ? current.slug : slugify(name) || current.slug;
    await db.update(projects).set({ name, slug, ...parsed.data }).where(eq(projects.id, id));
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
  const id = idField(formData);
  if (id === null) return { error: "Missing project id." };

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
export type TowerFormState = { error?: string };

/**
 * Adds a tower from the inline form on a project page.
 *
 * Returns a state rather than redirecting. It used to catch a failed insert,
 * log it, and redirect back to the project exactly as if it had worked, and a
 * whitespace-only name (which passes the browser's `required`) bounced back
 * the same way with no message. Both now come back as an error the form
 * shows, with what the broker typed still in place.
 */
export async function createTower(
  _prev: TowerFormState,
  formData: FormData
): Promise<TowerFormState> {
  await requireAdmin();
  const projectId = idField(formData, "projectId");
  if (projectId === null) return { error: "Missing project id." };
  const name = textField(formData, "name", 200);
  if (!name) return { error: "Give the tower a name." };

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
    console.error("createTower failed:", err);
    return { error: "Could not add the tower. Try again." };
  }
  revalidatePath(`/admin/projects/${projectId}`);
  return {};
}

export async function deleteTower(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = idField(formData);
  if (id === null) return { error: "Missing tower id." };

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
