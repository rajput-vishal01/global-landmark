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
// Three rules, all load-bearing:
//
//   1. Dry run by default. It prints what it would delete and exits. Pass
//      --delete to actually remove anything.
//   2. A grace period. A file uploaded in the last 24 hours is never touched,
//      because "no row references it" is exactly what a half-filled form
//      looks like from here — the seller may still be typing. Override with
//      --hours=N.
//   3. "Referenced" means mentioned by ANY row of ANY table, in any text or
//      json column (upload-refs.mjs). This used to read property_images and
//      property_documents only, so it listed project covers and testimonial
//      photos as orphans; a scan of every column cannot miss a table.
//
// Run: node scripts/sweep-orphan-uploads.mjs [--delete] [--hours=24]
import { readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import mysql from "mysql2/promise";
import { referencedKeys, uploadDir } from "./upload-refs.mjs";

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
const root = uploadDir();

/** Every file under <root>/<visibility>, which is sharded by 2 hex chars. */
async function listStored(visibility) {
  const dir = join(root, visibility);
  const found = [];
  let shards;
  try {
    shards = await readdir(dir);
  } catch {
    return found; // bucket does not exist yet
  }
  for (const shard of shards) {
    let files;
    try {
      files = await readdir(join(dir, shard));
    } catch {
      continue;
    }
    for (const name of files) found.push({ key: name, path: join(dir, shard, name) });
  }
  return found;
}

const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL });

try {
  // One set for both buckets: a published document legitimately exists in
  // public/ and private/, and a file named anywhere is never an orphan.
  const referenced = await referencedKeys(conn);

  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  let swept = 0;
  let bytes = 0;
  let young = 0;

  for (const visibility of ["public", "private"]) {
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
    `\nsweep: ${root} — ${referenced.size} stored key(s) referenced by the database; ` +
      `${swept} orphan(s), ${mb} MB${doDelete ? " deleted" : " — dry run, pass --delete"}` +
      (young ? `; ${young} skipped as newer than ${hours}h` : "")
  );
} finally {
  await conn.end();
}
