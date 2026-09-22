#!/usr/bin/env node
/**
 * Pins how a Google Places review response becomes wall cards
 * (lib/google-reviews-parse.ts): low ratings stay off the home page, the
 * reviewer's own words win over Google's translation, and nothing but an
 * http(s) URL reaches an href or src.
 *
 * Run: node scripts/check-reviews.mjs (part of `npm run check`).
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "gl-reviews-"));
try {
  execSync(
    `npx tsc lib/google-reviews-parse.ts --outDir "${out}" --rootDir lib ` +
      `--target es2022 --module commonjs --skipLibCheck`,
    { stdio: "pipe" }
  );
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));
  const { parsePlaceReviews } = createRequire(join(out, "noop.cjs"))(
    join(out, "google-reviews-parse.js")
  );

  const review = (over) => ({
    name: "places/x/reviews/1",
    rating: 5,
    relativePublishTimeDescription: "2 weeks ago",
    text: { text: "Translated" },
    originalText: { text: "Original words" },
    authorAttribution: {
      displayName: "Asha",
      uri: "https://www.google.com/maps/contrib/1",
      photoUri: "https://lh3.googleusercontent.com/a/x",
    },
    ...over,
  });

  const parsed = parsePlaceReviews({
    rating: 4.8,
    userRatingCount: 41,
    googleMapsUri: "https://maps.google.com/?cid=1",
    reviews: [
      review({}),
      review({ name: "r2", rating: 3 }),
      review({ name: "r3", rating: 1 }),
      review({ name: "r4", originalText: undefined, text: { text: "  " } }),
      review({ name: "r5", authorAttribution: { displayName: "" } }),
      review({
        name: "r6",
        authorAttribution: { displayName: "Eve", uri: "javascript:alert(1)", photoUri: "data:x" },
      }),
    ],
  });

  assert.equal(parsed.rating, 4.8);
  assert.equal(parsed.total, 41);
  assert.equal(parsed.mapsUrl, "https://maps.google.com/?cid=1");
  assert.deepEqual(
    parsed.reviews.map((r) => r.id),
    ["places/x/reviews/1", "r6"],
    "below 4 stars, empty text and nameless reviews are dropped"
  );
  assert.equal(parsed.reviews[0].text, "Original words", "the reviewer's own words, not the translation");
  assert.equal(parsed.reviews[1].authorUrl, null, "a javascript: link never reaches an href");
  assert.equal(parsed.reviews[1].photoUrl, null, "a data: URL never reaches an img src");

  const empty = parsePlaceReviews({});
  assert.deepEqual(empty, { rating: null, total: 0, mapsUrl: null, reviews: [] }, "empty place is safe");

  console.log("check-reviews: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
}
