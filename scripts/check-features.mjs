/**
 * Runnable check for the EMI maths (R-41) and the similar-listing ranking
 * (R-45) — ponytail: one assert-based check over the non-trivial logic, no
 * test framework.
 *
 * Run: node scripts/check-features.mjs
 *
 * Same tsc-to-a-temp-dir trick as scripts/check-taxonomy.mjs; see its header
 * for why CommonJS output is deliberate.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "gl-features-"));

try {
  execSync(
    `npx tsc lib/emi.ts lib/similar.ts --outDir "${out}" --rootDir lib ` +
      `--target es2022 --module commonjs --esModuleInterop --skipLibCheck`,
    { stdio: "pipe" }
  );
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));

  const require = createRequire(join(out, "noop.cjs"));
  const { computeEmi, seedLoanAmount, EMI_DEFAULTS } = require(join(out, "emi.js"));
  const { rankSimilar, similarityScore } = require(join(out, "similar.js"));

  // --- EMI (R-41) ----------------------------------------------------------
  // ₹50 L at 8.5% over 20 years is ₹43,391/month by the standard amortising
  // formula — the figure every Indian bank's own calculator prints.
  assert.equal(computeEmi(5_000_000, 8.5, 20).monthly, 43391, "₹50L @ 8.5% / 20y");

  // A zero rate is 0/0 in the formula; it must degrade to straight-line
  // repayment, not NaN on a money screen.
  const free = computeEmi(1_200_000, 0, 10);
  assert.equal(free.monthly, 10_000, "0% is principal / months");
  assert.equal(free.totalInterest, 0, "0% accrues no interest");

  // Garbage in must not render as a number.
  assert.equal(computeEmi(0, 8.5, 20).monthly, 0, "no principal, no EMI");
  assert.equal(computeEmi(5_000_000, 8.5, 0).monthly, 0, "no tenure, no EMI");

  const long = computeEmi(5_000_000, 8.5, 20);
  assert.ok(long.totalPayable > 5_000_000, "total payable exceeds principal");
  assert.equal(
    long.totalInterest,
    long.totalPayable - 5_000_000,
    "interest is total minus principal"
  );

  // Seeding: 80% LTV off the published price, snapped to the slider step.
  assert.equal(seedLoanAmount(10_000_000), 8_000_000, "80% LTV of ₹1 Cr");
  assert.equal(
    seedLoanAmount(null),
    EMI_DEFAULTS.fallbackLoan,
    "withheld price (R-13) falls back rather than seeding 0"
  );
  assert.equal(seedLoanAmount(100_000), EMI_DEFAULTS.minLoan, "clamped to slider minimum");
  assert.equal(
    seedLoanAmount(10_000_000_000),
    EMI_DEFAULTS.maxLoan,
    "clamped to slider maximum"
  );

  // --- Similar ranking (R-45) ---------------------------------------------
  const subject = {
    id: 1,
    category: "residential",
    propertyType: "Flat",
    configuration: "3 BHK",
    city: "Zirakpur",
    locality: "VIP Road",
    areaSqft: 1600,
    publicPrice: 9_000_000,
  };

  const sameLocality = { ...subject, id: 2 };
  const sameCityOnly = { ...subject, id: 3, locality: "Dhakoli" };
  const otherCity = { ...subject, id: 4, city: "Chandigarh", locality: "Sector 9" };

  assert.ok(
    similarityScore(subject, sameLocality) > similarityScore(subject, sameCityOnly),
    "same locality outranks same city"
  );
  assert.ok(
    similarityScore(subject, sameCityOnly) > similarityScore(subject, otherCity),
    "same city outranks a different one"
  );

  // Locality subsumes city — the two must not both score for one fact.
  assert.equal(
    similarityScore(subject, sameLocality) - similarityScore(subject, sameCityOnly),
    2,
    "locality scores 4 where city scores 2, not 6"
  );

  // Two withheld prices are not a budget match.
  const bothPor = { ...subject, id: 5, publicPrice: null };
  const porSubject = { ...subject, publicPrice: null };
  assert.equal(
    similarityScore(porSubject, bothPor),
    similarityScore(porSubject, { ...bothPor, publicPrice: 9_000_000 }),
    "null prices (R-13) never score as similar budgets"
  );

  // Blank fields must not match each other either.
  const blank = { id: 6, category: "", propertyType: "", configuration: "", city: "", locality: "" };
  assert.equal(similarityScore(blank, { ...blank, id: 7 }), 0, "empty strings never match");

  const ranked = rankSimilar(subject, [subject, otherCity, sameCityOnly, sameLocality], 3);
  assert.ok(
    !ranked.some((r) => r.id === subject.id),
    "a listing is never similar to itself"
  );
  assert.deepEqual(
    ranked.map((r) => r.id),
    [2, 3, 4],
    "ranked most-similar first"
  );
  assert.equal(rankSimilar(subject, [blank], 3).length, 0, "nothing in common is not shown");
  assert.equal(rankSimilar(subject, [sameLocality, sameCityOnly], 1).length, 1, "limit honoured");

  console.log("check-features: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
