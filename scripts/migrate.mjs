// Runs before `next build`: syncs the drizzle schema to the database when
// one is reachable (Vercel builds have DATABASE_URL). Skipped when unset —
// the Docker image build has no database and must keep working.
// --force auto-accepts destructive statements (CI can't answer prompts);
// review schema changes before deploying, there is no interactive gate.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("migrate: DATABASE_URL not set — skipping schema push (image build)");
  process.exit(0);
}
console.log("migrate: pushing schema to database...");
execSync("npx drizzle-kit push --force", { stdio: "inherit" });
