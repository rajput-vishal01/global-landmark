import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Which of these storage keys some row still names.
 *
 * Files are stored under the SHA-256 of their bytes, so one file can belong
 * to several rows: the same photograph uploaded to two listings, or a
 * project cover that is also a photo of one of its units, is stored once.
 * Deleting a listing therefore cannot simply unlink its files — the other
 * listing would render a broken image. Everything that removes a file asks
 * here first.
 *
 * Every text and json column of every table is read, rather than a hand-kept
 * list of the columns that hold keys today: a table added later is covered
 * the day it exists, and the cost of forgetting one is a deleted file that
 * something still points at. `scripts/upload-refs.mjs` is the plain-node
 * twin of this, used by `npm run sweep:uploads`, which runs outside Next.
 *
 * ponytail: reads every text value of every row — fine at this site's size.
 * If a table ever reaches millions of rows, filter per column with
 * `where col regexp '[a-f0-9]{64}'`.
 */
export async function stillReferenced(keys: string[]): Promise<Set<string>> {
  const wanted = new Set(keys);
  const found = new Set<string>();
  if (!wanted.size) return found;

  try {
    const [columns] = (await db.execute(
      sql`select table_name as t, column_name as c
            from information_schema.columns
           where table_schema = database()
             and data_type in ('char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'json')`
    )) as unknown as [{ t: string; c: string }[], unknown];

    const tables = new Map<string, string[]>();
    for (const { t, c } of columns) tables.set(t, [...(tables.get(t) ?? []), c]);

    for (const [table, cols] of tables) {
      const select = cols.map(quoteId).join(", ");
      const [rows] = (await db.execute(
        sql.raw(`select ${select} from ${quoteId(table)}`)
      )) as unknown as [Record<string, unknown>[], unknown];

      for (const row of rows) {
        for (const value of Object.values(row)) {
          if (value == null) continue;
          const text = typeof value === "string" ? value : JSON.stringify(value);
          for (const key of wanted) if (!found.has(key) && text.includes(key)) found.add(key);
        }
      }
      if (found.size === wanted.size) break;
    }
  } catch (err) {
    // A failed scan must not delete anything: treat every key as still in
    // use. An orphan left on disk is swept later; a file deleted while a row
    // still points at it is a broken image nobody can restore.
    console.error("stillReferenced: scan failed, keeping every file:", err);
    return wanted;
  }

  return found;
}

/** MySQL identifier quoting — the names come from information_schema, not from input. */
function quoteId(name: string): string {
  return `\`${name.replaceAll("`", "``")}\``;
}
