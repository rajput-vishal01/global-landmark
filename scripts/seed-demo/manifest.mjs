// Reads the seed-demo manifests in this folder and checks them against the
// admin's own rules, so scripts/seed-demo.mjs only ever writes what an admin
// form would accept. Plain Node, no TypeScript: it runs on the server.
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const APP_ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

// ─── Copies of the admin's lists ──────────────────────────────────────────────
// The server runs the seed with plain Node and has no TypeScript, so these
// are copies of lib/taxonomy/* and lib/locations.ts, the way seed.mjs copies
// CITY_CODES. checkMirrors() compares them with the real ones wherever Node
// can read .ts itself (22.18+, every dev machine here) and refuses to run if
// they have drifted. MEDIA_KINDS and parseMapsUrl come from
// lib/admin/property-parse.ts, which Node cannot import; keep them in step by hand.

const PROPERTY_TYPES = ["Residential Plot", "Independent House", "Villa", "Flat/Apartment", "Penthouse"];
const POSSESSION_STATUSES = ["Ready to Move", "Under Construction", "New Launch"];
const FURNISHINGS = ["Unfurnished", "Semi Furnished", "Fully Furnished", "Luxury Furnished"];
const FURNISHING_ITEMS = [
  "AC", "Beds", "Sofa", "Dining Table", "Wardrobes", "Refrigerator", "Washing Machine",
  "Chimney", "RO", "Microwave", "Curtains", "TV", "Geyser", "Mixer", "Other",
];
const AMENITIES = [
  "Club House", "Swimming Pool", "Gym", "Lift", "Power Backup", "Security", "CCTV",
  "Gated Community", "Children's Play Area", "Park", "Jogging Track", "Sports Facilities",
  "Community Hall", "EV Charging", "Smart Home", "Wi-Fi", "Visitor Parking", "Theatre", "Sauna",
  "Steam", "Pickleball Court", "Tennis", "Cricket", "Squash", "Badminton", "Basketball", "Salon",
  "Day Care (Kids)", "Pet Play Area", "Intercom", "Other",
];
const PARKING_TYPES = [
  "Covered Parking", "Open Parking", "Basement Parking", "Stilt Parking",
  "Two-Wheeler Parking", "Visitor Parking",
];
const PLC_ATTRIBUTES = [
  "Park Facing", "Corner Property", "Green Belt Facing", "Main Road Facing", "Highway Facing",
  "Lake View", "Hill View", "Golf Course Facing", "Garden Facing", "Floor PLC",
];
const LEGAL_FLAGS = ["RERA Registered", "CLU Approved", "Registry Available", "Freehold"];
const LOAN_FLAGS = ["Home Loan Available", "Bank Approved", "Other"];
/** Square feet per unit (lib/taxonomy/area.ts); the keys are the admin's area units. */
const SQFT_PER_UNIT = { sqft: 1, sqyd: 9, marla: 272.25, kanal: 5445, acre: 43560, biswa: 1361.25, bigha: 27225 };
const AREA_UNITS = Object.keys(SQFT_PER_UNIT);
const CITY_CODES = {
  Chandigarh: "CHD", Panchkula: "PKL", Mohali: "MOH", Zirakpur: "ZKP",
  "New Chandigarh": "NCH", Derabassi: "DRB", Kharar: "KHR",
};
const CITIES = [
  { name: "Chandigarh", localities: ["Airport Road", "IT City"] },
  { name: "Panchkula", localities: ["Sector Area", "MC Area"] },
  { name: "Zirakpur", localities: ["Peer Muchalla", "PR-7 Road", "Airport Road"] },
  { name: "Mohali", localities: ["Sector Area", "Aerocity", "IT City", "Airport Road", "PR-7 Road"] },
  { name: "New Chandigarh", localities: ["Mullanpur", "PR-8"] },
  { name: "Derabassi", localities: ["MC Area"] },
  { name: "Kharar", localities: ["PR-4", "MC Area"] },
];
const MEDIA_KINDS = ["video", "drone", "virtual_tour", "google_map", "brochure"];

