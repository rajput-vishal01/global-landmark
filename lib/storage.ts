// Re-exported so every existing `from "@/lib/storage"` import of these keeps
// working. They live in their own module because they are pure string work
// and a client component needs them without node:fs coming along.
export { isStorageKey, imageUrl, isLocalImageUrl, storageKeyFromUrl } from "./storage-keys";
import { isStorageKey, imageUrl } from "./storage-keys";

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, stat, unlink, writeFile } from "node:fs/promises";
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

/**
 * Where uploads live when UPLOAD_DIR is not set.
 *
 * This cannot simply be `process.cwd()/uploads`. Next's standalone server
 * starts with `process.chdir(__dirname)` (.next/standalone/server.js), so in
 * production the cwd is `<app>/.next/standalone` — and a deploy that ships a
 * fresh `.next` therefore deletes every uploaded photo and legal document,
 * leaving the database rows pointing at files that no longer exist. The
 * symptom is images that upload fine and then render broken after the next
 * deploy, which looks like an upload bug and is not one.
 *
 * So: if the cwd IS the standalone directory, climb back out of it. Setting
 * UPLOAD_DIR explicitly is still the right thing on a real server; this only
 * makes the fallback safe rather than quietly destructive.
 */
export function uploadDirFor(cwd: string): string {
  const standalone = path.join(".next", "standalone");
  const root = cwd.endsWith(path.sep + standalone)
    ? cwd.slice(0, -(standalone.length + 1))
    : cwd;
  return path.join(root, "uploads");
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || uploadDirFor(process.cwd());

/** Extension per accepted type. The extension is ours, never the client's. */
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Property documents (R-29) — private, admin-gated on the way back out.
 * PDF, Word, and any common photo format (a scan off a phone is a JPEG or a
 * HEIC as often as a PDF). SVG is deliberately absent: it can carry script,
 * and the admin previews these files inline.
 */
const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/heic": "heic",
  "image/heif": "heic",
};

/**
 * Fallback by filename when the browser sends no usable type — Windows
 * reports HEIC, and sometimes .docx, as "" or application/octet-stream. The
 * bytes are still checked against the extension below, so a renamed file
 * gains nothing.
 */
const DOCUMENT_EXT_BY_NAME: Record<string, string> = {
  pdf: "pdf",
  doc: "doc",
  docx: "docx",
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
  gif: "gif",
  bmp: "bmp",
  tif: "tiff",
  tiff: "tiff",
  heic: "heic",
  heif: "heic",
};

/** Reverse map for serving: extension decides Content-Type, not the request. */
const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  heic: "image/heic",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * 8 MB. Comfortably fits a full-resolution property photo off a phone or a
 * DSLR export. Raise deliberately.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** `<sha256>.<ext>` — the whole identity of a stored file. */

export type StoredFile = {
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type StoreResult =
  | { ok: true; file: StoredFile }
  | { ok: false; error: string };



/** Admin-gated URL for a document. Never rendered on a public page. */
export function documentUrl(storageKey: string): string {
  return `/api/admin/documents/${storageKey}`;
}

/**
 * URL for a document an admin has explicitly published (a brochure).
 *
 * Only ever built for a row whose `isPublic` column is true — the route it
 * points at re-checks that column and reads the PUBLIC bucket, so this
 * function producing a string is not what makes a file downloadable.
 */
export function publicDocumentUrl(storageKey: string): string {
  return `/api/documents/${storageKey}`;
}

/**
 * Brings the stored bytes in line with a document's `isPublic` flag.
 *
 * Uploaded documents always land under private/ (storeFile routes them
 * there by kind), and the public document route only ever resolves paths
 * under public/. So ticking the box has to actually MOVE bytes — flipping
 * the column alone would leave the download 404ing, and serving a
 * private-bucket file from a public route would defeat the whole split.
 *
 * Copy, not move: the admin vault still serves the file through the
 * authenticated route, which reads private/. Unticking removes only the
 * public copy, so the file stops being reachable without a login again —
 * the DB check in the route already refuses it, and this removes the
 * second path in (/api/images/<key> serves anything sitting in public/).
 *
 * ponytail: a JPEG uploaded BOTH as a document and as a gallery image
 * shares one content-hash key, so unpublishing the document would delete
 * the image's file too. Deliberately not guarded: the failure is a visibly
 * broken image, and the alternative — leaving the public copy in place —
 * is a silent one that keeps a withdrawn file downloadable.
 */
export async function syncPublicDocumentFile(
  storageKey: string,
  isPublic: boolean
): Promise<void> {
  const publicPath = resolveStoragePath(storageKey, "public");
  if (!publicPath) return;

  if (!isPublic) {
    try {
      await unlink(publicPath);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        console.error(`syncPublicDocumentFile: could not unpublish ${storageKey}:`, err);
      }
    }
    return;
  }

  const privatePath = resolveStoragePath(storageKey, "private");
  if (!privatePath) return;
  try {
    await mkdir(path.dirname(publicPath), { recursive: true });
    await copyFile(privatePath, publicPath);
  } catch (err) {
    console.error(`syncPublicDocumentFile: could not publish ${storageKey}:`, err);
  }
}


/**
 * Imagery we ship in the repo under public/local — the Tricity project
 * photography the seed data points at.
 *
 * Deliberately a strict whitelist pattern rather than a startsWith check: a
 * stored image URL ends up in next/image, so anything admitting `..` or a
 * second path segment would be a traversal hole. Lowercase name, single
 * segment, known extension, nothing else.
 */
const BUNDLED_IMAGE = /^\/local\/[a-z0-9][a-z0-9-]*\.(?:jpg|jpeg|png|webp|avif)$/;

export function isBundledImageUrl(url: string): boolean {
  return BUNDLED_IMAGE.test(url);
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
  const nameExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext =
    allowed[file.type] ?? (kind === "document" ? DOCUMENT_EXT_BY_NAME[nameExt] : undefined);

  if (!ext) {
    return {
      ok: false,
      error:
        kind === "document"
          ? `"${file.name}" is not a PDF, Word file or photo.`
          : `Unsupported file type "${file.type || "unknown"}". Allowed: ${Object.keys(allowed).join(", ")}.`,
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
  if (kind === "document" && !matchesExtension(data, ext)) {
    return { ok: false, error: `"${file.name}" is damaged or not really a .${ext} file.` };
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
      // Ours, from the checked extension — never the type the client claimed.
      mimeType: MIME_BY_EXT[ext] ?? file.type,
      sizeBytes: data.byteLength,
    },
  };
}

/**
 * Does the file start the way its extension says? Magic numbers only — enough
 * to stop a script renamed .pdf, which is the case that matters.
 */
export function matchesExtension(buf: Buffer, ext: string): boolean {
  if (buf.length < 12) return false;
  const ascii = (from: number, to: number) => buf.subarray(from, to).toString("ascii");
  switch (ext) {
    case "pdf":
      return ascii(0, 5) === "%PDF-";
    case "docx": // a zip container
      return buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
    case "doc": // OLE compound file
      return buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    case "gif":
      return ascii(0, 4) === "GIF8";
    case "bmp":
      return ascii(0, 2) === "BM";
    case "tiff":
      return ascii(0, 4) === "II*\0" || ascii(0, 4) === "MM\0*";
    case "heic":
      return ascii(4, 8) === "ftyp";
    default: // jpg, png, webp, avif
      return looksLikeImage(buf);
  }
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
