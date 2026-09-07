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

const pool =
  globalForDb.__gldPool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
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
