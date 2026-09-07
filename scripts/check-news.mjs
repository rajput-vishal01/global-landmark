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
    `npx tsc lib/news-filter.ts --outDir "${out}" --rootDir lib ` +
      `--target es2022 --module commonjs --esModuleInterop --skipLibCheck`,
    { stdio: "pipe" }
  );
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));

  const require = createRequire(join(out, "noop.cjs"));
  const { isMarketStory } = require(join(out, "news-filter.js"));

  for (const [title, description] of REJECT) {
    assert.equal(isMarketStory(title, description), false, `must reject: ${title}`);
  }
  for (const [title, description] of KEEP) {
    assert.equal(isMarketStory(title, description), true, `must keep: ${title}`);
  }

  // A story needs BOTH gates, not either.
  assert.equal(isMarketStory("Mohali stadium renovated", null), false, "place alone is not enough");
  assert.equal(isMarketStory("Property prices rise", null), false, "subject alone is not enough");

  console.log("check-news: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
