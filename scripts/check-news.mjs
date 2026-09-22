/**
 * Runnable check for the /news relevance gate (ponytail: assert-based, no
 * test framework — same tsc-to-a-temp-dir trick as check-taxonomy.mjs).
 *
 * Run: node scripts/check-news.mjs
 *
 * This exists because the gate shipped wrong once. It used to run two
 * tiers: property stories, then ANY Tricity story that was not crime, to
 * keep the grid full on thin days. Mohali has an international cricket
 * stadium, so the second tier published match reports; and the crime
 * regex used \bmurder\b, which matches "murder" but not "murdered", so
 * violent copy walked through on inflection alone.
 *
 * The headlines below are the shapes that actually appeared. Nothing here
 * calls newsdata.io — the gate is a pure predicate, which is the point.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "gl-news-"));

/** Off-topic or violent — must never reach the page. */
const REJECT = [
  ["India beat Australia in Mohali T20 thriller", "PCA Stadium hosted a full house."],
  ["Cricket: Punjab Kings training camp begins in Mohali", null],
  ["Chandigarh weather: heavy rain expected today", null],
  ["Punjab politics heats up ahead of polls", "Chandigarh sees protests."],
  ["Chandigarh college admissions open", null],
  ["Man murdered in Zirakpur over land dispute", "The property dealer was attacked."],
  ["Property dealer shot dead in Mohali", null],
  ["Two arrested for assaulting realtor in Panchkula", null],
  ["Road accident on Zirakpur highway kills two", "Near a housing society."],
  ["Realtor murdered in Kharar plot row", null],
  ["Builder assaulted at Mohali site", null],
  ["Killings near Panchkula housing colony", null],
  // A conviction that happens to name a Tricity city and a seized property.
  ["Punjab: ED secures 18 months' jail for postal official", "Property attached in Chandigarh."],
  ["Mohali realtor convicted in cheating case, sentenced to 3 years", null],
  // Hospitality PR that calls a hotel a property.
  ["Lords Hotels & Resorts Showcases Bespoke Wedding Celebrations", "A luxury property near Chandigarh."],
  // Crime that only mentions property in its SUMMARY — the headline is not about property.
  ["Chandigarh police bust fake call centre", "Accused had bought property in Zirakpur."],
  ["Panchkula man cheated of Rs 20 lakh by online fraudsters", "He had listed his property for sale."],
  // Property, but not our market.
  ["Mumbai real estate hits record high", "Property prices in Mumbai surged."],
  ["Gurgaon township launched by builder", null],
];

/** Genuine Tricity market coverage — including money-crime, which is news. */
const KEEP = [
  ["GMADA announces new plots scheme in Mohali sector 88", null],
  ["Chandigarh property rates revised; collector rate up 10%", null],
  ["RERA orders Zirakpur builder to refund homebuyers", null],
  ["ED lens on Rs 40-crore GMADA land waiver", "The land pooling case widens."],
  ["Panchkula housing board opens flat applications", null],
  ["Stamp duty cut announced for Punjab, Mohali buyers gain", null],
  ["Tricity realty sees record registrations this quarter", null],
  ["Scam alert: fake builder booked for Zirakpur flat bookings", null],
];

try {
  execSync(
    `npx tsc lib/news-filter.ts lib/news-queries.ts --outDir "${out}" --rootDir lib ` +
      `--target es2022 --module commonjs --esModuleInterop --skipLibCheck`,
    { stdio: "pipe" }
  );
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));

  const require = createRequire(join(out, "noop.cjs"));
  const { isMarketStory } = require(join(out, "news-filter.js"));
  const { PROPERTY_QUERIES, MARKET_QUERIES, MAX_QUERY_LENGTH } = require(
    join(out, "news-queries.js")
  );

  // newsdata.io 422s any query over the limit, on every refresh, silently —
  // the page just shows fewer stories. Two queries shipped that way.
  for (const q of [...PROPERTY_QUERIES, ...MARKET_QUERIES]) {
    assert.ok(
      q.length <= MAX_QUERY_LENGTH,
      `news query is ${q.length} chars, newsdata.io rejects over ${MAX_QUERY_LENGTH}: ${q}`
    );
  }

  for (const [title, description] of REJECT) {
    assert.equal(isMarketStory(title, description), false, `must reject: ${title}`);
  }
  for (const [title, description] of KEEP) {
    assert.equal(isMarketStory(title, description), true, `must keep: ${title}`);
  }

  // newsdata.io's own category wins over any keyword.
  assert.equal(
    isMarketStory("Zirakpur builder booked for flat fraud", null, ["crime"]),
    false,
    "an article the API files under crime is dropped"
  );
  assert.equal(
    isMarketStory("GMADA plots scheme opens in Mohali", null, ["business", "top"]),
    true,
    "a business-filed property story is kept"
  );
  // The property subject has to be in the headline, not just the summary.
  assert.equal(
    isMarketStory("Mohali civic body meeting held", "Discussed housing in sector 70."),
    false,
    "property in the summary alone is not enough"
  );

  // A story needs BOTH gates, not either.
  assert.equal(isMarketStory("Mohali stadium renovated", null), false, "place alone is not enough");
  assert.equal(isMarketStory("Property prices rise", null), false, "subject alone is not enough");

  console.log("check-news: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