// ─── Demo-only rules ──────────────────────────────────────────────────────────

/** Registration and approval claims, ruled out for invented listings. */
const FORBIDDEN_LEGAL = ["RERA Registered", "CLU Approved", "Registry Available"];
/** Stock libraries whose licence allows commercial use. Never plus.unsplash.com: Unsplash+ is paid. */
const PHOTO_HOSTS = ["images.unsplash.com", "unsplash.com", "images.pexels.com"];
export const MIN_PHOTOS = 3;
const MAX_PHOTOS = 20; // the admin's MAX_IMAGES

// ─── Ports of the admin helpers ───────────────────────────────────────────────

/** lib/slugify.ts */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function wordIndex(text, name) {
  const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(^|[^a-z0-9])${escaped}(?![a-z0-9])`).exec(text);
  return match ? match.index + match[1].length : -1;
}

/** lib/locations.ts placeFromAddress: the city named last wins, New Chandigarh before Chandigarh. */
function placeFromAddress(address) {
  let text = address.toLowerCase();
  let city = null;
  let cityAt = -1;
  for (const c of [...CITIES].sort((a, b) => b.name.length - a.name.length)) {
    const at = wordIndex(text, c.name);
    if (at < 0) continue;
    if (at > cityAt) {
      city = c;
      cityAt = at;
    }
    text = text.slice(0, at) + " ".repeat(c.name.length) + text.slice(at + c.name.length);
  }
  if (!city) {
    const owners = CITIES.filter((c) => c.localities.some((l) => wordIndex(text, l) >= 0));
    if (owners.length !== 1) return null;
    city = owners[0];
  }
  const locality = city.localities.find((l) => wordIndex(text, l) >= 0);
  return { city: city.name, locality: locality ?? null };
}

/** lib/admin/property-parse.ts parseMapsUrl: Google's own hosts only. */
function parseMapsUrl(value) {
  const s = String(value ?? "").trim().slice(0, 1000);
  if (!s) return null;
  let u;
  try {
    u = new URL(s);
  } catch {
    return "invalid";
  }
  if (u.protocol !== "https:") return "invalid";
  const host = u.hostname.toLowerCase();
  const isMaps =
    host === "maps.app.goo.gl" ||
    /^maps\.google\.[a-z.]+$/.test(host) ||
    ((host === "goo.gl" || /^(www\.)?google\.[a-z.]+$/.test(host)) && u.pathname.startsWith("/maps"));
  return isMaps ? u.toString() : "invalid";
}

/** lib/taxonomy/status.ts refCode: the sequence number is the row id, as in createProperty. */
export function refCode(city, year, seq) {
  const yy = String(year % 100).padStart(2, "0");
  return `GL-${(city && CITY_CODES[city]) || "GEN"}-${yy}-${String(seq).padStart(4, "0")}`;
}

/** property-parse.ts primaryAreaSqft: plot, then super, built-up, carpet — first one filled. */
function primaryAreaSqft(measures) {
  for (const [value, unit] of measures) {
    if (value != null && unit && Object.hasOwn(SQFT_PER_UNIT, unit)) {
      return Math.round(value * SQFT_PER_UNIT[unit]);
    }
  }
  return null;
}

// ─── Manifest validation ──────────────────────────────────────────────────────
// The admin silently drops a value outside its lists; a manifest is written
// ahead of time, so here the same lists fail loudly instead, naming the
// entry and the field.

const problems = [];
/** Shared with the runner, which adds download warnings to the same list. */
export const warnings = [];
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isEmpty = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** Field readers for one manifest entry. */
function fieldsOf(file, entry, label) {
  const bad = (field, msg) => problems.push(`${file} › ${label} › ${field}: ${msg}`);
  const warn = (field, msg) => warnings.push(`${file} › ${label} › ${field}: ${msg}`);
  return {
    bad,
    warn,
    text(field, max, required = false) {
      const v = entry[field];
      if (v != null && typeof v !== "string") {
        bad(field, "must be text");
        return null;
      }
      const t = (v ?? "").trim();
      if (!t && required) bad(field, "is required");
      if (t.length > max) bad(field, `is longer than ${max} characters`);
      return t || null;
    },
    int(field, max) {
      const v = entry[field];
      if (v == null || v === "") return null;
      if (!Number.isInteger(v) || v < 0 || v > max) {
        bad(field, `must be a whole number from 0 to ${max}`);
        return null;
      }
      return v;
    },
    choice(field, allowed, fallback = null) {
      const v = entry[field];
      if (v == null || v === "") return fallback;
      if (!allowed.includes(v)) {
        bad(field, `${JSON.stringify(v)} is not one of: ${allowed.join(", ")}`);
        return fallback;
      }
      return v;
    },
    /** A checklist: text entries, trimmed and de-duplicated; `allowed = null` is free-add. */
    list(field, allowed, max, itemMax = 120) {
      const v = entry[field];
      if (v == null) return [];
      if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
        bad(field, "must be a list of text");
        return [];
      }
      const items = [...new Set(v.map((x) => x.trim()).filter(Boolean))];
      if (items.length > max) bad(field, `has more than ${max} entries`);
      for (const item of items) {
        if (item.length > itemMax) bad(field, `"${item.slice(0, 40)}…" is longer than ${itemMax} characters`);
        if (allowed && !allowed.includes(item)) bad(field, `"${item}" is not one of: ${allowed.join(", ")}`);
      }
      return items;
    },
    date(field) {
      const v = entry[field];
      if (v == null || v === "") return null;
      if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        bad(field, "must be a yyyy-mm-dd date");
        return null;
      }
      return v;
    },
    mapsUrl(field) {
      const url = parseMapsUrl(entry[field]);
      if (url === "invalid") bad(field, "must be a Google Maps link (https://maps.app.goo.gl/… or google.com/maps…)");
      return url === "invalid" ? null : url;
    },
    photos(field, min, max) {
      const v = entry[field];
      if (!Array.isArray(v)) {
        bad(field, "must be a list of photos");
        return [];
      }
      if (v.length < min || v.length > max) bad(field, `needs ${min} to ${max} photos, has ${v.length}`);
      return v.map((p, i) => photoOf(p, (msg) => bad(`${field}[${i}]`, msg))).filter(Boolean);
    },
  };
}

const PHOTO_FIELDS = ["url", "alt", "source", "author", "licence"];

function isHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const isPhotoHost = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && PHOTO_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
};

/** { url, alt, source, author, licence } — source is the photo's page, url the file. */
function photoOf(raw, bad) {
  if (!isObject(raw)) {
    bad("must be { url, alt, source, author, licence }");
    return null;
  }
  for (const key of Object.keys(raw)) if (!PHOTO_FIELDS.includes(key)) bad(`unknown photo field "${key}"`);
  const { url, alt, source, author, licence } = raw;
  if (!isPhotoHost(url)) bad(`url must be an https link on ${PHOTO_HOSTS.join(", ")}`);
  if (typeof alt !== "string" || alt.trim().length > 300) bad("alt must be text of at most 300 characters");
  if (!isHttps(source)) bad("source must be the https page the photo came from");
  if (typeof author !== "string" || !author.trim()) bad("author is required");
  if (typeof licence !== "string" || !/unsplash|pexels/i.test(licence)) bad("licence must be the Unsplash or Pexels licence");
  return { url, alt: typeof alt === "string" ? alt.trim() : "", source, author, licence };
}

const PROJECT_FIELDS = [
  "slug", "name", "builderName", "description", "possessionStatus", "launchDate", "possessionDate",
  "totalTowers", "totalUnits", "numberOfFloors", "greenAreaValue", "greenAreaUnit", "amenities",
  "address", "mapsUrl", "legalFlags", "reraNumber", "loanFlags", "banksOnPanel", "coverImage",
];

/** projects/actions.ts parseSharedFields + createProject. */
function validateProject(raw, i) {
  const label = typeof raw?.slug === "string" && raw.slug ? raw.slug : `entry ${i + 1}`;
  const f = fieldsOf("projects.json", raw ?? {}, label);
  if (!isObject(raw)) {
    f.bad("-", "must be an object");
    return null;
  }
  for (const key of Object.keys(raw)) if (!PROJECT_FIELDS.includes(key)) f.bad(key, "not a field the admin project form writes");

  const name = f.text("name", 200, true);
  const slug = f.text("slug", 255, true);
  if (name && slug !== slugify(name)) f.bad("slug", `must be "${slugify(name)}", the slug the admin makes from the name`);
  if (!isEmpty(raw.reraNumber)) f.bad("reraNumber", "no RERA numbers in demo data");
  const address = f.text("address", 300, true);
  const place = address ? placeFromAddress(address) : null;
  if (address && !place) f.bad("address", "must name a city the site knows (Mohali, Zirakpur, …)");
  const amenities = f.list("amenities", null, 40, 100);
  for (const a of amenities) if (!AMENITIES.includes(a)) f.warn("amenities", `"${a}" is not one of the admin's checkboxes`);
  const legalFlags = f.list("legalFlags", LEGAL_FLAGS, 60);
  for (const flag of legalFlags) if (FORBIDDEN_LEGAL.includes(flag)) f.bad("legalFlags", `"${flag}" is a registration claim — not in demo data`);
  const coverImage = raw.coverImage == null ? null : photoOf(raw.coverImage, (msg) => f.bad("coverImage", msg));

  return {
    slug,
    name,
    place,
    coverImage,
    columns: {
      builder_name: f.text("builderName", 200),
      description: f.text("description", 2000),
      possession_status: f.choice("possessionStatus", POSSESSION_STATUSES),
      launch_date: f.date("launchDate"),
      possession_date: f.date("possessionDate"),
      total_towers: f.int("totalTowers", 500),
      total_units: f.int("totalUnits", 50_000),
      number_of_floors: f.int("numberOfFloors", 500),
      green_area_value: f.int("greenAreaValue", 10_000_000),
      // The form's unit select has no empty option, so a saved project always has one.
      green_area_unit: f.choice("greenAreaUnit", AREA_UNITS, "acre"),
      amenities,
      address,
      maps_url: f.mapsUrl("mapsUrl"),
      legal_flags: legalFlags,
      rera_number: null,
      loan_flags: f.list("loanFlags", LOAN_FLAGS, 60),
      banks_on_panel: f.list("banksOnPanel", null, 60),
      city: place?.city ?? null,
      locality: place?.locality ?? null,
    },
  };
}

