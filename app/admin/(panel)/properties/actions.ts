"use server";

import { redirect } from "next/navigation";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  properties,
  propertyCharges,
  propertyDocuments,
  propertyImages,
  propertyInternal,
  propertyMedia,
  propertyOwners,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/session";
import { revalidatePublicSite } from "@/lib/admin/revalidate";
import { deleteStoredFiles } from "@/lib/storage";
import { refCode as buildRefCode } from "@/lib/attributes";
import { parseProperty, type ParseMode } from "@/lib/admin/property-parse";
import { slugify } from "@/lib/slugify";

export type PropertyFormState = { error?: string };

/**
 * A listing saved as a draft is validated leniently: everything present is
 * still checked and unknown values are still dropped, but the required
 * fields are not enforced. Publishing is where the listing has to be
 * complete — which is the only moment it is visible to anyone.
 */
function modeFor(formData: FormData): ParseMode {
  return formData.get("publicationState") === "published" ? "publish" : "draft";
}

/**
 * Writes the 1:N and 1:1 tables that hang off a property.
 *
 * Replace-in-place rather than diff-and-merge: these are small lists the
 * admin edits as a whole, and a diff would need stable row ids the form does
 * not carry. Everything runs inside the caller's transaction, so a failure
 * halfway leaves neither the row nor its children changed.
 *
 * Note the asymmetry with images: images own files on disk, so their old
 * rows are compared and orphaned files swept. Owners, charges and media own
 * nothing outside the database and can simply be replaced.
 */
async function writeChildTables(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  propertyId: number,
  data: {
    owners: { name: string; [k: string]: unknown }[];
    charges: { chargeType: string; [k: string]: unknown }[];
    media: { kind: string; url: string; label: string }[];
    circleRate: number | null;
  }
) {
  await tx.delete(propertyOwners).where(eq(propertyOwners.propertyId, propertyId));
  if (data.owners.length) {
    await tx.insert(propertyOwners).values(
      data.owners.map((o) => ({ ...o, propertyId })) as typeof propertyOwners.$inferInsert[]
    );
  }

  await tx.delete(propertyCharges).where(eq(propertyCharges.propertyId, propertyId));
  if (data.charges.length) {
    await tx.insert(propertyCharges).values(
      data.charges.map((c) => ({ ...c, propertyId })) as typeof propertyCharges.$inferInsert[]
    );
  }

  await tx.delete(propertyMedia).where(eq(propertyMedia.propertyId, propertyId));
  if (data.media.length) {
    await tx.insert(propertyMedia).values(
      data.media.map((m, i) => ({ ...m, propertyId, sortOrder: i }))
    );
  }

  // property_internal is 1:1 and internal always — circle rate lives here
  // and on no public table, so no public query can reach it.
  await tx
    .insert(propertyInternal)
    .values({ propertyId, circleRate: data.circleRate })
    .onConflictDoUpdate({
      target: propertyInternal.propertyId,
      set: { circleRate: data.circleRate },
    });
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
  const parsed = parseProperty(formData, modeFor(formData));
  if (!parsed.ok) return { error: parsed.error };
  const {
    images,
    projectName,
    owners,
    charges,
    media,
    documents,
    circleRate,
    ...fields
  } = parsed.data;

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
      if (images.length) {
        await tx.insert(propertyImages).values(
          images.map((img, i) => ({ ...img, propertyId: row.id, sortOrder: i }))
        );
      }
      // A new property has no prior document rows, so every uploaded file
      // is kept — nothing to diff against, unlike the update path below.
      if (documents.length) {
        await tx.insert(propertyDocuments).values(
          documents.map((d) => ({ ...d, propertyId: row.id }))
        );
      }
      await writeChildTables(tx, row.id, { owners, charges, media, circleRate });
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
  const parsed = parseProperty(formData, modeFor(formData));
  if (!parsed.ok) return { error: parsed.error };
  const {
    images,
    projectName,
    owners,
    charges,
    media,
    documents,
    circleRate,
    ...fields
  } = parsed.data;

  let removedImages: string[] = [];
  let removedDocuments: string[] = [];
  try {
    const existingImages = await db
      .select({ storageKey: propertyImages.storageKey })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id));
    const keepImages = new Set(images.map((img) => img.storageKey).filter(Boolean));
    removedImages = existingImages
      .map((row) => row.storageKey)
      .filter((key): key is string => Boolean(key) && !keepImages.has(key));

    // Documents own files on disk the same way images do — unlike owners,
    // charges and media, which are DB-only and can simply be replaced in
    // writeChildTables(). A document dropped from the form must have its
    // private file swept, and one still present must not be touched.
    const existingDocuments = await db
      .select({ storageKey: propertyDocuments.storageKey })
      .from(propertyDocuments)
      .where(eq(propertyDocuments.propertyId, id));
    const keepDocuments = new Set(documents.map((d) => d.storageKey));
    removedDocuments = existingDocuments
      .map((row) => row.storageKey)
      .filter((key) => !keepDocuments.has(key));

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

      await tx.delete(propertyDocuments).where(eq(propertyDocuments.propertyId, id));
      if (documents.length) {
        await tx.insert(propertyDocuments).values(
          documents.map((d) => ({ ...d, propertyId: id }))
        );
      }

      // Previously missing entirely: an edit to an existing property never
      // wrote owners, charges, media or the circle rate — every save of an
      // existing listing silently dropped them. This is the fix.
      await writeChildTables(tx, id, { owners, charges, media, circleRate });
    });
  } catch (err) {
    console.error("updateProperty failed:", err);
    return { error: "Could not update the property. Try again." };
  }

  // Replaced files go only after the DB commit, so a failure here can leave
  // an orphaned file on disk (logged) but can never leave the live site
  // pointing at bytes that are already gone.
  try {
    await deleteStoredFiles(removedImages, "public");
  } catch (err) {
    console.error("updateProperty: replaced image files not removed:", removedImages, err);
  }
  try {
    await deleteStoredFiles(removedDocuments, "private");
  } catch (err) {
    console.error(
      "updateProperty: replaced document files not removed:",
      removedDocuments,
      err
    );
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
