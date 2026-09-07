// Wipes every seed-managed table and re-seeds from scratch, so the target
// database ends up matching exactly what `node scripts/seed.mjs` produces —
// no leftover admin-panel duplicates, no drift from the canonical portfolio.
//
// This is NOT scripts/dedupe-properties.mjs. Dedupe removes only the extra
// copies and keeps everything else (real CRM clients, real leads, admin
// settings edits) untouched. This script deletes ALL of it — every property,
// project, builder, tower, deal, testimonial video, lead, CRM client/deal/
// payment/activity, and site setting — including anything real that was
// added directly on the live site and isn't in seed.mjs's PROPERTIES array.
// Use dedupe-properties.mjs instead unless you specifically want production
// reset to the seed baseline.
//
// Dry run by default — prints exactly what would be wiped and exits.
// Nothing is touched until you pass --yes.
//
// Usage:
//   DATABASE_URL="<production connection string>" node scripts/reset-production-data.mjs
//   DATABASE_URL="<production connection string>" node scripts/reset-production-data.mjs --yes
//
// Without an explicit DATABASE_URL it falls back to .env (the local dev DB) —
// deliberate, so running it bare can never touch production by accident.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { deleteStoredFiles } from "../lib/storage.ts";

try {
  process.loadEnvFile();
} catch {
  /* rely on real env */
}

const shouldRun = process.argv.includes("--yes");

// Every table seed.mjs owns. These are the tables reported in the dry run
// and backed up before the wipe.
const TABLES = [
  "properties",
  "projects",
  "builders",
  "towers",
  "deals",
  "testimonial_videos",
  "leads",
  "crm_clients",
  "site_settings",
];

// MySQL has no `TRUNCATE ... CASCADE`, so everything that FKs into TABLES has
// to be named by hand — Postgres used to sweep these up for us. Leaving one
// out does not error (the truncate runs with FOREIGN_KEY_CHECKS off); it
// silently strands child rows pointing at ids that no longer exist, which is
// worse. Keep this list in step with lib/db/schema.ts: it is the transitive
// closure of everything referencing a table above, matching what Postgres'
// CASCADE reached — including the `on delete set null` children
// (tour_requests, crm_deals.property_id), which TRUNCATE CASCADE also wiped.
const DEPENDENT_TABLES = [
  "property_images",
  "property_media",
  "property_owners",
  "property_internal",
  "property_charges",
  "property_price_history",
  "property_documents",
  "property_unit_sizes",
  "tour_requests",
  "crm_deals",
  "crm_payments",
  "crm_activities",
];

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  charset: "utf8mb4",
  dateStrings: ["DATE"],
  multipleStatements: false,
});

// mysql2 returns [rows, fields] where pg returned { rows }.
const all = async (sql, params = []) => (await conn.execute(sql, params))[0];

const host = new URL(process.env.DATABASE_URL).host;
console.log(`Target database host: ${host}`);
console.log(`Tables to be wiped: ${TABLES.join(", ")} (+ everything that references them)\n`);

if (!shouldRun) {
  console.log("Dry run — current row counts (nothing deleted):");
  for (const t of TABLES) {
    // count(*) is a BIGINT; Number() keeps it a plain JS number for printing.
    const rows = await all(`select count(*) as n from ${t}`);
    console.log(`  ${t}: ${Number(rows[0].n)}`);
  }
  console.log("\nRe-run with --yes to back up, wipe, and reseed for real.");
  await conn.end();
  process.exit(0);
}

// Snapshot every row about to be destroyed, in case this was a mistake.
// Storage files (images/documents on disk or Cloudinary) are NOT part of
// this backup — only the database rows that point at them.
mkdirSync("scripts/backups", { recursive: true });
const backupPath = `scripts/backups/prod-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
const snapshot = {};
for (const t of TABLES) {
  snapshot[t] = await all(`select * from ${t}`);
}
writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
console.log(`Backup written to ${backupPath} (${Object.values(snapshot).flat().length} rows).`);

// Storage keys must be gathered before the truncate removes the rows that
// name them — same row-then-files order deleteProperty()/dedupe use.
const images = await all(`select public_id as storage_key from property_images`);
const documents = await all(`select storage_key from property_documents`);

console.log("\nWiping...");
// MySQL refuses to TRUNCATE a table another table has a foreign key to, so
// the checks come off for the duration. TRUNCATE resets AUTO_INCREMENT on
// its own — that is Postgres' `restart identity`, no extra clause needed.
await conn.query(`set foreign_key_checks = 0`);
try {
  for (const t of [...TABLES, ...DEPENDENT_TABLES]) {
    await conn.query(`truncate table ${t}`);
  }
} finally {
  await conn.query(`set foreign_key_checks = 1`);
}

console.log("Sweeping orphaned storage files...");
await deleteStoredFiles(
  images.map((r) => r.storage_key).filter(Boolean),
  "public"
);
await deleteStoredFiles(
  documents.map((r) => r.storage_key).filter(Boolean),
  "private"
);

await conn.end();

console.log("\nReseeding from scripts/seed.mjs...");
execFileSync("node", ["scripts/seed.mjs"], { stdio: "inherit" });

console.log("\nDone — database reset to the seed baseline.");
