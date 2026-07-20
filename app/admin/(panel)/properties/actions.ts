"use server";

import { redirect } from "next/navigation";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, properties, propertyImages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import {
  deleteCloudinaryImages,
  isCloudinaryConfigured,
  signUpload,
  type UploadSignature,
} from "@/lib/cloudinary";
import { isCategory } from "@/lib/categories";
import {
  AREA_UNITS,
  FACINGS,
  FURNISHINGS,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/attributes";
import { slugify } from "@/lib/slugify";

export type PropertyFormState = { error?: string };

type ParsedImage = { url: string; publicId: string | null; alt: string };

const MAX_IMAGES = 20;

// Only ids inside our upload folder may reach the Cloudinary delete path —
// a forged publicId must never be able to delete arbitrary account assets.
const OWNED_PUBLIC_ID = /^global-landmark\/properties\//;

function parseImages(json: string): ParsedImage[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > MAX_IMAGES) return null;
  const images: ParsedImage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { url, publicId, alt } = item as Record<string, unknown>;
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) return null;
    const ownedId =
      typeof publicId === "string" && OWNED_PUBLIC_ID.test(publicId)
        ? publicId.slice(0, 300)
        : null; // treated as an external URL — never remote-deleted
    images.push({
      url: url.slice(0, 1000),
      publicId: ownedId,
      alt: typeof alt === "string" ? alt.slice(0, 300) : "",
    });
  }
  return images;
}

function parseOptionalInt(
  value: FormDataEntryValue | null
): number | null | "invalid" {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 100_000_000 ? n : "invalid";
}

/** Empty or unknown values become null — never a hard failure. */
function parseChoice(
  value: FormDataEntryValue | null,
  allowed: readonly string[]
): string | null {
  const s = String(value ?? "").trim();
  return s && allowed.includes(s) ? s : null;
}

function parseAmenities(json: string): string[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 40) return null;
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const value = item.trim().slice(0, 100);
    if (value) seen.add(value);
  }
  return [...seen];
}

function parseExtras(
  json: string
): { title: string; description: string }[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(raw) || raw.length > 20) return null;
  const extras: { title: string; description: string }[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { title, description } = item as Record<string, unknown>;
    if (typeof title !== "string" || typeof description !== "string") return null;
    const t = title.trim().slice(0, 120);
    const d = description.trim().slice(0, 1000);
    if (t) extras.push({ title: t, description: d });
  }
  return extras;
}

type ParsedProperty = {
  title: string;
  kind: "project" | "unit";
  category: "sale" | "purchase" | "lease" | "invest";
  projectName: string;
  description: string;
  location: string;
  propertyType: string | null;
  configuration: string | null;
  beds: number | null;
  baths: number | null;
  areaValue: number | null;
  areaUnit: string;
  facing: string | null;
  possessionStatus: string | null;
  furnishing: string | null;
  amenities: string[];
  extras: { title: string; description: string }[];
  images: ParsedImage[];
};

function parseProperty(formData: FormData):
  | { ok: true; data: ParsedProperty }
  | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return { ok: false, error: "A title is required." };

  const kind = String(formData.get("kind") ?? "unit");
  if (kind !== "project" && kind !== "unit") {
    return { ok: false, error: "Choose a valid listing type." };
  }

  const category = String(formData.get("category") ?? "");
  if (!isCategory(category)) {
    return { ok: false, error: "Choose a valid category." };
  }

  // Free text — an unknown name creates the project (never a hard constraint).
  const projectName = String(formData.get("projectName") ?? "").trim().slice(0, 200);

  const images = parseImages(String(formData.get("imagesJson") ?? "[]"));
  if (images === null) return { ok: false, error: "Image list is invalid." };
  if (!images.length) return { ok: false, error: "Add at least one image." };

  const beds = parseOptionalInt(formData.get("beds"));
  const baths = parseOptionalInt(formData.get("baths"));
  const areaValue = parseOptionalInt(formData.get("areaValue"));
  if (beds === "invalid" || baths === "invalid" || areaValue === "invalid") {
    return {
      ok: false,
      error: "Beds, baths, and area must be whole non-negative numbers.",
    };
  }

  const amenities = parseAmenities(String(formData.get("amenitiesJson") ?? "[]"));
  if (amenities === null) return { ok: false, error: "Amenity list is invalid." };

  const extras = parseExtras(String(formData.get("extrasJson") ?? "[]"));
  if (extras === null) return { ok: false, error: "Additional details are invalid." };

  return {
    ok: true,
    data: {
      title,
      kind,
      category,
      projectName,
      description: String(formData.get("description") ?? "").trim().slice(0, 10_000),
      location: String(formData.get("location") ?? "").trim().slice(0, 300),
      propertyType: parseChoice(formData.get("propertyType"), PROPERTY_TYPES),
      configuration: String(formData.get("configuration") ?? "").trim().slice(0, 100) || null,
      beds,
      baths,
      areaValue,
      areaUnit:
        parseChoice(formData.get("areaUnit"), AREA_UNITS.map((u) => u.value)) ?? "sqft",
      facing: parseChoice(formData.get("facing"), FACINGS),
      possessionStatus: parseChoice(formData.get("possessionStatus"), POSSESSION_STATUSES),
      furnishing: parseChoice(formData.get("furnishing"), FURNISHINGS),
      amenities,
      extras,
      images,
    },
  };
}

