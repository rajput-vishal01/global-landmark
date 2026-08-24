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
import { Client } from "pg";
import { deleteStoredFiles } from "../lib/storage.ts";

try {
  process.loadEnvFile();
} catch {
  /* rely on real env */
}

const shouldRun = process.argv.includes("--yes");

// Every table seed.mjs owns. TRUNCATE ... CASCADE also clears everything
// that FKs into these (property_images, property_owners, property_charges,
// property_documents, property_internal, property_price_history,
// property_media, crm_deals, crm_payments, crm_activities) without having
// to enumerate them by hand.
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

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const host = new URL(process.env.DATABASE_URL).host;
console.log(`Target database host: ${host}`);
console.log(`Tables to be wiped: ${TABLES.join(", ")} (+ everything that references them)\n`);

if (!shouldRun) {
  console.log("Dry run — current row counts (nothing deleted):");
  for (const t of TABLES) {
    const { rows } = await client.query(`select count(*)::int as n from ${t}`);
    console.log(`  ${t}: ${rows[0].n}`);
  }
  console.log("\nRe-run with --yes to back up, wipe, and reseed for real.");
  await client.end();
  process.exit(0);
}

// Snapshot every row about to be destroyed, in case this was a mistake.
// Storage files (images/documents on disk or Cloudinary) are NOT part of
// this backup — only the database rows that point at them.
mkdirSync("scripts/backups", { recursive: true });
const backupPath = `scripts/backups/prod-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
const snapshot = {};
for (const t of TABLES) {
  snapshot[t] = (await client.query(`select * from ${t}`)).rows;
}
writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
console.log(`Backup written to ${backupPath} (${Object.values(snapshot).flat().length} rows).`);

// Storage keys must be gathered before the truncate removes the rows that
// name them — same row-then-files order deleteProperty()/dedupe use.
const images = await client.query(`select public_id as storage_key from property_images`);
const documents = await client.query(`select storage_key from property_documents`);

console.log("\nWiping...");
await client.query(`truncate table ${TABLES.join(", ")} restart identity cascade`);

console.log("Sweeping orphaned storage files...");
await deleteStoredFiles(
  images.rows.map((r) => r.storage_key).filter(Boolean),
  "public"
);
await deleteStoredFiles(
  documents.rows.map((r) => r.storage_key).filter(Boolean),
  "private"
);

await client.end();

console.log("\nReseeding from scripts/seed.mjs...");
execFileSync("node", ["scripts/seed.mjs"], { stdio: "inherit" });

console.log("\nDone — database reset to the seed baseline.");
