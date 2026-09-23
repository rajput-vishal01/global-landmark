/**
 * Runnable check for the Deal of the Week date maths (ponytail: one
 * assert-based check, no test framework — same tsc-to-a-temp-dir trick as
 * check-taxonomy.mjs).
 *
 * Run: node scripts/check-week.mjs
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "gl-week-"));

try {
  execSync(
    `npx tsc lib/week.ts --outDir "${out}" --rootDir lib --target es2022 ` +
      `--module commonjs --esModuleInterop --skipLibCheck`,
    { stdio: "pipe" }
  );
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));
  const require = createRequire(join(out, "noop.cjs"));
  const week = require(join(out, "week.js"));

  // A week runs Monday to Sunday, and Sunday belongs to the week it ends.
  assert.equal(week.mondayOf("2026-09-23"), "2026-09-21", "Wednesday maps to its Monday");
  assert.equal(week.mondayOf("2026-09-21"), "2026-09-21", "Monday maps to itself");
  assert.equal(week.mondayOf("2026-09-27"), "2026-09-21", "Sunday closes the week that began on the 21st");
  assert.deepEqual(week.weekOf("2026-09-23"), { startsAt: "2026-09-21", endsAt: "2026-09-27" });

  // Month and year ends are where naive date maths breaks.
  assert.equal(week.addDays("2026-12-31", 1), "2027-01-01", "crosses new year");
  assert.equal(week.mondayOf("2027-01-01"), "2026-12-28", "a Friday in January belongs to a December Monday");
  assert.equal(week.addDays("2028-02-28", 1), "2028-02-29", "leap day exists");

  // Repeat scheduling keeps the run's own length and start day — a sale can
  // open on any date, so nothing is snapped to a Monday here.
  const thu = week.repeatWindow("2026-10-08", "2026-10-14", 4);
  assert.equal(thu.length, 4);
  assert.deepEqual(thu[0], { startsAt: "2026-10-08", endsAt: "2026-10-14" }, "the first run is what was asked for");
  assert.deepEqual(thu[1], { startsAt: "2026-10-15", endsAt: "2026-10-21" }, "the next starts the day after");
  assert.equal(thu[3].endsAt, "2026-11-04");
  for (let i = 1; i < thu.length; i++) {
    assert.equal(week.addDays(thu[i - 1].endsAt, 1), thu[i].startsAt, "runs go back to back");
    assert.equal(week.overlaps(thu[i - 1], thu[i]), false, "and never overlap");
  }

  // Any length, including a single day and a fortnight over a month end.
  assert.equal(week.lengthInDays("2026-10-08", "2026-10-08"), 1, "one day counts as one");
  assert.equal(week.lengthInDays("2026-10-08", "2026-10-14"), 7);
  const oneDay = week.repeatWindow("2026-10-31", "2026-10-31", 3);
  assert.deepEqual(oneDay.map((w) => w.startsAt), ["2026-10-31", "2026-11-01", "2026-11-02"], "single days repeat daily");
  const fortnight = week.repeatWindow("2026-12-24", "2027-01-06", 2);
  assert.deepEqual(fortnight[1], { startsAt: "2027-01-07", endsAt: "2027-01-20" }, "a run across new year repeats cleanly");
  assert.equal(week.rangeLabel("2026-10-08", "2026-10-14").includes("Oct"), true);

  // Overlap is inclusive at both ends — a shared day is a clash.
  assert.equal(
    week.overlaps({ startsAt: "2026-10-05", endsAt: "2026-10-11" }, { startsAt: "2026-10-11", endsAt: "2026-10-17" }),
    true,
    "touching on one day counts as an overlap"
  );
  assert.equal(
    week.overlaps({ startsAt: "2026-10-05", endsAt: "2026-10-11" }, { startsAt: "2026-10-12", endsAt: "2026-10-18" }),
    false
  );

  // The suggested week skips what is taken and never offers a finished one.
  const taken = [
    { startsAt: "2026-09-21", endsAt: "2026-09-27" },
    { startsAt: "2026-09-28", endsAt: "2026-10-04" },
  ];
  assert.equal(week.nextFreeWeek("2026-09-23", taken), "2026-10-05", "skips both booked weeks");
  assert.equal(week.nextFreeWeek("2026-09-23", []), "2026-09-21", "this week when nothing is booked");
  assert.equal(
    week.nextFreeWeek("2026-09-23", [{ startsAt: "2026-08-03", endsAt: "2026-08-09" }]),
    "2026-09-21",
    "a window that has already ended does not block anything"
  );

  assert.equal(week.isDate("2026-10-05"), true);
  for (const bad of ["", "05-10-2026", "2026-13-01", "2026-10-5", "yesterday"]) {
    assert.equal(week.isDate(bad), false, `not a date: ${bad}`);
  }

  console.log("check-week: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
