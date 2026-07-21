import { Pool, types } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Postgres DATE columns come back as plain "YYYY-MM-DD" strings. The default
// parser turns them into local-midnight Date objects, which drizzle then
// re-serializes via UTC — shifting the date back a day on any TZ ahead of
// UTC (e.g. IST). Deal windows are date-only; keep them as strings.
types.setTypeParser(types.builtins.DATE, (v) => v);

// One pool across dev HMR reloads.
const globalForDb = globalThis as unknown as { __gldPool?: Pool };

const pool =
  globalForDb.__gldPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    // Neon suspends when idle; cap the wait for its wake-up instead of
    // letting a request hang until the platform timeout.
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__gldPool = pool;

export const db = drizzle(pool, { schema });
