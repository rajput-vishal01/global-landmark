import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Server-only file storage on the local filesystem.
 *
 * Uploads come through our own server (never browser-direct to a third
 * party), are validated here, and are written under UPLOAD_DIR. Nothing is
 * stored in the database except the URL that points here — image bytes do
 * not belong in Postgres backups.
 *
 * REQUIRES A PERSISTENT DISK. On a platform with an ephemeral filesystem
 * (Vercel, and most serverless hosts) anything written at runtime is gone by
 * the next invocation. Deploy this on the server that owns UPLOAD_DIR, and
 * mount it as a volume in Docker so image files survive a container rebuild.
 *
 * Layout:
 *   $UPLOAD_DIR/public/<ab>/<sha256>.<ext>    property imagery
 *   $UPLOAD_DIR/private/<ab>/<sha256>.<ext>   legal documents (R-29)
 *
 * Privacy is the directory, not a flag. The public route only ever resolves
 * paths under public/, so a document is unreachable from it by construction
 * rather than by remembering to check a boolean.
 *
 * The filename is the SHA-256 of the bytes: re-uploading the same file is a
 * no-op, the URL is safe to cache immutably because a name can never point
 * at different content, and nothing user-supplied reaches the path. Files
 * are sharded by the first two hex characters so no single directory ends up
 * with tens of thousands of entries.
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

/** Extension per accepted type. The extension is ours, never the client's. */
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Legal documents (R-29) — private, admin-gated on the way back out. */
const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** Reverse map for serving: extension decides Content-Type, not the request. */
const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
};

/**
 * 8 MB. Comfortably fits a full-resolution property photo off a phone or a
 * DSLR export. Raise deliberately.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** `<sha256>.<ext>` — the whole identity of a stored file. */
const KEY_PATTERN = /^[a-f0-9]{64}\.(jpg|png|webp|avif|pdf)$/;

export type StoredFile = {
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type StoreResult =
  | { ok: true; file: StoredFile }
  | { ok: false; error: string };

export function isStorageKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/** Public URL for an image. Same-origin, so next/image needs no allowlist. */
export function imageUrl(storageKey: string): string {
  return `/api/images/${storageKey}`;
}

/** Admin-gated URL for a document. Never rendered on a public page. */
export function documentUrl(storageKey: string): string {
  return `/api/admin/documents/${storageKey}`;
}

export function isLocalImageUrl(url: string): boolean {
  const key = url.startsWith("/api/images/") ? url.slice("/api/images/".length) : null;
  return key !== null && isStorageKey(key);
}

/** The storage key inside one of our own image URLs, or null. */
export function storageKeyFromUrl(url: string): string | null {
  return isLocalImageUrl(url) ? url.slice("/api/images/".length) : null;
}

export function mimeForKey(storageKey: string): string {
  return MIME_BY_EXT[storageKey.split(".").pop() ?? ""] ?? "application/octet-stream";
}

/**
 * Absolute path for a key, or null if the key is malformed.
 *
 * Every filesystem access goes through here. The key is validated against
 * KEY_PATTERN first — which admits only hex and one known extension, so it
 * cannot contain a separator or a `..` segment — and the resolved path is
 * then asserted to sit inside its own root. Two independent barriers,
 * because path traversal is the failure mode that matters here.
 */
export function resolveStoragePath(
  storageKey: string,
  visibility: "public" | "private"
): string | null {
  if (!isStorageKey(storageKey)) return null;
  const root = path.join(UPLOAD_DIR, visibility);
  const full = path.join(root, storageKey.slice(0, 2), storageKey);
  const resolved = path.resolve(full);
  if (resolved !== full || !resolved.startsWith(path.resolve(root) + path.sep)) {
    return null;
  }
  return resolved;
}

/**
 * Validates and writes an uploaded file, returning its key and URL.
 *
 * Writing the same bytes twice simply overwrites an identical file, so an
 * accidental re-upload costs nothing and cannot produce a second copy.
 */
export async function storeFile(
  file: File,
  kind: "image" | "document"
): Promise<StoreResult> {
  const allowed = kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
  const ext = allowed[file.type];

  if (!ext) {
    return {
      ok: false,
      error: `Unsupported file type "${file.type || "unknown"}". Allowed: ${Object.keys(allowed).join(", ")}.`,
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (file.size === 0) return { ok: false, error: "File is empty." };

  const data = Buffer.from(await file.arrayBuffer());

  // Trust the bytes, not the declared type: a client can claim any MIME.
  if (kind === "image" && !looksLikeImage(data)) {
    return { ok: false, error: "That file is not a valid image." };
  }
  if (kind === "document" && ext === "pdf" && data.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return { ok: false, error: "That file is not a valid PDF." };
  }

  const storageKey = `${createHash("sha256").update(data).digest("hex")}.${ext}`;
  const visibility = kind === "document" ? "private" : "public";
  const target = resolveStoragePath(storageKey, visibility);
  if (!target) return { ok: false, error: "Could not store that file." };

  try {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  } catch (err) {
    console.error("storeFile: write failed:", err);
    return {
      ok: false,
      error: "Could not save the file on the server. Check the upload directory.",
    };
  }

  return {
    ok: true,
    file: {
      storageKey,
      url: visibility === "private" ? documentUrl(storageKey) : imageUrl(storageKey),
      mimeType: file.type,
      sizeBytes: data.byteLength,
    },
  };
}

/**
 * Magic-number check for the formats we accept. A declared image/png that is
 * really a script would otherwise be stored and served with an image
 * content type.
 */
function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return true; // PNG
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return true;
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") return true; // AVIF
  return false;
}

export type OpenedFile = { stream: ReadableStream; sizeBytes: number; mimeType: string };

/**
 * Opens a stored file for serving. Streams rather than buffering, so a
 * request holds a file handle instead of the whole image in memory.
 * Returns null when the key is malformed or the file is not there.
 */
export async function openStoredFile(
  storageKey: string,
  visibility: "public" | "private"
): Promise<OpenedFile | null> {
  const target = resolveStoragePath(storageKey, visibility);
  if (!target) return null;

  try {
    const info = await stat(target);
    if (!info.isFile()) return null;
    const { Readable } = await import("node:stream");
    return {
      stream: Readable.toWeb(createReadStream(target)) as ReadableStream,
      sizeBytes: info.size,
      mimeType: mimeForKey(storageKey),
    };
  } catch {
    return null;
  }
}

/**
 * Removes stored files by key. A missing file is not an error — the row
 * pointing at it is going away regardless, and failing the delete would
 * leave the admin unable to remove a listing over a file that is already
 * gone.
 */
export async function deleteStoredFiles(
  storageKeys: string[],
  visibility: "public" | "private" = "public"
): Promise<void> {
  await Promise.all(
    storageKeys.map(async (key) => {
      const target = resolveStoragePath(key, visibility);
      if (!target) return;
      try {
        await unlink(target);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          console.error(`deleteStoredFiles: could not remove ${key}:`, err);
        }
      }
    })
  );
}
