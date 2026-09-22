// What the upload scripts share: where stored files live, and which of them
// the database still points at. Plain Node, no TypeScript: it runs on the
// server. Used by sweep-orphan-uploads.mjs and seed-demo.mjs --remove.
import path from "node:path";

/**
 * lib/storage.ts: UPLOAD_DIR, else <app root>/uploads — climbing out of
 * .next/standalone, which is where the production server's cwd sits.
 */
export function uploadDir(cwd = process.cwd()) {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const standalone = path.join(".next", "standalone");
  const root = cwd.endsWith(path.sep + standalone) ? cwd.slice(0, -(standalone.length + 1)) : cwd;
  return path.join(root, "uploads");
}

/** A stored file's name: lib/storage-keys.ts KEY_PATTERN. */
export const KEY_PATTERN = /^[a-f0-9]{64}\.(jpg|png|webp|avif|gif|bmp|tiff|heic|pdf|doc|docx)$/;

/** The same key found anywhere inside a value: bare, in an /api/images/<key> URL, in JSON. */
const KEY_IN_TEXT = /(?<![a-f0-9])[a-f0-9]{64}\.(?:jpg|png|webp|avif|gif|bmp|tiff|heic|pdf|docx?)(?![a-z0-9])/g;

const quoteId = (name) => "`" + name.replaceAll("`", "``") + "`";

/**
 * Every stored key that any row of any table mentions, read from every
 * text, varchar and json column in the database. Deliberately not a list of
 * "the columns that hold uploads": a hand-kept list is how project covers
 * and testimonial photos came to be swept as orphans, and a table added
 * later is covered the day it exists.
 *
 * Reads through the caller's connection, so inside a transaction it sees
 * that transaction's own deletes.
 *
 * ponytail: reads every text value of every row — fine at this site's size;
 * add a `where col regexp '[a-f0-9]{64}'` per column if a table ever grows
 * to millions of rows.
 */
export async function referencedKeys(conn) {
  const [columns] = await conn.query(
    `select table_name as t, column_name as c
       from information_schema.columns
      where table_schema = database()
        and data_type in ('char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'json')`
  );
  const tables = new Map();
  for (const { t, c } of columns) tables.set(t, [...(tables.get(t) ?? []), c]);

  const keys = new Set();
  for (const [table, cols] of tables) {
    const [rows] = await conn.query(`select ${cols.map(quoteId).join(", ")} from ${quoteId(table)}`);
    for (const row of rows) {
      for (const value of Object.values(row)) {
        if (value == null) continue;
        const text = typeof value === "string" ? value : JSON.stringify(value);
        for (const [key] of text.matchAll(KEY_IN_TEXT)) keys.add(key);
      }
    }
  }
  return keys;
}
