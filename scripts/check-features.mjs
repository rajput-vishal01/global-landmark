/**
 * Runnable check for the similar-listing ranking (R-45) and the CSV export
 * escaping — ponytail: one assert-based check over the non-trivial logic, no
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
    `npx tsc lib/similar.ts lib/csv.ts lib/page-meta.ts --outDir "${out}" --rootDir lib ` +
      `--target es2022 --module commonjs --esModuleInterop --skipLibCheck`,
    { stdio: "pipe" }
  );
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));

  const require = createRequire(join(out, "noop.cjs"));
  const { rankSimilar, similarityScore } = require(join(out, "similar.js"));
  const { csvField } = require(join(out, "csv.js"));
  const meta = require(join(out, "page-meta.js"));

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

  // --- CSV export escaping -------------------------------------------------
  // Lead names and messages are typed by anonymous visitors and the client
  // opens the export in Excel, so a field that starts a formula must stop
  // being one. Quoting alone does not disarm it.
  assert.equal(
    csvField('=HYPERLINK("http://evil","Invoice")'),
    `"'=HYPERLINK(""http://evil"",""Invoice"")"`,
    "formula is neutered and still RFC 4180 quoted"
  );
  for (const lead of ["=1+1", "+1+1", "@SUM(A1)", "-cmd|'/c calc'!A0", "\tlead"]) {
    assert.ok(csvField(lead).startsWith("'") || csvField(lead).startsWith(`"'`), `neutered: ${lead}`);
  }

  // ...but a real number must stay a number, or a numeric column turns into
  // text in the client's spreadsheet. "+1" is a bare number, not a payload:
  // a spreadsheet renders it as 1 and there is nothing to run.
  assert.equal(csvField(-4200), "-4200", "negative numbers are left alone");
  assert.equal(csvField(-3.5e4), "-35000", "scientific notation is still a number");
  assert.equal(csvField("+1"), "+1", "a signed number is not a formula");

  assert.equal(csvField('a,b'), '"a,b"', "comma forces quoting");
  assert.equal(csvField('say "hi"'), '"say ""hi"""', "inner quotes are doubled");
  assert.equal(csvField("line\nbreak"), '"line\nbreak"', "newline forces quoting");
  assert.equal(csvField(null), "", "null is an empty field");

  // --- Listing and project page titles (lib/page-meta.ts) -----------------
  // 42 characters is what " | Global Landmark" leaves inside 60.
  const unit = {
    title: "3 BHK Residence, Imperial Residency",
    kind: "unit",
    category: "sale",
    description: "",
    propertyType: "Flat/Apartment",
    configuration: "3 BHK",
    society: null,
    locality: null,
    sector: null,
    city: "Zirakpur",
    location: "Peer Muchalla, Zirakpur",
    possessionStatus: "Ready to Move",
    furnishing: null,
    project: { name: "Imperial Residency" },
  };
  assert.equal(
    meta.listingTitle(unit, "1,850 Sq Ft"),
    "3 BHK Flat in Imperial Residency, Zirakpur",
    "type, society and city; 'for Sale' dropped before the society is"
  );
  const kothi = { ...unit, propertyType: "Independent House", configuration: "5 BHK", sector: "12", city: "Panchkula", project: null };
  assert.equal(meta.listingTitle(kothi, null), "5 BHK Kothi in Sector 12, Panchkula", "a bare sector number reads as a sector");
  assert.equal(
    meta.listingTitle({ ...kothi, sector: null }, null),
    "5 BHK Kothi for Sale in Panchkula",
    "'for Sale' stays when there is room"
  );
  const noType = { ...unit, title: "3 BHK Builder Floor, Peer Muchalla Zirakpur", propertyType: null, project: null };
  assert.equal(meta.listingTitle(noType, null), "3 BHK Builder Floor in Zirakpur", "an over-long broker title keeps its first phrase and the city");
  for (const listing of [unit, kothi, noType, { ...unit, title: "x".repeat(90), kind: "project" }]) {
    assert.ok(meta.listingTitle(listing, null).length <= meta.TITLE_MAX, `title fits: ${listing.title}`);
    const description = meta.listingDescription(listing, null);
    assert.ok(description.length <= meta.DESCRIPTION_MAX, "description fits");
    assert.ok(!/₹|\bcr(ore)?\b|\blakh|\bprice\b/i.test(description), "no price in a description");
  }
  assert.equal(meta.photoAlt(unit, null, 2, 5), "3 BHK Flat in Imperial Residency, Zirakpur, photo 2 of 5");
  assert.equal(meta.clipText("one two three four", 12), "one two…", "clipped at a word, never mid-word");
  assert.equal(
    meta.projectTitle({ name: "Imperial Residency", description: null, builderName: null, locality: "Peer Muchalla", sector: null, city: "Zirakpur", possessionStatus: null }),
    "Imperial Residency, Zirakpur",
    "project title narrows to the city when locality and city are too long"
  );

  console.log("check-features: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
