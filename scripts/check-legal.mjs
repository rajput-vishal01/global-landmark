#!/usr/bin/env node
/**
 * Two assertions about the Udyam certificate's contents.
 *
 * 1. The identity fields Meta verifies the site against are still on the
 *    site, spelled exactly as the certificate spells them. Verification is a
 *    document-matching exercise: if the registered name, the address or the
 *    registration number drifts by one edit, the review fails and nobody is
 *    told which line did it. This catches a well-meaning copy tidy — it has
 *    already caught one.
 *
 * 2. The certificate's private fields are nowhere in the repo. The same PDF
 *    that carries the address also carries the proprietor's PAN, a bank
 *    account number and IFSC, and a turnover figure. None of that is
 *    identity a customer or a platform reviewer needs, and all of it is
 *    fraud material.
 *
 *    This is done with PATTERNS, never with the values themselves. Listing
 *    the real PAN here so the script could grep for it would have put the
 *    PAN in the repository — the exact thing being prevented, just in the
 *    file claiming to prevent it. Matching the shape instead means nothing
 *    sensitive is stored, and it catches any PAN or any bank account, not
 *    only the ones on this certificate.
 *
 * Runs in `npm run check`, so CI fails before a deploy rather than after.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/** Exact strings from the certificate that MUST appear in lib/data.ts. */
const REQUIRED = {
  "lib/data.ts": [
    "Global Landmark Realty Group",
    "UDYAM-PB-20-0137589",
    "globallandmarkrealty@gmail.com",
    "Shop No 102, TLI Business Square",
    "Adj. Sec 20, Panchkula, Peermushlla",
    "Zirakpur, SAS Nagar, Punjab 160104",
    "+91 98820-84786",
  ],
};

/**
 * Shapes that must appear nowhere.
 *
 * `near` narrows a pattern that would otherwise fire on ordinary data: a run
 * of twelve digits is a timestamp far more often than it is a bank account,
 * so that one only counts when the same line is talking about a bank.
 */
const FORBIDDEN = [
  {
    label: "an Indian PAN",
    // Five letters, four digits, one letter — the fixed PAN format.
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
  },
  {
    label: "a bank IFSC code",
    // Four letters, a literal 0, then six alphanumerics.
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  },
  {
    label: "what looks like a bank account number",
    pattern: /\b\d{11,18}\b/g,
    near: /bank|account|a\/c|ifsc|branch/i,
  },
];

/** Directories that are not ours to police. */
const SKIP = new Set([
  "node_modules",
  ".next",
  ".git",
  "uploads",
  "public",
  ".turbo",
  "coverage",
]);

const TEXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".sql", ".css", ".yml", ".yaml",
]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (TEXT.has(extname(entry))) yield path;
  }
}

const failures = [];

for (const [file, strings] of Object.entries(REQUIRED)) {
  let source;
  try {
    source = readFileSync(join(ROOT, file), "utf8");
  } catch {
    failures.push(`${file} is missing — it holds the registered identity`);
    continue;
  }
  for (const needle of strings) {
    if (!source.includes(needle)) {
      failures.push(
        `${file} no longer contains "${needle}" exactly as the Udyam ` +
          `certificate spells it. Meta compares the site against that ` +
          `document — restore the exact wording rather than tidying it.`
      );
    }
  }
}

for (const path of walk(ROOT)) {
  // The patterns above are shapes, not values, so this file cannot match
  // itself — but skipping it keeps the report readable if that ever changes.
  if (path.endsWith("check-legal.mjs")) continue;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const [i, line] of lines.entries()) {
    for (const { label, pattern, near } of FORBIDDEN) {
      if (near && !near.test(line)) continue;
      pattern.lastIndex = 0;
      if (!pattern.test(line)) continue;
      failures.push(
        `${relative(ROOT, path)}:${i + 1} contains ${label}. Personal and ` +
          `banking identifiers must never be committed or published — ` +
          `remove it, and treat it as exposed if it has already been pushed.`
      );
    }
  }
}

if (failures.length) {
  console.error("check-legal: FAILED\n");
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}

console.log("check-legal: all assertions passed");
