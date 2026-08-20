/**
 * The section 4.1 gate: internal data must never reach a public page or a
 * client bundle. Run against a running site at the end of every phase.
 *
 *   node scripts/leak-check.mjs [baseUrl]
 *
 * It fetches the public surfaces, follows every client JS chunk the pages
 * reference, and greps the lot for values that exist only in internal
 * tables. Exits non-zero on the first hit, because a leak is a stop.
 *
 * The needles are seeded by scripts/seed.mjs so this is runnable on a fresh
 * database; override with LEAK_NEEDLES="a,b,c" to check real production
 * values instead.
 */
const base = process.argv[2] || process.env.SITE_URL || "http://127.0.0.1:3000";

/** Each needle is a value that lives ONLY in an internal table. */
const DEFAULT_NEEDLES = [
  ["owner mobile", "9876500011"],
  ["owner alt mobile", "9876500022"],
  ["owner name", "Leakcheck Owner"],
  ["owner address", "Leakcheck Address"],
  ["circle rate", "733377"],
  ["market value note", "Leakcheck circle rate note"],
  ["internal note", "Leakcheck internal note"],
  ["withheld demand price", "244466600"],
  ["private charge amount", "588899"],
  // The reference code is the internal value easiest to leak by accident:
  // it looks like a harmless label, so it slips into cards and meta tags in
  // a way an owner's phone number never would.
  ["reference code", "GL-PKL-26-"],
  ["source/dealer name", "Leakcheck Dealer Firm"],
  // A legal document filename is the sneakiest leak of all: it reaching a
  // sitemap, a JSON-LD block, or a client bundle looks harmless enough that
  // a human reviewer skims past it, unlike an owner's phone number.
  ["legal doc filename", "Leakcheck-Registry.pdf"],
  ["legal doc storage key", "a1b2c3d4e5f6"],
];

const needles = process.env.LEAK_NEEDLES
  ? process.env.LEAK_NEEDLES.split(",").map((v, i) => [`custom ${i + 1}`, v.trim()])
  : DEFAULT_NEEDLES;

/**
 * Pages to sweep. Override with LEAK_PAGES="/a,/b" to point at a property
 * entered through the admin rather than the seeded one — the default list
 * names a seeded slug, so on its own it would pass trivially against a
 * listing a broker actually typed, which is the case that matters.
 */
const PAGES = process.env.LEAK_PAGES
  ? process.env.LEAK_PAGES.split(",").map((p) => p.trim()).filter(Boolean)
  : [
      "/",
      "/properties",
      "/properties/panchkula-corner-kothi",
      "/api/search?q=panchkula",
      "/sitemap.xml",
    ];

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": "gl-leak-check" } });
  if (!res.ok && res.status !== 404) {
    throw new Error(`${url} -> HTTP ${res.status}`);
  }
  return res.text();
}

const failures = [];
let scanned = 0;

for (const page of PAGES) {
  const url = new URL(page, base).toString();
  let html;
  try {
    html = await get(url);
  } catch (err) {
    console.error(`  ! could not fetch ${page}: ${err.message}`);
    process.exitCode = 1;
    continue;
  }
  scanned++;

  // The served HTML carries the RSC flight payload inline, so this covers
  // both the rendered markup and the serialized server props.
  for (const [label, needle] of needles) {
    if (html.includes(needle)) failures.push({ where: page, label, needle });
  }

  // Every client chunk the page pulls in — a leak can hide in a bundle that
  // the markup itself never prints.
  const chunks = [...new Set(html.match(/\/_next\/static\/[^"'\s]+?\.js/g) ?? [])];
  for (const chunk of chunks) {
    let js;
    try {
      js = await get(new URL(chunk, base).toString());
    } catch {
      continue;
    }
    scanned++;
    for (const [label, needle] of needles) {
      if (js.includes(needle)) failures.push({ where: chunk, label, needle });
    }
  }
}

console.log(`leak-check: scanned ${scanned} responses across ${PAGES.length} pages`);

if (failures.length) {
  console.error(`\nLEAK DETECTED — ${failures.length} hit(s):`);
  for (const f of failures) {
    console.error(`  ${f.label} ("${f.needle}") found in ${f.where}`);
  }
  process.exit(1);
}

console.log("leak-check: no internal values found in HTML or client JS");
