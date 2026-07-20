import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// One pool across dev HMR reloads.
const globalForDb = globalThis as unknown as { __gldPool?: Pool };

const pool =
  globalForDb.__gldPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.__gldPool = pool;

export const db = drizzle(pool, { schema });
