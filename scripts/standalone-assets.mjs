/**
 * Copies the two directories `output: "standalone"` does NOT copy for you.
 *
 * Runs automatically as npm's `postbuild`, because forgetting it produces a
 * failure that reads as "the site is up" when it is not: the HTML renders
 * 200 and every /_next/static asset 404s, so the page arrives with no CSS
 * and no JavaScript. Verified on this app — page 200, stylesheet 404 —
 * before this script existed.
 *
 * Next's own docs describe this copy as the caller's job. Doing it here
 * rather than in a deploy script means it cannot be missed by whichever
 * path produced the build (CI, a server, or a laptop).
 */
import { cp, access } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const STANDALONE = join(ROOT, ".next", "standalone");

/** Nothing to do for a non-standalone build — don't fail one. */
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(STANDALONE))) {
  console.log("standalone-assets: no .next/standalone (not a standalone build) — nothing to do");
  process.exit(0);
}

for (const [from, to, label] of [
  [join(ROOT, ".next", "static"), join(STANDALONE, ".next", "static"), ".next/static"],
  [join(ROOT, "public"), join(STANDALONE, "public"), "public"],
]) {
  if (!(await exists(from))) {
    console.log(`standalone-assets: ${label} not present, skipped`);
    continue;
  }
  await cp(from, to, { recursive: true, force: true });
  console.log(`standalone-assets: copied ${label}`);
}

console.log("standalone-assets: done");
