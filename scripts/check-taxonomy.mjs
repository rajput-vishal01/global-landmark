/**
 * Runnable check for the taxonomy helpers (ponytail: one assert-based check
 * covering the non-trivial logic, no test framework).
 *
 * Run: node scripts/check-taxonomy.mjs
 *
 * Node cannot import the .ts sources directly — ESM requires explicit file
 * extensions and the taxonomy uses TS-style extensionless imports — so this
 * compiles them to a temp dir with the already-installed tsc first.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "gl-taxonomy-"));

try {
  // CommonJS output on purpose: tsc does not rewrite TS-style extensionless
  // relative imports, and only CJS resolution tolerates them.
  execSync(
    `npx tsc lib/taxonomy/area.ts lib/taxonomy/property.ts lib/taxonomy/features.ts ` +
      `lib/taxonomy/price.ts lib/taxonomy/status.ts lib/taxonomy/collections.ts ` +
      `lib/taxonomy/sections.ts lib/locations.ts lib/admin/property-parse.ts ` +
      `--outDir "${out}" --rootDir lib --target es2022 --module commonjs --esModuleInterop --skipLibCheck`,
    { stdio: "pipe" }
  );
  // The repo's own package.json has no "type", but be explicit so these
  // emitted files are always read as CommonJS.
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));

  const require = createRequire(join(out, "noop.cjs"));
  const load = (name) => require(join(out, name));
  const area = load("taxonomy/area.js");
  const property = load("taxonomy/property.js");
  const features = load("taxonomy/features.js");
  const price = load("taxonomy/price.js");
  const status = load("taxonomy/status.js");
  const collections = load("taxonomy/collections.js");
  const locations = load("locations.js");
  const sections = load("taxonomy/sections.js");

  // --- CFF list completeness (section 2.2 of docs/REQUIREMENTS_V2.md) -------
  assert.equal(property.PROPERTY_TYPES.length, 23, "23 physical property types");
  assert.equal(property.FACINGS.length, 8, "8 compass facings");
  assert.ok(property.FACINGS.includes("South-West"), "South-West present (R-17)");
  assert.equal(property.CONFIGURATIONS.length, 12, "12 configurations");
  assert.equal(property.FURNISHING_ITEMS.length, 15, "15 furnishing items");
  assert.equal(features.AMENITIES.length, 31, "31 amenities");
  assert.equal(features.PARKING_TYPES.length, 6, "6 parking types");
  assert.equal(features.PLC_ATTRIBUTES.length, 10, "10 PLC attributes");
  assert.equal(features.DOCUMENTATION_FLAGS.length, 16, "16 documentation flags");
  assert.equal(area.AREA_UNITS.length, 7, "7 area units incl. Biswa and Bigha");
  assert.equal(status.LISTING_STATUSES.length, 7, "7 listing statuses");

  // Every amenity belongs to exactly one display group, or the public page
  // would silently drop it.
  const grouped = features.AMENITY_GROUPS.flatMap((g) => g.items);
  assert.equal(grouped.length, new Set(grouped).size, "no amenity in two groups");
  for (const a of features.AMENITIES) {
    assert.ok(grouped.includes(a), `amenity "${a}" is in a display group`);
  }
  assert.equal(grouped.length, features.AMENITIES.length, "no group item is unknown");

  // Mortgaged must never sit in the public legal list.
  assert.ok(!features.LEGAL_FLAGS.includes("Mortgaged"), "Mortgaged is internal only");

  // --- Collection mapping (R-04) -------------------------------------------
  for (const t of property.PROPERTY_TYPES) {
    assert.ok(collections.collectionOf(t, "unit"), `type "${t}" maps to a collection`);
  }
  assert.equal(collections.collectionOf("Villa", "unit"), "kothi");
  assert.equal(collections.collectionOf("Residential Plot", "unit"), "plot");
  assert.equal(collections.collectionOf("Commercial Plot", "unit"), "commercial");
  assert.equal(collections.collectionOf("R Zone Land", "unit"), "land");
  assert.equal(collections.collectionOf("Flat/Apartment", "unit"), "flats");
  // kind wins: a whole society is a Project whatever its unit type.
  assert.equal(collections.collectionOf("Flat/Apartment", "project"), "projects");
  assert.equal(collections.collectionOf(null, "unit"), null, "unknown type is not guessed");
  const covered = collections.COLLECTIONS.filter((c) => c.value !== "projects").flatMap((c) =>
    collections.typesInCollection(c.value)
  );
  assert.equal(covered.length, 23, "every physical type is reachable from a collection");

  // --- Area normalisation (R-11) -------------------------------------------
  assert.equal(area.toSqft(1, "sqft"), 1);
  assert.equal(area.toSqft(1, "sqyd"), 9);
  assert.equal(area.toSqft(1, "acre"), 43560);
  assert.equal(area.toSqft(8, "kanal"), 43560, "8 kanal = 1 acre");
  assert.equal(area.toSqft(20, "marla"), 5445, "20 marla = 1 kanal");
  assert.equal(area.toSqft(1, "bigha"), area.toSqft(20, "biswa"), "1 bigha = 20 biswa");
  assert.equal(area.toSqft(5, "unknown-unit"), null, "unknown unit does not guess");
  // Sorting across mixed units is the whole point of normalising.
  const sorted = [
    { v: 500, u: "sqyd" },
    { v: 1, u: "acre" },
    { v: 2000, u: "sqft" },
  ]
    .sort((a, b) => area.toSqft(a.v, a.u) - area.toSqft(b.v, b.u))
    .map((x) => x.u);
  assert.deepEqual(sorted, ["sqft", "sqyd", "acre"], "mixed-unit sort is by real size");
  assert.equal(area.formatArea(1200000, "sqft"), "12,00,000 Sq Ft", "Indian digit grouping");

  // --- Status to visibility (section 4.1) ----------------------------------
  assert.equal(status.isPubliclyVisible("published", "Available"), true);
  assert.equal(status.isPubliclyVisible("draft", "Available"), false, "draft never public");
  assert.equal(status.isPubliclyVisible("published", "Sold"), false, "sold never public");
  assert.equal(status.isPubliclyVisible("published", "Hold"), false);
  assert.equal(status.isPubliclyVisible("archived", "Available"), false);
  for (const s of status.LISTING_STATUSES) {
    if (s !== "Available") {
      assert.equal(status.isPubliclyVisible("published", s), false, `${s} is not public`);
    }
    assert.ok(status.STATUS_BADGE[s], `${s} has a badge style`);
  }

  // --- Reference code (R-07) -----------------------------------------------
  assert.equal(status.refCode("Panchkula", 2026, 142), "GL-PKL-26-0142");
  assert.equal(status.refCode("Zirakpur", 2026, 7), "GL-ZKP-26-0007");
  assert.equal(status.refCode(null, 2026, 1), "GL-GEN-26-0001", "unknown city falls back");
  assert.equal(status.refCode("Mohali", 2100, 1), "GL-MOH-00-0001", "century rolls over");

  // --- Brokerage and charge maths (R-13, R-31) -----------------------------
  assert.equal(price.allInPrice(null, [], null), null, "no demand price, no all-in");
  assert.equal(price.allInPrice(10_000_000, [], null), 10_000_000);
  assert.equal(
    price.allInPrice(10_000_000, [{ chargeType: "GST", amount: 5, basis: "percent", isIncludedInDemand: false }], null),
    10_500_000,
    "percent charge resolves against demand price"
  );
  assert.equal(
    price.allInPrice(10_000_000, [{ chargeType: "PLC", amount: 100, basis: "per_sqft", isIncludedInDemand: false }], 1000),
    10_100_000,
    "per-sqft charge resolves against area"
  );
  assert.equal(
    price.allInPrice(10_000_000, [{ chargeType: "Club Charges", amount: 50_000, basis: "lump_sum", isIncludedInDemand: true }], null),
    10_000_000,
    "charges already in the demand price are not double-counted"
  );

  // --- Price bands (R-13) ---------------------------------------------------
  assert.equal(price.priceBand(null), null);
  assert.equal(price.priceBand(4_000_000), "under-50l");
  assert.equal(price.priceBand(10_000_000), "1cr-2cr", "band boundary is inclusive-low");
  assert.equal(price.priceBand(120_000_000), "5cr-plus");
  assert.equal(price.formatIndianShort(12_000_000), "₹1.2 Cr");
  assert.equal(price.formatIndianShort(5_000_000), "₹50 Lakh", "trailing zeros trimmed");

  // --- Locations (R-08) -----------------------------------------------------
  assert.ok(locations.isCity("Zirakpur"), "seeded city present");
  assert.ok(!locations.isCity("Tricity"), "Tricity is a region, not a city");
  assert.ok(locations.isLocalityIn("Zirakpur", "Peer Muchalla"));
  assert.ok(!locations.isLocalityIn("Chandigarh", "Peer Muchalla"), "localities narrow by city");
  assert.deepEqual(locations.localitiesIn("Nowhere"), [], "unknown city yields none");
  assert.deepEqual(locations.localitiesIn(null), []);
  // Every city the ref-code table knows must exist in the taxonomy, or a
  // listing could carry a code for a city no filter can select.
  for (const c of locations.CITIES) {
    assert.notEqual(status.cityCode(c.name), "GEN", `city "${c.name}" has a ref-code prefix`);
  }

  // --- Section registry and the conditional map (R-12) ---------------------
  assert.equal(sections.SECTIONS.length, 20, "the CFF's twenty field groups");
  const cffNumbers = sections.SECTIONS.map((s) => s.cff);
  assert.deepEqual(
    cffNumbers,
    Array.from({ length: 20 }, (_, i) => i + 1),
    "CFF numbers run 1..20 with no gaps or duplicates"
  );
  assert.equal(
    new Set(sections.SECTIONS.map((s) => s.key)).size,
    20,
    "section keys are unique"
  );

  // Every property type resolves to a shape. A type without one would
  // silently fall back to showing all twenty sections.
  assert.deepEqual(
    sections.unmappedPropertyTypes(),
    [],
    "every property type maps to a shape"
  );
  for (const t of property.PROPERTY_TYPES) {
    assert.ok(sections.shapeOf(t), `"${t}" has a shape`);
  }

  // The rules the client stated, pinned verbatim.
  assert.ok(
    !sections.sectionsFor("Residential Plot").includes("configuration"),
    "a Residential Plot never asks for a configuration (so never for balconies)"
  );
  assert.ok(
    !sections.sectionsFor("Residential Plot").includes("furnishing"),
    "a plot is not furnished"
  );
  const flatRequired = sections.requiredFieldsFor("Flat/Apartment");
  assert.ok(
    flatRequired.includes("floorNumber") && flatRequired.includes("unitNumber"),
    "a tower flat must have floor and unit"
  );
  const plotRequired = sections.requiredFieldsFor("Residential Plot");
  assert.ok(
    !plotRequired.includes("floorNumber") && !plotRequired.includes("unitNumber"),
    "a plot needs neither floor nor unit"
  );
  assert.ok(
    sections.sectionsFor("Independent House").includes("configuration"),
    "a house still has rooms to configure"
  );
  assert.ok(
    !sections.sectionsFor("Warehouse").includes("amenities"),
    "a warehouse has no society amenities"
  );

  // Unknown or unset type must not hide anything.
  assert.equal(
    sections.sectionsFor("Something Unmapped").length,
    20,
    "an unknown type shows every section rather than hiding fields"
  );
  assert.equal(sections.sectionsFor(null).length, 20, "an unset type shows every section");
  assert.deepEqual(
    sections.requiredFieldsFor("Something Unmapped"),
    [],
    "an unknown type requires nothing"
  );

  console.log("check-taxonomy: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
