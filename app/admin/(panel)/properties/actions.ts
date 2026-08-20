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
  towers,
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
/** A fresh shallow copy with `keys` dropped — the original is untouched. */
function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const copy: Partial<T> = { ...obj };
  for (const k of keys) delete copy[k];
  return copy as Omit<T, K>;
}

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
 * Draft-mode project lookup — existing project only, never creates one.
 * Autosave fires every ~20s while a broker is still typing; if it created a
 * project the same way a real save does, typing "Green" character by
 * character would leave a project literally called "Green" in the database
 * twenty seconds later, before the broker finishes "Green Lotus Saksham".
 */
async function resolveExistingProjectId(name: string): Promise<number | null> {
  if (!name) return null;
  const existing = await db
    .select({ id: projects.id })
    .from(projects)
    .where(sql`lower(${projects.name}) = ${name.toLowerCase()}`);
  return existing[0]?.id ?? null;
}

/**
 * Find a tower by name (case-insensitive) scoped to `projectId`, or create
 * it. Scoped because "Tower A" is a common name — without the project scope
 * a second, unrelated project's "Tower A" would collide with the first.
 * No project selected means no tower can be attached.
 */
async function resolveTowerId(
  projectId: number | null,
  name: string
): Promise<number | null> {
  if (!projectId || !name) return null;
  const existing = await db
    .select({ id: towers.id })
    .from(towers)
    .where(sql`${towers.projectId} = ${projectId} and lower(${towers.name}) = ${name.toLowerCase()}`);
  if (existing.length) return existing[0].id;
  const [row] = await db
    .insert(towers)
    .values({ projectId, name })
    .returning({ id: towers.id });
  return row.id;
}

