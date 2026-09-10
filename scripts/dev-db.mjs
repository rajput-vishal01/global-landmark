// Runs before `npm run dev` (predev): brings up the compose MySQL,
// waits for readiness, then pushes the schema and seeds (both idempotent).
// Never blocks dev — if Docker is unavailable the site still runs, with
// data pages falling back to their empty states.
import { execSync } from "node:child_process";

const run = (cmd, opts = {}) =>
  execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts });

try {
  run("docker info");
} catch {
  console.warn(
    "[dev-db] Docker is not running — starting dev without a database.\n" +
      "[dev-db] Start Docker Desktop and re-run `npm run dev` for live data."
  );
  process.exit(0);
}

try {
  run("docker compose up -d db", { stdio: "inherit" });

  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      // mysqladmin, not pg_isready. This probe was left behind by the
      // PostgreSQL -> MySQL migration and could never succeed against the
      // MySQL container, so every `npm run dev` spent 30 seconds failing
      // here and then skipped migrate and seed entirely — quietly, because
      // the catch below is deliberately non-fatal.
      run("docker compose exec -T db mysqladmin ping -h 127.0.0.1 -ugl -pdev --silent");
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!ready) throw new Error("MySQL did not become ready in 30s");

  // db:push no longer exists — drizzle-kit push was replaced by the
  // migration runner in scripts/migrate.mjs.
  run("npm run db:migrate", { stdio: "inherit" });
  run("npm run db:seed", { stdio: "inherit" });
  // 3399, the port docker-compose.yml actually publishes. 5439 was the old
  // Postgres one, and printing it sent anyone debugging a connection at the
  // wrong port.
  console.log("[dev-db] Database ready on 127.0.0.1:3399.");
} catch (err) {
  console.warn(`[dev-db] Database setup failed: ${err.message}`);
  console.warn("[dev-db] Continuing without a database — pages fall back to empty states.");
}
