// Applies the SQL migrations in drizzle/ against MySQL, in filename order,
// recording what it applied so re-running is a no-op.
//
// Runs before `next build` and again from the server deploy script. Skipped
// when DATABASE_URL is unset — the Docker image build has no database and
// must keep working.
//
// WHY NOT `drizzle-kit migrate`
// -----------------------------
// It does not work against MySQL here. It applies the DDL correctly — all 26
// tables and 62 indexes land — and then exits 1 with an empty stderr, leaving
// __drizzle_migrations EMPTY. The next run therefore replays the baseline
// against a database that already has it and fails on "table already exists".
// The cause is that MySQL commits DDL implicitly, so the transaction the
// migrator wraps around a migration is already gone by the time it records
// the hash. A deploy pipeline that treats a failed migration as fatal — this
// one does, on purpose — cannot use a migrator that always reports failure.
//
// So this applies the same generated .sql files directly. drizzle-kit is
// still what GENERATES them (`npm run db:generate`); only the applying is
// ours. It also drops the runtime dependency on `npx` being resolvable from
// a non-interactive ssh shell, which is its own documented trap on this box.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import mysql from "mysql2/promise";

// This runs before Next.js boots, so nothing has loaded .env yet — without
// this a local `npm run build` would always report "no database" and skip,
// while a deploy with a real DATABASE_URL would migrate. Same file, two
// behaviours, is exactly the kind of surprise that bites at deploy time.
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables
}

if (!process.env.DATABASE_URL) {
  console.log("migrate: DATABASE_URL not set — skipping migrations (image build)");
  process.exit(0);
}

const DIR = "drizzle";
/** drizzle-kit writes this between statements; it is not SQL. */
const BREAK = "--> statement-breakpoint";

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  charset: "utf8mb4",
  multipleStatements: false,
});

try {
  await conn.query(
    `create table if not exists __migrations (
       name varchar(255) not null primary key,
       applied_at timestamp not null default current_timestamp
     ) engine=InnoDB default charset=utf8mb4`
  );

  const [rows] = await conn.query("select name from __migrations");
  const applied = new Set(rows.map((r) => r.name));

  const files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();
  if (!files.length) {
    console.log("migrate: no .sql files in drizzle/ — nothing to apply");
    process.exit(0);
  }

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(join(DIR, file), "utf8");
    const statements = sql
      .split(BREAK)
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`migrate: applying ${file} (${statements.length} statements)`);
    for (const [i, statement] of statements.entries()) {
      try {
        await conn.query(statement);
      } catch (err) {
        // Name the file and the statement — a bare SQL error with no
        // position is what makes a failed migration slow to diagnose.
        console.error(`\nmigrate: FAILED in ${file}, statement ${i + 1}:\n`);
        console.error(statement.slice(0, 400));
        console.error(`\n${err.message}\n`);
        throw err;
      }
    }

    await conn.query("insert into __migrations (name) values (?)", [file]);
    ran++;
  }

  console.log(
    ran ? `migrate: applied ${ran} migration(s)` : "migrate: already up to date"
  );
} finally {
  await conn.end();
}
