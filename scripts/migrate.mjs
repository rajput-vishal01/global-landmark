// Runs before `next build`: applies the SQL migrations in drizzle/ when a
// database is reachable (Vercel builds have DATABASE_URL). Skipped when
// unset — the Docker image build has no database and must keep working.
//
// This used to run `drizzle-kit push --force`, which diffs the schema and
// auto-accepts whatever it decides to do, including destructive statements,
// with no review step between authoring a schema change and mutating
// production data. Now every change is a reviewed .sql file applied in
// order, and `drizzle-kit migrate` records what it applied so re-running is
// a no-op.
//
// 0000_baseline.sql captures the schema as it stood before migrations
// existed and is written with IF NOT EXISTS / duplicate_object guards, so it
// applies cleanly to a database that already has those tables AND to an
// empty one.
import { execSync } from "node:child_process";

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
console.log("migrate: applying drizzle migrations...");
execSync("npx drizzle-kit migrate", { stdio: "inherit" });
