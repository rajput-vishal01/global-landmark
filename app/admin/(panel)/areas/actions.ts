"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { areas } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import {
  isAllowedImageUrl,
  parseBool,
  parseChoice,
  parseOptionalInt,
} from "@/lib/admin/property-parse";
import { deleteStoredFiles, storageKeyFromUrl } from "@/lib/storage";
import { CITY_NAMES, isLocalityIn } from "@/lib/locations";
import { slugify } from "@/lib/slugify";
import type { DeleteState } from "../properties/actions";
import { textField } from "@/lib/admin/form-fields";

export type AreaFormState = { error?: string };

type AreaFields = {
  city: string | null;
  matchCity: string | null;
  matchLocality: string | null;
  coverImage: string | null;
  coverImageKey: string | null;
  blurb: string | null;
  sortOrder: number;
  isPublished: boolean;
};

/**
 * Everything except the name, which the callers validate because it also
 * produces the slug.
 *
 * City and the two match values are checked against lib/locations rather
 * than trusted: they are compared against `properties.city` / `.locality` at
 * read time, so a value outside that taxonomy can never match a listing and
 * would produce a landing page that is silently, permanently empty. A
 * locality belonging to another city is dropped for the same reason, the
 * same way the property form drops it.
 *
 * The cover image key is derived from the URL, never taken from the client:
 * a forged key would otherwise let a save delete an unrelated file.
 */
function parseArea(formData: FormData): { error: string } | { fields: AreaFields } {
  const matchCity = parseChoice(formData.get("matchCity"), CITY_NAMES);
  const matchLocalityRaw = String(formData.get("matchLocality") ?? "").trim();

  const coverImage = textField(formData, "coverImage", 1000);
  if (coverImage && !isAllowedImageUrl(coverImage)) {
    return { error: "That cover image URL is not from an allowed host." };
  }

  const sortOrder = parseOptionalInt(formData.get("sortOrder"));
  if (sortOrder === "invalid") {
    return { error: "Sort order must be a whole number, zero or more." };
  }

  return {
    fields: {
      city: parseChoice(formData.get("city"), CITY_NAMES),
      matchCity,
      matchLocality:
        matchLocalityRaw && isLocalityIn(matchCity, matchLocalityRaw)
          ? matchLocalityRaw
          : null,
      coverImage,
      coverImageKey: coverImage ? storageKeyFromUrl(coverImage) : null,
      blurb: textField(formData, "blurb", 1000),
      sortOrder: sortOrder ?? 0,
      isPublished: parseBool(formData, "isPublished"),
    },
  };
}

export async function createArea(
  _prev: AreaFormState,
  formData: FormData
): Promise<AreaFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!name) return { error: "A name is required." };

  const parsed = parseArea(formData);
  if ("error" in parsed) return parsed;

  try {
    // Fallback mirrors createBuilder: a symbols-only name slugifies to ""
    // and would collide on the unique index.
    const slug = slugify(name) || `area-${Date.now()}`;
    await db.insert(areas).values({ name, slug, ...parsed.fields });
  } catch (err) {
    console.error("createArea failed:", err);
    return { error: "Could not save — an area with that name may already exist." };
  }
  revalidatePublicSite();
  redirect("/admin/areas");
}

export async function updateArea(
  _prev: AreaFormState,
  formData: FormData
): Promise<AreaFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing area id." };
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!name) return { error: "A name is required." };

  const parsed = parseArea(formData);
  if ("error" in parsed) return parsed;

  let replacedKey: string | null = null;
  try {
    const existing = await db.query.areas.findFirst({
      columns: { coverImageKey: true },
      where: eq(areas.id, id),
    });
    const slug = slugify(name) || `area-${Date.now()}`;
    await db
      .update(areas)
      .set({ name, slug, ...parsed.fields, updatedAt: new Date() })
      .where(eq(areas.id, id));
    if (existing?.coverImageKey && existing.coverImageKey !== parsed.fields.coverImageKey) {
      replacedKey = existing.coverImageKey;
    }
  } catch (err) {
    console.error("updateArea failed:", err);
    return { error: "Could not save — an area with that name may already exist." };
  }

  // Only after the commit, so a failure here leaves an orphaned file
  // (logged) rather than a live page pointing at bytes already gone.
  if (replacedKey) {
    try {
      await deleteStoredFiles([replacedKey], "public");
    } catch (err) {
      console.error("updateArea: replaced cover not removed:", replacedKey, err);
    }
  }

  revalidatePublicSite();
  redirect("/admin/areas");
}

export async function deleteArea(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing area id." };

  let coverKey: string | null = null;
  try {
    const existing = await db.query.areas.findFirst({
      columns: { coverImageKey: true },
      where: eq(areas.id, id),
    });
    coverKey = existing?.coverImageKey ?? null;
    // Nothing to reassign first, unlike a builder: a listing is claimed by
    // its own address, never by a stored link to this row.
    await db.delete(areas).where(eq(areas.id, id));
  } catch (err) {
    console.error("deleteArea failed:", err);
    return { error: "Delete failed. Try again." };
  }

  if (coverKey) {
    try {
      await deleteStoredFiles([coverKey], "public");
    } catch (err) {
      console.error("deleteArea: cover file not removed:", coverKey, err);
    }
  }

  revalidatePublicSite();
  redirect("/admin/areas");
}
