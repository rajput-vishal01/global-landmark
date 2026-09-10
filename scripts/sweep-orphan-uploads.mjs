// Delete uploaded files that nothing in the database points at.
//
// WHY THIS EXISTS
// ---------------
// Uploads are written to disk BEFORE the row that references them is saved —
// they have to be, because the picker shows you a thumbnail while you are
// still filling the form. So any form abandoned after the photos go up leaves
// files behind, and nothing at request time can catch it: the browser closing
// is not an event the server hears.
//
// The delete paths are already clean (deleteProperty and bulkDeleteProperties
// sweep images, private documents and published copies), and the sell action
// sweeps its own uploads when the transaction fails. This is for the case
// none of those can see.
//
// SAFETY
// ------
// Two rules, both load-bearing:
//
//   1. Dry run by default. It prints what it would delete and exits. Pass
//      --delete to actually remove anything.
//   2. A grace period. A file uploaded in the last 24 hours is never touched,
//      because "no row references it" is exactly what a half-filled form
//      looks like from here — the seller may still be typing. Override with
//      --hours=N.
//
// Run: node scripts/sweep-orphan-uploads.mjs [--delete] [--hours=24]
import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import mysql from "mysql2/promise";

try {
  process.loadEnvFile();
} catch {
  /* rely on real environment variables */
}

if (!process.env.DATABASE_URL) {
  console.error("sweep: DATABASE_URL is not set.");
  process.exit(1);
}

const args = process.argv.slice(2);
const doDelete = args.includes("--delete");
const hours = Number(args.find((a) => a.startsWith("--hours="))?.split("=")[1] ?? 24);

// Mirrors the default in lib/storage.ts, including the standalone-cwd climb:
// Next's production server chdir()s into .next/standalone, so a plain
// process.cwd() here would look in the wrong place on the server.
const uploadDir =
  process.env.UPLOAD_DIR ??
  (process.cwd().endsWith(join(".next", "standalone"))
    ? join(process.cwd(), "..", "..", "uploads")
    : join(process.cwd(), "uploads"));

/** Every file under <uploadDir>/<visibility>, which is sharded by 2 hex chars. */
async function listStored(visibility) {
  const root = join(uploadDir, visibility);
  const found = [];
  let shards;
  try {
    shards = await readdir(root);
  } catch {
    return found; // bucket does not exist yet
  }
  for (const shard of shards) {
    let files;
    try {
      files = await readdir(join(root, shard));
    } catch {
      continue;
    }
    for (const name of files) found.push({ key: name, path: join(root, shard, name) });
  }
  return found;
}

const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL });

try {
  // Everything the database still considers live. Documents are checked
  // against BOTH buckets: publishing one copies it into public/, so a
  // published document legitimately exists in each.
  // property_images stores the key in `public_id`, not `storage_key` — the
  // column kept its Cloudinary-era name through the move to local storage
  // (schema.ts maps storageKey -> public_id). Also read `url`, because a
  // row written before that column existed carries the key only in its
  // /api/images/<key> URL, and sweeping those would delete live photos.
  const [imageRows] = await conn.query(
    "select public_id, url from property_images"
  );
  const [docRows] = await conn.query(
    "select storage_key from property_documents where storage_key is not null"
  );
  const keyFromUrl = (url) =>
    typeof url === "string" && url.startsWith("/api/images/")
      ? url.slice("/api/images/".length)
      : null;

  const referencedPublic = new Set(
    [
      ...imageRows.flatMap((r) => [r.public_id, keyFromUrl(r.url)]),
      ...docRows.map((r) => r.storage_key),
    ].filter(Boolean)
  );
  const referencedPrivate = new Set(docRows.map((r) => r.storage_key));

  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  let swept = 0;
  let bytes = 0;
  let young = 0;

  for (const [visibility, referenced] of [
    ["public", referencedPublic],
    ["private", referencedPrivate],
  ]) {
    for (const { key, path } of await listStored(visibility)) {
      if (referenced.has(key)) continue;

      const info = await stat(path);
      if (info.mtimeMs > cutoff) {
        young++;
        continue;
      }

      swept++;
      bytes += info.size;
      console.log(`${doDelete ? "deleting" : "would delete"}  ${visibility}/${key}`);
      if (doDelete) await unlink(path);
    }
  }

  const mb = (bytes / 1024 / 1024).toFixed(1);
  console.log(
    `\nsweep: ${swept} orphan(s), ${mb} MB${doDelete ? " deleted" : " — dry run, pass --delete"}` +
      (young ? `; ${young} skipped as newer than ${hours}h` : "")
  );
} finally {
  await conn.end();
}