const LISTING_FIELDS = [
  "slug", "title", "kind", "projectName", "description", "location", "mapsUrl", "propertyType",
  "plotArea", "plotAreaUnit", "builtUpArea", "builtUpAreaUnit", "superArea", "superAreaUnit",
  "carpetArea", "carpetAreaUnit", "frontFeet", "depthFeet", "plcAttributes", "furnishing",
  "furnishingInventory", "amenities", "parkingTypes", "parkingSlots", "legalFlags", "loanFlags",
  "banksOnPanel", "extras", "media", "images",
];
/** Accepted only when empty: the owner ruled these out for invented listings. */
const EMPTY_ONLY = {
  reraNumber: "no RERA numbers in demo data",
  documentationFlags: "no document claims in demo data",
  owners: "no owner details in demo data",
  documents: "no documents in demo data",
};

/** lib/admin/property-parse.ts parseProperty, in publish mode. */
function validateListing(raw, i, projectsByName) {
  const label = typeof raw?.slug === "string" && raw.slug ? raw.slug : `entry ${i + 1}`;
  const f = fieldsOf("listings.json", raw ?? {}, label);
  if (!isObject(raw)) {
    f.bad("-", "must be an object");
    return null;
  }
  for (const key of Object.keys(raw)) {
    if (LISTING_FIELDS.includes(key)) continue;
    if (Object.hasOwn(EMPTY_ONLY, key)) {
      if (!isEmpty(raw[key])) f.bad(key, EMPTY_ONLY[key]);
    } else if (key === "publicationState") {
      if (raw[key] !== "published") f.bad(key, 'demo listings are always "published"');
    } else {
      f.bad(key, "not a field the admin property form writes (prices, category and status are refused)");
    }
  }

  const title = f.text("title", 200, true);
  const slug = f.text("slug", 255, true);
  const expected = title ? slugify(title) || "property" : null;
  if (title && slug !== expected) f.bad("slug", `must be "${expected}", the slug the admin makes from the title`);
  const projectName = f.text("projectName", 200) ?? "";
  const project = projectName ? projectsByName.get(projectName.toLowerCase()) : null;
  if (projectName && !project) f.bad("projectName", `"${projectName}" is not a project in projects.json`);
  const location = f.text("location", 300, true);
  const place = location ? placeFromAddress(location) : null;
  if (location && !place) f.bad("location", "must name a city the site knows (Mohali, Zirakpur, …)");
  const propertyType = f.choice("propertyType", PROPERTY_TYPES);

  // The form always posts a unit for every measure, "sqft" unless changed.
  const measure = (key) => [f.int(key, 100_000_000), f.choice(`${key}Unit`, AREA_UNITS, "sqft")];
  const [plotArea, plotAreaUnit] = measure("plotArea");
  const [builtUpArea, builtUpAreaUnit] = measure("builtUpArea");
  const [superArea, superAreaUnit] = measure("superArea");
  const [carpetArea, carpetAreaUnit] = measure("carpetArea");
  if (propertyType === "Residential Plot" && plotArea == null) {
    f.bad("plotArea", "a Residential Plot cannot be published without a plot area");
  }

  const amenities = f.list("amenities", null, 40, 100);
  for (const a of amenities) if (!AMENITIES.includes(a)) f.warn("amenities", `"${a}" is not one of the admin's checkboxes`);
  const furnishingInventory = f.list("furnishingInventory", null, 30);
  for (const item of furnishingInventory) {
    if (!FURNISHING_ITEMS.includes(item)) f.warn("furnishingInventory", `"${item}" is not one of the admin's checkboxes`);
  }
  const legalFlags = f.list("legalFlags", LEGAL_FLAGS, 60);
  for (const flag of legalFlags) if (FORBIDDEN_LEGAL.includes(flag)) f.bad("legalFlags", `"${flag}" is a registration claim — not in demo data`);

  const extras = [];
  if (raw.extras != null) {
    if (!Array.isArray(raw.extras) || raw.extras.length > 20) f.bad("extras", "must be a list of at most 20 { title, description }");
    else {
      raw.extras.forEach((x, n) => {
        const t = typeof x?.title === "string" ? x.title.trim() : "";
        const d = typeof x?.description === "string" ? x.description.trim() : null;
        if (!t || t.length > 120 || d === null || d.length > 1000) {
          f.bad(`extras[${n}]`, "needs a title (≤ 120 characters) and a description (≤ 1000)");
        } else extras.push({ title: t, description: d });
      });
    }
  }

  const media = [];
  if (raw.media != null) {
    if (!Array.isArray(raw.media) || raw.media.length > 20) f.bad("media", "must be a list of at most 20 { kind, url, label }");
    else {
      raw.media.forEach((m, n) => {
        const label = typeof m?.label === "string" ? m.label.trim() : "";
        if (!MEDIA_KINDS.includes(m?.kind) || !isHttps(m?.url) || label.length > 120) {
          f.bad(`media[${n}]`, `needs kind (${MEDIA_KINDS.join(", ")}), an https url and a label ≤ 120 characters`);
        } else media.push({ kind: m.kind, url: m.url.trim(), label });
      });
    }
  }

  return {
    slug,
    title,
    project,
    place,
    images: f.photos("images", MIN_PHOTOS, MAX_PHOTOS),
    extras,
    media,
    fields: {
      kind: f.choice("kind", ["unit", "project"], "unit"),
      description: f.text("description", 10_000) ?? "",
      location,
      mapsUrl: f.mapsUrl("mapsUrl"),
      propertyType,
      plotArea, plotAreaUnit, builtUpArea, builtUpAreaUnit,
      superArea, superAreaUnit, carpetArea, carpetAreaUnit,
      areaSqft: primaryAreaSqft([
        [plotArea, plotAreaUnit],
        [superArea, superAreaUnit],
        [builtUpArea, builtUpAreaUnit],
        [carpetArea, carpetAreaUnit],
      ]),
      frontFeet: f.int("frontFeet", 100_000_000),
      depthFeet: f.int("depthFeet", 100_000_000),
      plcAttributes: f.list("plcAttributes", PLC_ATTRIBUTES, 60),
      furnishing: f.choice("furnishing", FURNISHINGS),
      furnishingInventory,
      amenities,
      parkingTypes: f.list("parkingTypes", PARKING_TYPES, 60),
      parkingSlots: f.int("parkingSlots", 100_000_000),
      legalFlags,
      reraNumber: null,
      loanFlags: f.list("loanFlags", LOAN_FLAGS, 60),
      banksOnPanel: f.list("banksOnPanel", null, 30),
    },
  };
}

