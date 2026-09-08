import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
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

// One pool across dev HMR reloads.
const globalForDb = globalThis as unknown as { __gldPool?: mysql.Pool };

/**
 * Check the URL before handing it to mysql2, because this module is
 * evaluated by `app/layout.tsx` — so a malformed DATABASE_URL 500s EVERY
 * route, the public site included, and does it with `TypeError: Invalid URL`
 * pointing at `mysql.createPool`. That names the line, not the cause, and
 * the cause is always the env file.
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

if (process.env.NODE_ENV !== "production") globalForDb.__gldPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
