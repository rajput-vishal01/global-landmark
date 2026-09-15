import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

/**
 * MySQL connection pool.
 *
 * `mode: "default"` is the Drizzle setting that makes `db.query.*` (the
 * relational API with `with:` includes) work — the panel's CRM and project
 * screens use it. Without it those calls throw at runtime rather than at
 * build, which is the worst place to find out.
 *
 * dateStrings for DATE columns: MySQL returns a Date at local midnight,
 * which then re-serialises through UTC and shifts the day backwards on any
 * timezone ahead of UTC (IST is +5:30). Deal windows and possession dates
 * are date-only, so they stay strings — the same fix the Postgres driver
 * needed for the same reason.
 */

const globalForDb = globalThis as unknown as { __gldPool?: mysql.Pool };

/**
 * Check the URL before handing it to mysql2. Without this a malformed
 * DATABASE_URL fails on the first query of every route with `TypeError:
 * Invalid URL` pointing at `mysql.createPool` — which names the line, not
 * the cause, and the cause is always the env file.
 *
 * The two that actually happen: the key pasted into its own value
 * (`DATABASE_URL=DATABASE_URL=mysql://…`), and a leftover `postgres://` URL
 * after the MySQL migration. Both are named outright.
 *
 * The password is never printed. `redact` keeps the shape — scheme, host,
 * port, database — which is everything needed to see what is wrong.
 */
function checkedDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  if (raw.startsWith("DATABASE_URL=")) {
    throw new Error(
      "DATABASE_URL contains its own name — the .env line reads " +
        "`DATABASE_URL=DATABASE_URL=…`. Remove the duplicated prefix."
    );
  }
  const redact = raw.replace(/\/\/[^@/]*@/, "//***@");
  if (raw.startsWith("postgres://") || raw.startsWith("postgresql://")) {
    throw new Error(
      `DATABASE_URL is a PostgreSQL URL (${redact}). This app moved to MySQL — ` +
        "it wants mysql://user:pass@host:3306/database."
    );
  }
  try {
    new URL(raw);
  } catch {
    throw new Error(
      `DATABASE_URL is not a valid URL (${redact}). Expected ` +
        "mysql://user:pass@host:3306/database, unquoted, with no spaces around the =. " +
        "A password containing @ : / or # must be percent-encoded."
    );
  }
  return raw;
}

let instance: MySql2Database<typeof schema> | undefined;

/**
 * The pool and the Drizzle client, built on the first query rather than on
 * import.
 *
 * This used to run at module scope, and it broke CI. `app/layout.tsx`
 * imports lib/seo, which imports resolveCompany, which imports this file —
 * so `next build` evaluated it while collecting route configuration, hit
 * `checkedDatabaseUrl()`, and died with "Failed to collect configuration for
 * /_not-found · DATABASE_URL is not set". The build runner has no database
 * and does not need one: nothing is queried at build time, and the pages
 * that do read settings already fall back to lib/data.ts when the read
 * fails.
 *
 * Deferring it also keeps the error where it is useful. A missing or
 * malformed URL now surfaces on the first actual query, inside the caller's
 * try/catch, with the same message naming the same cause — rather than
 * taking down module evaluation for every route at once.
 *
 * The fix is NOT a placeholder DATABASE_URL in the workflow: that would make
 * the build dial 127.0.0.1 and wait out the connect timeout once per static
 * page, to reach the same fallback this reaches for free.
 */
function connection(): MySql2Database<typeof schema> {
  if (instance) return instance;

  const pool =
    globalForDb.__gldPool ??
    mysql.createPool({
      uri: checkedDatabaseUrl(),
      connectionLimit: 5,
      // Cap the wait for a connection rather than letting a request hang
      // until the platform timeout.
      connectTimeout: 10_000,
      dateStrings: ["DATE"],
      // Names and addresses carry emoji and non-Latin scripts; three-byte
      // utf8 truncates them.
      charset: "utf8mb4",
    });

  // One pool across dev HMR reloads.
  if (process.env.NODE_ENV !== "production") globalForDb.__gldPool = pool;

  instance = drizzle(pool, { schema, mode: "default" });
  return instance;
}

/**
 * Every call site keeps writing `db.select()`, so the laziness stays here
 * rather than becoming a `getDb()` every caller has to remember. Methods are
 * bound to the real client because Drizzle's builders rely on `this`.
 */
export const db = new Proxy({} as MySql2Database<typeof schema>, {
  get(_target, property) {
    const client = connection();
    const value = Reflect.get(client, property) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});