/** Autosave variant — existing tower only, never creates (see resolveExistingProjectId). */
async function resolveExistingTowerId(
  projectId: number | null,
  name: string
): Promise<number | null> {
  if (!projectId || !name) return null;
  const existing = await db
    .select({ id: towers.id })
    .from(towers)
    .where(sql`${towers.projectId} = ${projectId} and lower(${towers.name}) = ${name.toLowerCase()}`);
  return existing[0]?.id ?? null;
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

  // Autosave (saveDraft) may already have inserted this listing as a draft
  // before the broker ever clicks "Create property" — the form's hidden id
  // field gets written the moment that first tick succeeds. Without this
  // check, clicking the visible submit button after autosave has already
  // fired would insert a SECOND row and leave the autosaved one orphaned as
  // an untitled duplicate. Forward to the same update path updateProperty
  // uses whenever the id turns out to name a real row.
  const existingId = Number(formData.get("id"));
  if (Number.isInteger(existingId) && existingId > 0) {
    const [row] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, existingId));
    if (row) return updateProperty(_prev, formData);
  }

  const parsed = parseProperty(formData, modeFor(formData));
  if (!parsed.ok) return { error: parsed.error };
  const {
    images,
    projectName,
    towerName,
    owners,
    charges,
    media,
    documents,
    circleRate,
    ...fields
  } = parsed.data;

  try {
    const projectId = await resolveProjectId(projectName);
    const towerId = await resolveTowerId(projectId, towerName);
    const slug = await uniqueSlug(fields.title);
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(properties)
        .values({ ...fields, projectId, towerId, slug })
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
    towerName,
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
    const towerId = await resolveTowerId(projectId, towerName);
    const slug = await uniqueSlug(fields.title, id);
    await db.transaction(async (tx) => {
      await tx
        .update(properties)
        .set({ ...fields, projectId, towerId, slug, updatedAt: new Date() })
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

export type SaveDraftState =
  | { ok: true; id: number; savedAt: string }
  | { ok: false; error: string };

/**
 * Autosave, fired from the client every ~20s while the form is dirty (§4.5).
 * A half-entered listing mid-call is normal; this exists so a dropped
 * connection does not lose it.
 *
 * Three things keep autosave from doing more than a broker asked for:
 *
 * 1. It NEVER writes publicationState or listingStatus. A new row lands at
 *    the schema default (draft); an existing row keeps whatever state it
 *    already has. Autosave firing every 20s must not be able to publish a
 *    draft, and must not be able to quietly unpublish a live listing just
 *    because the form re-submitted its current (published) values — those
 *    two fields are simply never part of what this action writes.
 * 2. The project lookup never creates — see resolveExistingProjectId above.
 * 3. revalidatePublicSite() fires only when the row is ALREADY published.
 *    A draft is never public, so revalidating on every autosave tick would
 *    churn the public cache for nothing; an already-live listing being
 *    autosaved (a broker editing a published property) should still reflect
 *    on the public site without waiting for an explicit "Save changes".
 *
 * updatedAt DOES move on every autosave tick. That is a real edit — the
 * broker is actively working the listing — and "Last updated" should say
 * so. This is worth a note for Phase 6: the "not updated in 30+ days" stale-
 * listing tile there will measure recent attention, not necessarily a
 * meaningful content change, which is the correct trade for what that tile
 * is for (finding listings nobody has looked at).
 */
export async function saveDraft(formData: FormData): Promise<SaveDraftState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    // Nothing worth persisting yet — not an error, just nothing to do.
    return { ok: false, error: "Add a title before autosave can save." };
  }

  const parsed = parseProperty(formData, "draft");
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const {
    images,
    projectName,
    towerName,
    owners,
    charges,
    media,
    documents,
    circleRate,
    ...fields
  } = parsed.data;

  const idRaw = formData.get("id");
  const existingId =
    typeof idRaw === "string" && idRaw && Number.isInteger(Number(idRaw))
      ? Number(idRaw)
      : null;

  try {
    const projectId = await resolveExistingProjectId(projectName);
    const towerId = await resolveExistingTowerId(projectId, towerName);
    const now = new Date();

    if (existingId) {
      const [current] = await db
        .select({ publicationState: properties.publicationState })
        .from(properties)
        .where(eq(properties.id, existingId));
      if (!current) return { ok: false, error: "This listing no longer exists." };

      // Documents own a private file on disk, the same way images own a
      // public one — a document dropped from the vault mid-edit needs its
      // file swept, and one still present must not be touched. Computed
      // before the transaction so the sweep can run only after it commits.
      const existingDocs = await db
        .select({ storageKey: propertyDocuments.storageKey })
        .from(propertyDocuments)
        .where(eq(propertyDocuments.propertyId, existingId));
      const keepDocs = new Set(documents.map((d) => d.storageKey));
      const removedDocs = existingDocs
        .map((row) => row.storageKey)
        .filter((key) => !keepDocs.has(key));

      const slug = await uniqueSlug(fields.title, existingId);
      await db.transaction(async (tx) => {
        await tx
          .update(properties)
          .set({ ...fields, projectId, towerId, slug, updatedAt: now })
          .where(eq(properties.id, existingId));
        if (images.length) {
          await tx
            .delete(propertyImages)
            .where(eq(propertyImages.propertyId, existingId));
          await tx.insert(propertyImages).values(
            images.map((img, i) => ({ ...img, propertyId: existingId, sortOrder: i }))
          );
        }
        await tx
          .delete(propertyDocuments)
          .where(eq(propertyDocuments.propertyId, existingId));
        if (documents.length) {
          await tx.insert(propertyDocuments).values(
            documents.map((d) => ({ ...d, propertyId: existingId }))
          );
        }
        await writeChildTables(tx, existingId, { owners, charges, media, circleRate });
      });

      if (removedDocs.length) {
        try {
          await deleteStoredFiles(removedDocs, "private");
        } catch (err) {
          console.error("saveDraft: removed document files not swept:", removedDocs, err);
        }
      }

      if (current.publicationState === "published") revalidatePublicSite();
      return { ok: true, id: existingId, savedAt: now.toISOString() };
    }

    // First autosave tick for a brand-new listing — insert once, then every
    // later tick in this session updates the same row via existingId above.
    const slug = await uniqueSlug(fields.title);
    let newId = 0;
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(properties)
        .values({ ...fields, projectId, towerId, slug })
        .returning({ id: properties.id });
      newId = row.id;
      await tx
        .update(properties)
        .set({ refCode: buildRefCode(fields.city, now.getFullYear(), row.id) })
        .where(eq(properties.id, row.id));
      if (images.length) {
        await tx.insert(propertyImages).values(
          images.map((img, i) => ({ ...img, propertyId: row.id, sortOrder: i }))
        );
      }
      // Nothing existed before this row, so every document is new — no
      // diff needed, unlike the existing-row branch above.
      if (documents.length) {
        await tx.insert(propertyDocuments).values(
          documents.map((d) => ({ ...d, propertyId: row.id }))
        );
      }
      await writeChildTables(tx, row.id, { owners, charges, media, circleRate });
    });
    // A brand-new row is always draft (the schema default) — never public,
    // so no revalidation is needed here.
    return { ok: true, id: newId, savedAt: now.toISOString() };
  } catch (err) {
    console.error("saveDraft failed:", err);
    return { ok: false, error: "Autosave failed. Your work is still in this tab." };
  }
}

