import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { fileBlobs } from "@/lib/db/schema";

/**
 * Server-only file storage, backed by Postgres.
 *
 * Uploads come through our own server (never browser-direct to a third
 * party), get validated here, and are stored as bytes in `file_blobs`.
 * Nothing touches the filesystem: on Vercel a runtime write does not
 * survive the invocation, so the database is the only durable store the
 * app already has.
 */

/** What the admin may upload as property imagery. */
export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** Legal documents (R-29) — private, admin-gated on the way back out. */
export const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

/**
 * 8 MB. Comfortably fits a full-resolution property photo off a phone or a
 * DSLR export, and small enough that a single request cannot pin a serverless
 * function's memory. Raise deliberately — every byte here is a byte in the
 * database and in every backup of it.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type StoredFile = {
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type StoreResult =
  | { ok: true; file: StoredFile }
  | { ok: false; error: string };

/** Public URL for an image blob. Same-origin, so next/image needs no allowlist. */
export function imageUrl(storageKey: string): string {
  return `/api/images/${storageKey}`;
}

/** Admin-gated URL for a document blob. Never rendered on a public page. */
export function documentUrl(storageKey: string): string {
  return `/api/admin/documents/${storageKey}`;
}

/** True for a URL this app serves itself, as opposed to an external one. */
export function isLocalImageUrl(url: string): boolean {
  return /^\/api\/images\/[a-f0-9]{64}$/.test(url);
}

/** The storage key inside one of our own image URLs, or null. */
export function storageKeyFromUrl(url: string): string | null {
  const m = url.match(/^\/api\/images\/([a-f0-9]{64})$/);
  return m ? m[1] : null;
}

/**
 * Validates and stores an uploaded file, returning its key and URL.
 *
 * Re-uploading identical bytes is a no-op that returns the existing row:
 * the key is the content hash, so the same file cannot occupy two rows.
 */
export async function storeFile(
  file: File,
  kind: "image" | "document"
): Promise<StoreResult> {
  const allowed = kind === "image" ? IMAGE_MIME_TYPES : DOCUMENT_MIME_TYPES;

  if (!allowed.has(file.type)) {
    return {
      ok: false,
      error: `Unsupported file type "${file.type || "unknown"}". Allowed: ${[...allowed].join(", ")}.`,
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: "File is empty." };
  }

  const data = Buffer.from(await file.arrayBuffer());

  // Trust the bytes, not the declared type: a client can claim any MIME.
  if (kind === "image" && !looksLikeImage(data)) {
    return { ok: false, error: "That file is not a valid image." };
  }

  const storageKey = createHash("sha256").update(data).digest("hex");
  const isPrivate = kind === "document";

  await db
    .insert(fileBlobs)
    .values({
      storageKey,
      mimeType: file.type,
      sizeBytes: data.byteLength,
      data,
      isPrivate,
    })
    // Same bytes already stored. Nothing to update — the row is immutable
    // by construction, since the key IS the content.
    .onConflictDoNothing({ target: fileBlobs.storageKey });

  return {
    ok: true,
    file: {
      storageKey,
      url: isPrivate ? documentUrl(storageKey) : imageUrl(storageKey),
      mimeType: file.type,
      sizeBytes: data.byteLength,
    },
  };
}

/**
 * Magic-number check for the formats we accept. A declared image/png that
 * is really a script would otherwise be stored and served back with an
 * image content type.
 */
function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return true;
  // RIFF....WEBP
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP")
    return true;
  // AVIF is an ISO-BMFF file: ....ftyp
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") return true;
  return false;
}

/** Reads a blob for serving. Returns null when missing. */
export async function readBlob(storageKey: string) {
  const [row] = await db
    .select({
      data: fileBlobs.data,
      mimeType: fileBlobs.mimeType,
      sizeBytes: fileBlobs.sizeBytes,
      isPrivate: fileBlobs.isPrivate,
    })
    .from(fileBlobs)
    .where(eq(fileBlobs.storageKey, storageKey));
  return row ?? null;
}

/**
 * Removes blobs by key. Unlike the Cloudinary path this replaced, a failure
 * here cannot orphan a remote asset — the bytes live in the same database
 * as the row that points at them, so both go or neither does.
 */
export async function deleteBlobs(storageKeys: string[]): Promise<void> {
  if (!storageKeys.length) return;
  await db.delete(fileBlobs).where(inArray(fileBlobs.storageKey, storageKeys));
}