/** deals/actions.ts createDeal, with the window relative to the day of the run. */
function validateDeal(raw, i, listingSlugs) {
  const label = typeof raw?.listing === "string" && raw.listing ? raw.listing : `entry ${i + 1}`;
  const f = fieldsOf("deals.json", raw ?? {}, label);
  if (!isObject(raw)) {
    f.bad("-", "must be an object");
    return null;
  }
  for (const key of Object.keys(raw)) if (!["listing", "startsInDays", "days"].includes(key)) f.bad(key, "unknown field");
  const listing = f.text("listing", 255, true);
  if (listing && !listingSlugs.has(listing)) f.bad("listing", "is not a slug in listings.json");
  const startsInDays = f.int("startsInDays", 365);
  const days = f.int("days", 60);
  if (startsInDays == null) f.bad("startsInDays", "is required (0 = today)");
  if (!days) f.bad("days", "must be at least 1");
  return { listing, startsInDays, days };
}

async function readManifest(dir, name, required) {
  let text;
  try {
    text = await readFile(path.join(dir, name), "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    if (required) problems.push(`${name}: not found in ${dir}`);
    return null;
  }
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    problems.push(`${name}: must be a JSON array`);
  } catch (err) {
    problems.push(`${name}: not valid JSON — ${err.message}`);
  }
  return null;
}