/** Find a project by name (case-insensitive) or create it. Empty = none. */
async function resolveProjectId(name: string): Promise<number | null> {
  if (!name) return null;
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(sql`lower(${projects.name}) = ${name.toLowerCase()}`);
  if (existing.length) return existing[0].id;
  try {
    const [row] = await db
      .insert(projects)
      .values({ name, slug: slugify(name) || `project-${Date.now()}` })
      .returning({ id: projects.id });
    return row.id;
  } catch {
    // Lost a race or slug collision — re-read by name, then by slug (a new
    // name can slugify to a taken slug; without this the association would
    // silently drop to null).
    const retry = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        or(
          sql`lower(${projects.name}) = ${name.toLowerCase()}`,
          eq(projects.slug, slugify(name))
        )
      );
    return retry[0]?.id ?? null;
  }
}

async function uniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title) || "property";
  const existing = await db
    .select({ id: properties.id, slug: properties.slug })
    .from(properties);
  const taken = new Set(
    existing.filter((row) => row.id !== excludeId).map((row) => row.slug)
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  }
}

export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireAdmin();
  const parsed = parseProperty(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { images, projectName, ...fields } = parsed.data;

  try {
    const projectId = await resolveProjectId(projectName);
    const slug = await uniqueSlug(fields.title);
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(properties)
        .values({ ...fields, projectId, slug })
        .returning({ id: properties.id });
      await tx.insert(propertyImages).values(
        images.map((img, i) => ({ ...img, propertyId: row.id, sortOrder: i }))
      );
    });
  } catch (err) {
    console.error("createProperty failed:", err);
    return { error: "Could not save the property. Check the fields and try again." };
  }
  revalidatePublicSite();
  redirect("/properties");
}

export async function updateProperty(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing property id." };
  const parsed = parseProperty(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { images, projectName, ...fields } = parsed.data;

  let removed: string[] = [];
  try {
    const existing = await db
      .select({ publicId: propertyImages.publicId })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id));
    const keep = new Set(images.map((img) => img.publicId).filter(Boolean));
    removed = existing
      .map((row) => row.publicId)
      .filter((pid): pid is string => Boolean(pid) && !keep.has(pid));

    const projectId = await resolveProjectId(projectName);
    const slug = await uniqueSlug(fields.title, id);
    await db.transaction(async (tx) => {
      await tx
        .update(properties)
        .set({ ...fields, projectId, slug, updatedAt: new Date() })
        .where(eq(properties.id, id));
      await tx.delete(propertyImages).where(eq(propertyImages.propertyId, id));
      await tx.insert(propertyImages).values(
        images.map((img, i) => ({ ...img, propertyId: id, sortOrder: i }))
      );
    });
  } catch (err) {
    console.error("updateProperty failed:", err);
    return { error: "Could not update the property. Try again." };
  }

  // Replaced assets are removed only after the DB commit — a remote failure
  // here can orphan a Cloudinary image (logged), but can never leave the
  // live site pointing at a deleted one.
  try {
    await deleteCloudinaryImages(removed);
  } catch (err) {
    console.error("updateProperty: replaced Cloudinary images not removed:", removed, err);
  }
  revalidatePublicSite();
  redirect("/properties");
}

export type DeleteState = { error?: string };

export async function deleteProperty(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Missing property id." };

  try {
    const images = await db
      .select({ publicId: propertyImages.publicId })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id));
    const publicIds = images
      .map((row) => row.publicId)
      .filter((pid): pid is string => Boolean(pid));

    // Cascade rule: Cloudinary assets go first; abort on failure so no
    // orphaned remote images can exist.
    await deleteCloudinaryImages(publicIds);
    await db.delete(properties).where(eq(properties.id, id));
  } catch (err) {
    console.error("deleteProperty failed:", err);
    return { error: "Delete failed — remote images were not removed. Try again." };
  }
  revalidatePublicSite();
  redirect("/properties");
}

/** Signed params for direct browser upload; null = paste-URL fallback mode. */
export async function getUploadSignature(): Promise<UploadSignature | null> {
  await requireAdmin();
  if (!isCloudinaryConfigured()) return null;
  return signUpload();
}
