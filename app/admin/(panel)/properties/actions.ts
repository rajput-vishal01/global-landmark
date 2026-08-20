"use server";

import { redirect } from "next/navigation";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  properties,
  propertyDocuments,
  propertyImages,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { deleteStoredFiles, isLocalImageUrl, storageKeyFromUrl } from "@/lib/storage";
import { isCategory } from "@/lib/categories";
import {
  ADDED_BY,
  AREA_UNITS,
  FACINGS,
  FURNISHINGS,
  LISTING_STATUSES,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  PUBLICATION_STATES,
  refCode as buildRefCode,
} from "@/lib/attributes";
import { CITY_NAMES, isLocalityIn } from "@/lib/locations";
import { slugify } from "@/lib/slugify";

export type PropertyFormState = { error?: string };

type ParsedImage = { url: string; storageKey: string | null; alt: string };

const MAX_IMAGES = 20;

// Must stay in sync with images.remotePatterns in next.config.ts — a stored
// URL from any other host makes next/image throw at render and takes the
// public pages down with it, so reject it here at the entry point.
//
// Uploaded images are same-origin (/api/images/<sha256>) and need no host
// entry at all; this list only covers the remaining stock photography,
// which goes away when the client's own images land.
const IMAGE_HOSTS = new Set(["images.unsplash.com"]);

function isAllowedImageUrl(url: string): boolean {
  if (isLocalImageUrl(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && IMAGE_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

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
    const { url, alt } = item as Record<string, unknown>;
    if (typeof url !== "string" || !isAllowedImageUrl(url)) return null;
    images.push({
      url: url.slice(0, 1000),
      // Derived from the URL, never taken from the client: a forged key
      // would otherwise let a save delete an unrelated blob. External URLs
      // yield null and are never deleted from storage.
      storageKey: storageKeyFromUrl(url),
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
  publicationState: string;
  listingStatus: string;
  addedBy: string;
  sourceName: string | null;
  city: string | null;
  locality: string | null;
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
  if (images === null) {
    return {
      ok: false,
      error:
        "Image list is invalid — upload files, or paste an images.unsplash.com URL.",
    };
  }
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

  const city = parseChoice(formData.get("city"), CITY_NAMES);
  const locality = String(formData.get("locality") ?? "").trim().slice(0, 120) || null;

  return {
    ok: true,
    data: {
      title,
      // CFF group 1 — internal. Unknown values fall back to the safe
      // default rather than failing the save: a broker mid-call should not
      // lose a listing to a malformed select.
      publicationState:
        parseChoice(formData.get("publicationState"), PUBLICATION_STATES) ?? "draft",
      listingStatus:
        parseChoice(formData.get("listingStatus"), LISTING_STATUSES) ?? "Available",
      addedBy: parseChoice(formData.get("addedBy"), ADDED_BY) ?? "Global Landmark",
      sourceName:
        String(formData.get("sourceName") ?? "").trim().slice(0, 200) || null,
      city,
      // A locality is only meaningful under its own city — keeping one that
      // belongs to a different city would put the listing under the wrong
      // filter tab.
      locality: city && locality && isLocalityIn(city, locality) ? locality : null,
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

/**
 * First free slug of the form `base`, `base-2`, `base-3`, ...
 *
 * Only the rows that could actually collide are read — `slug = base OR slug
 * LIKE 'base-%'` — instead of the whole table. The old version selected every
 * property on every save, which was invisible at six listings and becomes a
 * full scan per keystroke-batch once the form autosaves every ~20 seconds
 * against a real portfolio (GAP-01).
 *
 * The LIKE pattern is escaped: slugify() cannot emit `%` or `_` today, but
 * this function should not silently depend on that.
 */
async function uniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title) || "property";
  const pattern = `${base.replace(/[%_\\]/g, "\\$&")}-%`;
  const existing = await db
    .select({ id: properties.id, slug: properties.slug })
    .from(properties)
    .where(or(eq(properties.slug, base), ilike(properties.slug, pattern)));

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
      // Ref code is assigned from the row id, inside the same transaction:
      // the id is already unique and monotonic, so two brokers saving at the
      // same moment cannot collide the way a count(*)+1 sequence would. It
      // is set once here and never rewritten, so it survives a later city
      // change and is never reused after a delete.
      await tx
        .update(properties)
        .set({ refCode: buildRefCode(fields.city, new Date().getFullYear(), row.id) })
        .where(eq(properties.id, row.id));
      await tx.insert(propertyImages).values(
        images.map((img, i) => ({ ...img, propertyId: row.id, sortOrder: i }))
      );
    });
  } catch (err) {
    console.error("createProperty failed:", err);
    return { error: "Could not save the property. Check the fields and try again." };
  }
  revalidatePublicSite();
  redirect("/admin/properties");
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
      .select({ storageKey: propertyImages.storageKey })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id));
    const keep = new Set(images.map((img) => img.storageKey).filter(Boolean));
    removed = existing
      .map((row) => row.storageKey)
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

  // Replaced files go only after the DB commit, so a failure here can leave
  // an orphaned file on disk (logged) but can never leave the live site
  // pointing at bytes that are already gone.
  try {
    await deleteStoredFiles(removed);
  } catch (err) {
    console.error("updateProperty: replaced image files not removed:", removed, err);
  }
  revalidatePublicSite();
  redirect("/admin/properties");
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
      .select({ storageKey: propertyImages.storageKey })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id));
    const imageKeys = images
      .map((row) => row.storageKey)
      .filter((key): key is string => Boolean(key));

    // Legal documents live under private/ and were previously left on disk
    // forever: the cascade removed their rows, so nothing pointed at the
    // files any more and nothing knew to sweep them. Leaving a client's
    // registry papers on the server after their listing is gone is the one
    // kind of orphan that actually matters.
    const documents = await db
      .select({ storageKey: propertyDocuments.storageKey })
      .from(propertyDocuments)
      .where(eq(propertyDocuments.propertyId, id));
    const documentKeys = documents.map((row) => row.storageKey);

    // Rows first, then files. An unreferenced file on disk is harmless and
    // sweepable; a row pointing at a file that is already gone renders a
    // broken image on the live site.
    await db.delete(properties).where(eq(properties.id, id));
    await deleteStoredFiles(imageKeys, "public");
    await deleteStoredFiles(documentKeys, "private");
  } catch (err) {
    console.error("deleteProperty failed:", err);
    return { error: "Delete failed. Try again." };
  }
  revalidatePublicSite();
  redirect("/admin/properties");
}
