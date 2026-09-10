#!/usr/bin/env node
/**
 * Two assertions about the Udyam certificate's contents.
 *
 * 1. The identity fields the site is verified against are actually on the
 *    site. Meta's business verification is a document-matching exercise: if
 *    the registered name, the address or the registration number drifts from
 *    the certificate by one edit, the review fails and nobody is told which
 *    line did it. This catches a well-meaning copy tidy.
 *
 * 2. The certificate's private fields are nowhere in the repo. The same PDF
 *    that carries the address also carries the proprietor's PAN, a State
 *    Bank account number and IFSC, and a turnover figure. None of that is
 *    identity anyone needs from a website, and all of it is fraud material.
 *    A grep is a blunt instrument, which is the point — it fires whether the
 *    leak arrives via lib/data.ts, a seed file, a doc, or a pasted comment.
 *
 * Runs in `npm run check`, so CI fails before a deploy rather than after.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

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
 * Values from the certificate that must appear NOWHERE. Written as split
 * fragments so this file does not itself become the leak it is testing for.
 */
const FORBIDDEN = [
  { label: "proprietor PAN", value: "AIYPG" + "6403B" },
  { label: "bank account number", value: "33530" + "884322" },
  { label: "bank IFSC", value: "SBIN00" + "11905" },
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
  ".json", ".md", ".sql", ".css", ".yml", ".yaml", ".env.example",
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
  // This file names the fragments on purpose.
  if (path.endsWith("check-legal.mjs")) continue;
  const source = readFileSync(path, "utf8");
  for (const { label, value } of FORBIDDEN) {
    if (source.includes(value)) {
      failures.push(
        `${path.slice(ROOT.length)} contains the ${label} from the Udyam ` +
          `certificate. That must never be committed or published — remove ` +
          `it, and rotate it if it has already been pushed.`
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
