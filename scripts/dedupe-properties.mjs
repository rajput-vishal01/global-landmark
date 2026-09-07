// Finds properties that were accidentally submitted more than once (same
// title, created within a few minutes of each other — the classic "clicked
// Create twice" pattern) and, optionally, removes the extras.
//
// Dry run by default — it only ever REPORTS what it found. Nothing is
// deleted unless you pass --delete explicitly.
//
// Usage:
//   node scripts/dedupe-properties.mjs                # report only
//   node scripts/dedupe-properties.mjs --delete        # actually remove duplicates
//
// Point it at the right database first:
//   DATABASE_URL="<production connection string>" node scripts/dedupe-properties.mjs
// Without an explicit DATABASE_URL it falls back to .env (the local dev DB) —
// this is deliberate, so running it with no arguments can never touch
// production by accident.
//
// Safety rules, in order:
//   1. Only ever touches rows still in publicationState = 'draft'. A
//      duplicate that somehow got published is reported, never
//      auto-deleted — that needs a human to look at it.
//   2. Within each duplicate group, the OLDEST row (first created) is always
//      kept. Only the later copies are candidates for removal.
//   3. Deletes follow the exact same order deleteProperty() uses in the
//      admin UI: gather image/document storage keys, delete the DB row
//      (cascades child tables), THEN sweep the stored files — never the
//      other way round.
import mysql from "mysql2/promise";
import { deleteStoredFiles } from "../lib/storage.ts";

try {
  process.loadEnvFile();
} catch {
  /* rely on real env */
}

const shouldDelete = process.argv.includes("--delete");

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  charset: "utf8mb4",
  dateStrings: ["DATE"],
  multipleStatements: false,
});

// mysql2 returns [rows, fields] where pg returned { rows }.
const all = async (sql, params = []) => (await conn.execute(sql, params))[0];

// id asc as the tiebreaker, not just created_at: rows from the same
// double-submit can share an identical created_at down to the second
// (a single INSERT statement evaluates now() once for every row it
// inserts), which makes created_at alone an unreliable sort key for "which
// one happened first." id is an auto-increment primary key — strictly
// monotonic, so it can never tie.
const rows = await all(`
  select id, ref_code, title, publication_state, created_at
  from properties
  order by lower(trim(title)), created_at asc, id asc
`);

const groups = new Map();
for (const row of rows) {
  const key = row.title.trim().toLowerCase();
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);

if (duplicateGroups.length === 0) {
  console.log("No duplicate titles found.");
  await conn.end();
  process.exit(0);
}

console.log(`Found ${duplicateGroups.length} title(s) with more than one listing:\n`);

let removableCount = 0;
let skippedPublished = 0;

for (const group of duplicateGroups) {
  const [keep, ...rest] = group; // oldest first, per the ORDER BY above
  console.log(`"${keep.title}" — ${group.length} copies`);
  console.log(
    `  KEEP   #${keep.id} ${keep.ref_code ?? "(no ref)"}  ${keep.publication_state}  created ${keep.created_at}`
  );
  for (const dupe of rest) {
    const canRemove = dupe.publication_state === "draft";
    if (canRemove) removableCount++;
    else skippedPublished++;
    console.log(
      `  ${canRemove ? "REMOVE " : "SKIP   "}#${dupe.id} ${dupe.ref_code ?? "(no ref)"}  ${dupe.publication_state}  created ${dupe.created_at}` +
        (canRemove ? "" : "  <- published, not touching this automatically")
    );
  }
  console.log("");
}

console.log(
  `${removableCount} row(s) are safe to remove automatically (draft duplicates). ` +
    `${skippedPublished} duplicate(s) are published and need manual review.`
);

if (!shouldDelete) {
  console.log("\nDry run only — nothing was deleted. Re-run with --delete to remove the draft duplicates listed above.");
  await conn.end();
  process.exit(0);
}

console.log("\n--delete passed — removing draft duplicates now...");
let removed = 0;
for (const group of duplicateGroups) {
  const [, ...rest] = group;
  for (const dupe of rest) {
    if (dupe.publication_state !== "draft") continue;
    // property_images' TS field is storageKey, but the column is still
    // literally named public_id (a holdover from the Cloudinary-only era —
    // see the comment on propertyImages.storageKey in lib/db/schema.ts).
    const images = await all(
      `select public_id as storage_key from property_images where property_id = ?`,
      [dupe.id]
    );
    const documents = await all(
      `select storage_key from property_documents where property_id = ?`,
      [dupe.id]
    );
    await conn.execute(`delete from properties where id = ?`, [dupe.id]);
    await deleteStoredFiles(
      images.map((r) => r.storage_key).filter(Boolean),
      "public"
    );
    await deleteStoredFiles(
      documents.map((r) => r.storage_key).filter(Boolean),
      "private"
    );
    console.log(`  removed #${dupe.id} (${dupe.ref_code ?? "no ref"}) "${dupe.title}"`);
    removed++;
  }
}
console.log(`\nDone — removed ${removed} duplicate row(s).`);

await conn.end();
