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

/**
 * Must never reach the page. Third column: the categories newsdata.io
 * attaches — cricket and police stories arrive filed as sports / crime, and
 * that label is what removes them now that a Tricity mention alone qualifies.
 */
const REJECT = [
  ["India beat Australia in Mohali T20 thriller", "PCA Stadium hosted a full house.", ["sports"]],
  ["Cricket: Punjab Kings training camp begins in Mohali", null, ["sports"]],
  ["Chandigarh police bust fake call centre", "Accused had bought property in Zirakpur.", ["crime"]],
  ["Panchkula man cheated of Rs 20 lakh by online fraudsters", null, ["crime"]],
  ["Chandigarh film festival opens", null, ["entertainment"]],
  // Violence and sentencing, even when uncategorised.
  ["Man murdered in Zirakpur over land dispute", "The property dealer was attacked."],
  ["Property dealer shot dead in Mohali", null],
  ["Two arrested for assaulting realtor in Panchkula", null],
  ["Road accident on Zirakpur highway kills two", "Near a housing society."],
  ["Realtor murdered in Kharar plot row", null],
  ["Builder assaulted at Mohali site", null],
  ["Killings near Panchkula housing colony", null],
  ["Body found in Kharar under-construction building", null],
  ["Punjab: ED secures 18 months' jail for postal official", "Property attached in Chandigarh."],
  ["Mohali realtor convicted in cheating case, sentenced to 3 years", null],
  // Hospitality PR that calls a hotel a property.
  ["Lords Hotels & Resorts Showcases Bespoke Wedding Celebrations", "A luxury property near Chandigarh."],
  // Elsewhere, with only a passing Tricity mention in the summary.
  ["Ubud Hotels for Indian Travelers Exploring Bali", "Popular with travellers from Chandigarh."],
  ["NRI Milni in Amritsar on September 23", "Officials from Chandigarh will attend."],
  // A UT headline that is not Chandigarh's.
  ["UT administration revises Ladakh land rules", "Leh district notified."],
  // Not the Tricity at all.
  ["Mumbai real estate hits record high", "Property prices in Mumbai surged."],
  ["Gurgaon township launched by builder", null],
];

/** Tricity coverage the page keeps — property first, but civic news too now. */
const KEEP = [
  ["GMADA announces new plots scheme in Mohali sector 88", null],
  ["Chandigarh property rates revised; collector rate up 10%", null],
  ["RERA orders Zirakpur builder to refund homebuyers", null],
  ["ED lens on Rs 40-crore GMADA land waiver", "The land pooling case widens."],
  ["UT estate office to re-auction 8 residential properties", "The Chandigarh estate office said..."],
  ["Panchkula housing board opens flat applications", null],
  ["Stamp duty cut announced for Punjab, Mohali buyers gain", null],
  ["Tricity realty sees record registrations this quarter", null],
  ["Scam alert: fake builder booked for Zirakpur flat bookings", null],
  // Kept since the property requirement went (Sep 2026).
  ["UT plans split option for large industrial plots", "Chandigarh administration proposal.", ["politics"]],
  ["Mohali civic body approves new sector roads", null],
  ["Zirakpur flyover work to finish by March", null],
  // Ordinary words that contain a crime stem.
  ["GMADA extends deadline for Mohali plot allottees", null],
  ["Panchkula governing body clears housing scheme", null],
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

  for (const [title, description, categories] of REJECT) {
    assert.equal(isMarketStory(title, description, categories), false, `must reject: ${title}`);
  }
  for (const [title, description, categories] of KEEP) {
    assert.equal(isMarketStory(title, description, categories), true, `must keep: ${title}`);
  }

  // The place is the one hard requirement.
  assert.equal(isMarketStory("Property prices rise", null), false, "no Tricity place, no story");

  console.log("check-news: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
