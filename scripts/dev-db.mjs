// Runs before `npm run dev` (predev): brings up the compose Postgres,
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
      run("docker compose exec -T db pg_isready -U postgres -d global_landmark");
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!ready) throw new Error("Postgres did not become ready in 30s");

  run("npm run db:push", { stdio: "inherit" });
  run("npm run db:seed", { stdio: "inherit" });
  console.log("[dev-db] Database ready on localhost:5439.");
} catch (err) {
  console.warn(`[dev-db] Database setup failed: ${err.message}`);
  console.warn("[dev-db] Continuing without a database — pages fall back to empty states.");
}