function duplicates(values, file, what) {
  const seen = new Set();
  for (const v of values) {
    if (!v) continue;
    if (seen.has(v)) problems.push(`${file}: ${what} "${v}" appears twice`);
    seen.add(v);
  }
}

/**
 * Compares the copies at the top of this file with lib/, in a child process
 * so the TypeScript loader's warnings stay out of this output. Skipped where
 * Node cannot read .ts (the server) — there is nothing to compare against.
 */
function checkMirrors(names, addresses) {
  if (!process.features?.typescript) return;
  const lib = (file) => JSON.stringify(pathToFileURL(path.join(APP_ROOT, "lib", file)).href);
  const script = `
    const p = await import(${lib("taxonomy/property.ts")});
    const f = await import(${lib("taxonomy/features.ts")});
    const a = await import(${lib("taxonomy/area.ts")});
    const s = await import(${lib("taxonomy/status.ts")});
    const l = await import(${lib("locations.ts")});
    const { slugify } = await import(${lib("slugify.ts")});
    const names = ${JSON.stringify(names)};
    const addresses = ${JSON.stringify(addresses)};
    console.log(JSON.stringify({
      PROPERTY_TYPES: p.PROPERTY_TYPES, POSSESSION_STATUSES: p.POSSESSION_STATUSES,
      FURNISHINGS: p.FURNISHINGS, FURNISHING_ITEMS: p.FURNISHING_ITEMS,
      AMENITIES: f.AMENITIES, PARKING_TYPES: f.PARKING_TYPES, PLC_ATTRIBUTES: f.PLC_ATTRIBUTES,
      LEGAL_FLAGS: f.LEGAL_FLAGS, LOAN_FLAGS: f.LOAN_FLAGS,
      SQFT_PER_UNIT: Object.fromEntries(a.AREA_UNITS.map((u) => [u.value, a.toSqft(10000, u.value) / 10000])),
      CITIES: l.CITIES.map((c) => ({ name: c.name, localities: c.localities.map((x) => x.name) })),
      CITY_CODES: Object.fromEntries(l.CITIES.map((c) => [c.name, s.cityCode(c.name)])),
      slugs: names.map(slugify),
      places: addresses.map(l.placeFromAddress),
    }));`;
  let real;
  try {
    const out = execFileSync(process.execPath, ["--no-warnings", "--input-type=module", "-e", script], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    real = JSON.parse(out);
  } catch (err) {
    warnings.push(`could not compare this script's lists with lib/ (${String(err.message).split("\n")[0]})`);
    return;
  }
  const mine = {
    PROPERTY_TYPES, POSSESSION_STATUSES, FURNISHINGS, FURNISHING_ITEMS, AMENITIES, PARKING_TYPES,
    PLC_ATTRIBUTES, LEGAL_FLAGS, LOAN_FLAGS, SQFT_PER_UNIT, CITIES,
    CITY_CODES: Object.fromEntries(CITIES.map((c) => [c.name, CITY_CODES[c.name] ?? "GEN"])),
    slugs: names.map(slugify),
    places: addresses.map(placeFromAddress),
  };
  const drifted = Object.keys(real).filter((k) => JSON.stringify(real[k]) !== JSON.stringify(mine[k]));
  if (drifted.length) {
    problems.push(`the admin's lists changed — update the copies in scripts/seed-demo/manifest.mjs: ${drifted.join(", ")}`);
  }
}


/**
 * Reads and checks the three manifests. `need` says which are required;
 * projects.json and listings.json are still read when present, because
 * listings name projects and deals name listings. deals.json is only read
 * when needed, so a stale deal cannot block --remove.
 */
export async function loadManifests(dir, need) {
  const rawProjects = await readManifest(dir, "projects.json", need.projects);
  const rawListings = await readManifest(dir, "listings.json", need.listings);
  const rawDeals = need.deals ? await readManifest(dir, "deals.json", true) : null;

  const projects = (rawProjects ?? []).map(validateProject).filter(Boolean);
  duplicates(projects.map((p) => p.slug), "projects.json", "slug");
  duplicates(projects.map((p) => p.name?.toLowerCase()), "projects.json", "name");
  const projectsByName = new Map(projects.map((p) => [p.name?.toLowerCase(), p]));
  const listings = (rawListings ?? []).map((raw, i) => validateListing(raw, i, projectsByName)).filter(Boolean);
  duplicates(listings.map((l) => l.slug), "listings.json", "slug");
  const photoOwner = new Map();
  for (const l of listings) {
    duplicates(l.images.map((p) => p.url), `listings.json › ${l.slug}`, "photo");
    for (const p of l.images) {
      const other = photoOwner.get(p.url);
      if (other && other !== l.slug) warnings.push(`listings.json › ${l.slug}: photo ${p.url} is also ${other}'s`);
      photoOwner.set(p.url, l.slug);
    }
  }
  const listingSlugs = new Set(listings.map((l) => l.slug));
  const deals = (rawDeals ?? []).map((raw, i) => validateDeal(raw, i, listingSlugs)).filter(Boolean);

  if (!problems.length) {
    checkMirrors(
      [...projects.map((p) => p.name), ...listings.map((l) => l.title)],
      [...projects.map((p) => p.columns.address), ...listings.map((l) => l.fields.location)]
    );
  }
  return { projects, listings, deals, problems };
}