/**
 * "Duplicate unit" (R-12): clones everything shared by every unit in the
 * same tower/project, leaving only the per-unit specifics — floor, unit
 * number, area, price and status — for the admin to fill in. A plain form
 * action rather than the `(prevState, formData)` shape the rest of this file
 * uses, so it can be called directly from `<form action={duplicateProperty}>`
 * in a table row with no client wrapper.
 *
 * Owners, charges and media are copied: in the common case this clones a
 * builder's own unsold tower inventory, where the same seller and the same
 * society-wide charges/links genuinely apply to every unit. Images and legal
 * documents are deliberately NOT copied — a photo or a sale deed belongs to
 * one specific flat, and copying the row would misrepresent which unit it
 * actually documents.
 */
export async function duplicateProperty(formData: FormData): Promise<void> {
  await requireAdmin();
  const sourceId = Number(formData.get("id"));
  if (!Number.isInteger(sourceId)) {
    redirect("/admin/properties");
  }

  // redirect() throws a control-flow signal Next.js relies on — it must
  // never land inside the try/catch below, or a legitimate "not found" exit
  // would get logged as a failure and redirected twice.
  const [source] = await db.select().from(properties).where(eq(properties.id, sourceId));
  if (!source) {
    redirect("/admin/properties");
  }

  let newId: number;
  try {
    const [sourceOwners, sourceCharges, sourceMedia, sourceInternalRows] =
      await Promise.all([
        db.select().from(propertyOwners).where(eq(propertyOwners.propertyId, sourceId)),
        db.select().from(propertyCharges).where(eq(propertyCharges.propertyId, sourceId)),
        db.select().from(propertyMedia).where(eq(propertyMedia.propertyId, sourceId)),
        db.select().from(propertyInternal).where(eq(propertyInternal.propertyId, sourceId)),
      ]);

    const shared = omit(source, [
      "id",
      "slug",
      "refCode",
      "title",
      "floorNumber",
      "unitNumber",
      "areaValue",
      "plotArea",
      "builtUpArea",
      "superArea",
      "carpetArea",
      "areaSqft",
      "demandPrice",
      "perSqftRate",
      "publicationState",
      "listingStatus",
      "createdAt",
      "updatedAt",
    ]);

    const slug = await uniqueSlug(`${source.title} copy`);

    newId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(properties)
        .values({
          ...shared,
          title: `${source.title} (copy)`,
          slug,
          publicationState: "draft",
          listingStatus: "Available",
        })
        .returning({ id: properties.id });

      await tx
        .update(properties)
        .set({ refCode: buildRefCode(shared.city, new Date().getFullYear(), row.id) })
        .where(eq(properties.id, row.id));

      await writeChildTables(tx, row.id, {
        owners: sourceOwners.map((o) => omit(o, ["id", "propertyId", "createdAt"])),
        charges: sourceCharges.map((c) => omit(c, ["id", "propertyId"])),
        media: sourceMedia.map((m) => omit(m, ["id", "propertyId", "sortOrder"])),
        circleRate: sourceInternalRows[0]?.circleRate ?? null,
      });

      return row.id;
    });
  } catch (err) {
    console.error("duplicateProperty failed:", err);
    redirect("/admin/properties");
  }
  redirect(`/admin/properties/${newId}/edit`);
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
