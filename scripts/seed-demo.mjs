// Demo content for a site that would otherwise look empty: invented projects
// in real Tricity localities, published listings with real photographs, and
// Deal of the Week windows. Manifests and rules: scripts/seed-demo/README.md.
//
//   node scripts/seed-demo.mjs [--dry-run] [--remove] [--only=projects|listings|deals] [--dir=<folder>]
//
// ADD-ONLY, and safe to re-run. An existing slug is skipped, never updated,
// and no row this script did not create is ever changed or deleted. It writes
// exactly what the admin actions write (app/admin/(panel)/properties/actions.ts,
// projects/actions.ts, deals/actions.ts), so a demo row is an ordinary row
// the admin can edit or delete.
//
// THE PUBLIC SITE IS CACHED. Public reads sit in unstable_cache under the
// "site-data" tag, the pages are ISR, and only revalidatePublicSite()
// (lib/admin/revalidate.ts, which every admin save calls) clears them. That
// is a Next.js API that only works inside the running server, so a script
// writing straight to MySQL cannot bust the cache: the site keeps serving the
// old pages until an admin save or the hourly revalidate. Hence the last line
// this prints — save one demo listing in the admin. Not Settings → Save: that
// copies the code defaults into the database overrides.
import { createHash } from "node:crypto";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { MIN_PHOTOS, isPhotoHost, loadManifests, refCode, warnings } from "./seed-demo/manifest.mjs";
import { KEY_PATTERN, referencedKeys, uploadDir } from "./upload-refs.mjs";

try {
  process.loadEnvFile();
} catch {
  /* no .env — rely on the real environment */
}

const APP_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const USAGE =
  "usage: node scripts/seed-demo.mjs [--dry-run] [--remove] [--only=projects|listings|deals] [--dir=<folder>]";

const args = process.argv.slice(2);
const unknownArgs = args.filter(
  (a) => !/^--(dry-run|remove|only=(projects|listings|deals)|dir=.+)$/.test(a)
);
if (unknownArgs.length) {
  console.error(`seed-demo: unknown option ${unknownArgs.join(" ")}\n${USAGE}`);
  process.exit(1);
}
const optionValue = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const DRY = args.includes("--dry-run");
const REMOVE = args.includes("--remove");
const ONLY = optionValue("only");
const DIR = path.resolve(optionValue("dir") ?? path.join(APP_ROOT, "scripts", "seed-demo"));
const wants = (part) => !ONLY || ONLY === part;


// ─── Demo rules ───────────────────────────────────────────────────────────────

/**
 * How a demo listing is recognised, by --remove and by a person in the admin.
 * "Dealer", not "Global Landmark": the admin form posts an empty source name
 * whenever Global Landmark is selected, so the first admin save — which is
 * how the cache gets refreshed after seeding — would erase the marker.
 */
const DEMO_ADDED_BY = "Dealer";
const DEMO_SOURCE = "Demo data";
const MAX_BYTES = 20 * 1024 * 1024; // lib/storage.ts MAX_UPLOAD_BYTES
const MIN_WIDTH = 2000;
const TIMEOUT_MS = 60_000;
const PARALLEL = 4;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
// JPEG first: imgix (Unsplash) otherwise answers auto=format with AVIF or WebP.
const ACCEPT = "image/jpeg,image/png;q=0.9";

/** Today in the site's timezone (lib/db/queries.ts todayIST), which decides the live deal. */
const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

function addDays(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// ─── Photos ───────────────────────────────────────────────────────────────────

const UPLOAD_DIR = uploadDir();
/** <UPLOAD_DIR>/<public|private>/<first two hex>/<key>, as lib/storage.ts resolveStoragePath. */
const storagePath = (key, visibility = "public") => path.join(UPLOAD_DIR, visibility, key.slice(0, 2), key);
/** The stored key in a column value — a bare key or one of our /api/images/<key> URLs. */
function keyOf(value) {
  if (typeof value !== "string") return null;
  const key = value.startsWith("/api/images/") ? value.slice("/api/images/".length) : value;
  return KEY_PATTERN.test(key) ? key : null;
}

const failure = (message, final = false) => Object.assign(new Error(message), { final });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

/** One try plus two retries; a 4xx or a bad file is final. */
async function withRetries(fn) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (err.final) break;
      if (attempt < 3) await sleep(1500 * attempt);
    }
  }
  throw last;
}

async function request(url, method) {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    headers: { "user-agent": UA, accept: ACCEPT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw failure(`HTTP ${res.status}`, res.status < 500 && res.status !== 429);
  if (!isPhotoHost(res.url)) throw failure(`redirected off the photo hosts, to ${new URL(res.url).hostname}`, true);
  if (Number(res.headers.get("content-length")) > MAX_BYTES) throw failure("over the 20 MB limit", true);
  return res;
}

/** lib/storage.ts looksLikeImage, with the extension decided by the bytes. AVIF needs its own brand. */
function imageExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(buf.toString("ascii", 8, 12))) return "avif";
  return null;
}

/** Pixel width of a JPEG (its SOF marker) or PNG (IHDR); null for anything else. */
function imageWidth(buf) {
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return buf.readUInt32BE(16);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xff) {
      i++;
      continue;
    }
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) return buf.readUInt16BE(i + 7);
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/** Downloads one photo into memory, checked; nothing touches the disk yet. */
function download(photo) {
  return withRetries(async () => {
    const res = await request(photo.url, "GET");
    const chunks = [];
    let size = 0;
    for await (const chunk of res.body) {
      size += chunk.length;
      if (size > MAX_BYTES) throw failure("over the 20 MB limit", true);
      chunks.push(chunk);
    }
    const buf = Buffer.concat(chunks);
    const ext = imageExt(buf);
    if (!ext) throw failure("not a JPEG, PNG, WebP or AVIF file", true);
    return { buf, ext, width: imageWidth(buf) };
  });
}

/** --dry-run: a HEAD request, nothing downloaded. */
async function headCheck(photo) {
  const res = await withRetries(() => request(photo.url, "HEAD"));
  const type = res.headers.get("content-type") ?? "";
  if (!/^image\/(jpeg|png|webp|avif)\b/.test(type)) throw failure(`served as "${type || "no type"}"`);
}

/** Every photo of one entry, 4 at a time; a failure is a warning and a gap. */
async function fetchAll(photos, owner) {
  const fetched = new Array(photos.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < photos.length) {
      const i = next++;
      const photo = photos[i];
      try {
        if (DRY) {
          await headCheck(photo);
          fetched[i] = { photo };
        } else {
          const file = await download(photo);
          if (file.width != null && file.width < MIN_WIDTH) {
            warnings.push(`${owner}: photo ${i + 1} is ${file.width}px wide, under ${MIN_WIDTH}px (${photo.url})`);
          }
          fetched[i] = { photo, ...file };
        }
      } catch (err) {
        warnings.push(`${owner}: photo ${i + 1} skipped — ${err.message} (${photo.url})`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, photos.length) }, worker));
  return fetched.filter(Boolean);
}

const stats = { filesWritten: 0, bytesWritten: 0, filesReused: 0, photoBytes: 0 };

/**
 * Writes one photo exactly where an admin upload lands (lib/storage.ts
 * storeFile): named by the SHA-256 of its bytes, never re-encoded. Through
 * a temp file and a rename, so an interrupted run cannot leave a half-written
 * file under a final name that later runs would trust.
 */
async function store({ buf, ext }) {
  const key = `${createHash("sha256").update(buf).digest("hex")}.${ext}`;
  const target = storagePath(key);
  stats.photoBytes += buf.length;
  const existing = await stat(target).catch(() => null);
  if (existing?.size === buf.length) {
    stats.filesReused++;
    return { key, url: `/api/images/${key}`, isNew: false };
  }
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(temp, buf);
    await rename(temp, target);
  } catch (err) {
    await unlink(temp).catch(() => {});
    throw err;
  }
  stats.filesWritten++;
  stats.bytesWritten += buf.length;
  return { key, url: `/api/images/${key}`, isNew: true };
}

/** Undo for a failed insert: only files this run created, which nothing else can point at yet. */
async function discard(stored) {
  for (const s of stored) if (s.isNew) await unlink(storagePath(s.key)).catch(() => {});
}

// ─── Database ─────────────────────────────────────────────────────────────────

let conn;
const all = async (sql, params = []) => (await conn.execute(sql, params))[0];
const one = async (sql, params = []) => (await all(sql, params))[0] ?? null;
const marks = (list) => list.map(() => "?").join(", ");
const json = (value) => JSON.stringify(value ?? []);
const line = (mark, slug, note) => console.log(`  ${mark} ${String(slug).padEnd(46)} ${note}`);
const counts = { projects: [0, 0], listings: [0, 0], deals: [0, 0] }; // [added, skipped]

async function seedProjects(projects) {
  console.log("\nprojects");
  for (const p of projects) {
    const owner = `project ${p.slug}`;
    if (await one("select id from projects where slug = ?", [p.slug])) {
      line("=", p.slug, "already there — skipped");
      counts.projects[1]++;
      continue;
    }
    const sameName = await one("select slug from projects where lower(name) = ?", [p.name.toLowerCase()]);
    if (sameName) {
      warnings.push(`${owner}: a project named "${p.name}" already exists as "${sameName.slug}" — left alone`);
      line("!", p.slug, `name taken by "${sameName.slug}" — skipped`);
      counts.projects[1]++;
      continue;
    }

    let cover = null;
    if (p.coverImage) {
      const [fetched] = await fetchAll([p.coverImage], owner);
      if (fetched && !DRY) cover = await store(fetched);
    }
    const where = [p.place.city, p.place.locality].filter(Boolean).join(", ");
    if (DRY) {
      line("+", p.slug, `would add · ${where}${p.coverImage ? " · cover photo" : ""}`);
      counts.projects[0]++;
      continue;
    }
    const c = { ...p.columns, cover_image: cover?.url ?? null };
    try {
      await conn.execute(
        `insert into projects (name, slug, builder_name, description, possession_status, launch_date,
           possession_date, total_towers, total_units, number_of_floors, green_area_value, green_area_unit,
           amenities, address, maps_url, cover_image, legal_flags, rera_number, loan_flags, banks_on_panel,
           city, locality)
         values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          p.name, p.slug, c.builder_name, c.description, c.possession_status, c.launch_date,
          c.possession_date, c.total_towers, c.total_units, c.number_of_floors, c.green_area_value,
          c.green_area_unit, json(c.amenities), c.address, c.maps_url, c.cover_image, json(c.legal_flags),
          c.rera_number, json(c.loan_flags), json(c.banks_on_panel), c.city, c.locality,
        ]
      );
    } catch (err) {
      if (cover) await discard([cover]);
      throw err;
    }
    line("+", p.slug, `added · ${where}${cover ? " · cover photo" : ""}`);
    counts.projects[0]++;
  }
}

/**
 * What the property form fills in when a broker files a unit under a project
 * (lib/admin/project-prefill.ts applyProject): empty text takes the project's
 * value, checklists gain the project's ticks, nothing typed is overwritten.
 */
function inherit(fields, project) {
  if (!project) return fields;
  const union = (mine, theirs) => [...new Set([...mine, ...(theirs ?? [])])];
  const reraNumber = fields.reraNumber || project.rera_number || null;
  return {
    ...fields,
    location: fields.location || project.address,
    mapsUrl: fields.mapsUrl || project.maps_url || null,
    amenities: union(fields.amenities, project.amenities),
    legalFlags: union(fields.legalFlags, [...(project.legal_flags ?? []), ...(reraNumber ? ["RERA Registered"] : [])]),
    reraNumber,
    loanFlags: union(fields.loanFlags, project.loan_flags),
    banksOnPanel: union(fields.banksOnPanel, project.banks_on_panel),
  };
}

/** Returns the slugs it added (or, in a dry run, would add). */
async function seedListings(listings, plannedProjects) {
  console.log("\nlistings");
  const added = new Set();
  for (const l of listings) {
    const owner = `listing ${l.slug}`;
    if (await one("select id from properties where slug = ?", [l.slug])) {
      line("=", l.slug, "already there — skipped");
      counts.listings[1]++;
      continue;
    }

    // resolveProjectId(): the project is found by name, case-insensitively.
    // Unlike the admin this never creates one, and it refuses a same-named
    // project that is not the demo one, so no real project gains demo units.
    let project = null;
    if (l.project) {
      project = await one(
        `select id, slug, address, maps_url, amenities, legal_flags, loan_flags, banks_on_panel, rera_number
           from projects where lower(name) = ?`,
        [l.project.name.toLowerCase()]
      );
      // A dry run counts a project it would add as present.
      if (!project && DRY && plannedProjects.has(l.project.slug)) project = { slug: l.project.slug };
      const reason = !project
        ? `project "${l.project.name}" is not in the database — seed the projects first`
        : project.slug !== l.project.slug
          ? `"${l.project.name}" in the database is "${project.slug}", not the demo project`
          : null;
      if (reason) {
        warnings.push(`${owner}: skipped — ${reason}`);
        line("!", l.slug, "skipped (project)");
        counts.listings[1]++;
        continue;
      }
    }

    const fetched = await fetchAll(l.images, owner);
    if (fetched.length < MIN_PHOTOS) {
      warnings.push(`${owner}: skipped — only ${fetched.length} of ${l.images.length} photos usable, ${MIN_PHOTOS} needed`);
      line("!", l.slug, `skipped — ${fetched.length} of ${l.images.length} photos usable`);
      counts.listings[1]++;
      continue;
    }
    const where = `${l.place.city}${l.project ? ` · ${l.project.name}` : ""}`;
    added.add(l.slug);
    if (DRY) {
      line("+", l.slug, `would add · ${fetched.length} photos · ${where}`);
      counts.listings[0]++;
      continue;
    }

    const stored = [];
    try {
      for (const photo of fetched) stored.push({ ...(await store(photo)), alt: photo.photo.alt });
      await insertListing(l, inherit(l.fields, project), project?.id ?? null, stored);
    } catch (err) {
      await discard(stored);
      throw err;
    }
    line("+", l.slug, `added · ${stored.length} photos · ${where}`);
    counts.listings[0]++;
  }
  return added;
}

/** createProperty: the row, its ref code from the row id, then the gallery and link media. */
async function insertListing(l, f, projectId, photos) {
  await conn.beginTransaction();
  try {
    const [result] = await conn.execute(
      `insert into properties (slug, title, kind, project_id, description, publication_state, added_by,
         source_name, location, city, locality, maps_url, property_type, plot_area, plot_area_unit,
         built_up_area, built_up_area_unit, super_area, super_area_unit, carpet_area, carpet_area_unit,
         area_sqft, front_feet, depth_feet, plc_attributes, furnishing, furnishing_inventory, amenities,
         parking_types, parking_slots, legal_flags, rera_number, loan_flags, banks_on_panel,
         documentation_flags, extras)
       values (?,?,?,?,?,'published',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        l.slug, l.title, f.kind, projectId, f.description, DEMO_ADDED_BY, DEMO_SOURCE, f.location,
        l.place.city, l.place.locality, f.mapsUrl, f.propertyType, f.plotArea, f.plotAreaUnit,
        f.builtUpArea, f.builtUpAreaUnit, f.superArea, f.superAreaUnit, f.carpetArea, f.carpetAreaUnit,
        f.areaSqft, f.frontFeet, f.depthFeet, json(f.plcAttributes), f.furnishing,
        json(f.furnishingInventory), json(f.amenities), json(f.parkingTypes), f.parkingSlots,
        json(f.legalFlags), f.reraNumber, json(f.loanFlags), json(f.banksOnPanel), json([]),
        json(l.extras),
      ]
    );
    const id = result.insertId;
    await conn.execute("update properties set ref_code = ? where id = ?", [
      refCode(l.place.city, new Date().getFullYear(), id),
      id,
    ]);
    for (const [i, p] of photos.entries()) {
      await conn.execute(
        "insert into property_images (property_id, url, public_id, alt, sort_order) values (?,?,?,?,?)",
        [id, p.url, p.key, p.alt.slice(0, 300), i]
      );
    }
    for (const [i, m] of l.media.entries()) {
      await conn.execute(
        "insert into property_media (property_id, kind, url, label, sort_order) values (?,?,?,?,?)",
        [id, m.kind, m.url, m.label, i]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

/**
 * Deal of the Week. createDeal's rules — a live listing, the end on or after
 * the start — plus two of our own: only demo listings, one deal each (so a
 * re-run adds nothing), and never overlapping another deal. The home page
 * shows the earliest deal covering today, so an overlap would hide one of
 * them; a window that would overlap moves to the first free days after it.
 */
async function seedDeals(deals, plannedListings) {
  console.log("\ndeals");
  const today = todayIST();
  const windows = await all("select starts_at, ends_at from deals");
  for (const d of deals) {
    const target = await one(
      "select id, publication_state, listing_status, source_name from properties where slug = ?",
      [d.listing]
    );
    let reason = null;
    if (!target) reason = DRY && plannedListings.has(d.listing) ? null : "listing is not in the database";
    else if (target.source_name !== DEMO_SOURCE) reason = "listing is not demo data";
    else if (target.publication_state !== "published" || target.listing_status !== "Available") {
      reason = "only a listing that is live on the website can be the deal";
    } else if (await one("select id from deals where property_id = ?", [target.id])) {
      reason = "listing already has a deal";
    }
    if (reason) {
      line("=", d.listing, `skipped — ${reason}`);
      counts.deals[1]++;
      continue;
    }

    const wanted = addDays(today, d.startsInDays);
    let startsAt = wanted;
    let endsAt = addDays(startsAt, d.days - 1);
    let clash;
    while ((clash = windows.find((w) => w.starts_at <= endsAt && w.ends_at >= startsAt))) {
      startsAt = addDays(clash.ends_at, 1);
      endsAt = addDays(startsAt, d.days - 1);
    }
    windows.push({ starts_at: startsAt, ends_at: endsAt });
    const moved = startsAt !== wanted ? " (moved past an existing deal)" : "";
    if (!DRY) {
      await conn.execute("insert into deals (property_id, starts_at, ends_at) values (?,?,?)", [
        target.id,
        startsAt,
        endsAt,
      ]);
    }
    line("+", d.listing, `${DRY ? "would add" : "added"} ${startsAt} → ${endsAt}${moved}`);
    counts.deals[0]++;
  }
}

/**
 * Deletes the demo rows, then the stored files they pointed at that no row
 * of any table still names (upload-refs.mjs) — the same photo can back two
 * listings, and an admin may have reused one.
 *
 * All in one transaction, so the reference scan sees the rows already gone.
 * A dry run is the same work rolled back: its counts are exact, and nothing
 * is kept.
 */
async function removeDemo(listings, projects) {
  const removed = { listings: 0, deals: 0, projects: 0, files: 0, bytes: 0 };
  const slugs = listings?.map((l) => l.slug) ?? [];
  const demo = slugs.length
    ? await all(`select id, slug from properties where source_name = ? and slug in (${marks(slugs)})`, [DEMO_SOURCE, ...slugs])
    : [];
  const ids = demo.map((r) => r.id);
  const inIds = `(${marks(ids)})`;
  /** Stored files the deleted rows named: gallery photos, documents, project covers. */
  const candidates = new Set();
  const addKey = (value) => {
    const key = keyOf(value);
    if (key) candidates.add(key);
  };
  let referenced = new Set();

  await conn.beginTransaction();
  try {
    if (ids.length) removed.deals = (await one(`select count(*) n from deals where property_id in ${inIds}`, ids)).n;
    if (ONLY === "deals") {
      console.log(`\ndeals: ${DRY ? "would remove" : "removing"} ${removed.deals} demo deal(s)`);
      if (ids.length) await conn.execute(`delete from deals where property_id in ${inIds}`, ids);
    }

    if (wants("listings")) {
      console.log("\nlistings");
      if (ids.length) {
        for (const r of await all(`select public_id, url from property_images where property_id in ${inIds}`, ids)) {
          addKey(r.public_id);
          addKey(r.url);
        }
        for (const r of await all(`select storage_key from property_documents where property_id in ${inIds}`, ids)) {
          addKey(r.storage_key);
        }
        // Cascades to images, media, deals and every internal child table.
        await conn.execute(`delete from properties where id in ${inIds}`, ids);
      }
      for (const r of demo) line("-", r.slug, DRY ? "would remove" : "removed");
      for (const s of slugs.filter((s) => !demo.some((r) => r.slug === s))) line("=", s, "not there, or not demo data — kept");
      removed.listings = demo.length;
    }

    if (wants("projects")) {
      console.log("\nprojects");
      for (const p of projects ?? []) {
        const row = await one("select id, name, cover_image from projects where slug = ?", [p.slug]);
        if (!row) {
          line("=", p.slug, "not there");
          continue;
        }
        if (row.name.toLowerCase() !== p.name.toLowerCase()) {
          line("=", p.slug, `is "${row.name}", not the demo project — kept`);
          continue;
        }
        const { n } = await one("select count(*) n from properties where project_id = ?", [row.id]);
        if (n > 0) {
          line("=", p.slug, `kept — ${n} listing(s) still filed under it`);
          continue;
        }
        await conn.execute("delete from projects where id = ?", [row.id]);
        addKey(row.cover_image);
        removed.projects++;
        line("-", p.slug, DRY ? "would remove" : "removed");
      }
    }

    if (candidates.size) referenced = await referencedKeys(conn);
    if (DRY) await conn.rollback();
    else await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  }

  // Files only after the commit: a failed delete must never leave a live row
  // pointing at a photo that is already gone. A published document has a
  // copy in public/ as well as private/, so both go.
  for (const key of candidates) {
    if (referenced.has(key)) continue;
    for (const file of [storagePath(key), storagePath(key, "private")]) {
      const info = await stat(file).catch(() => null);
      if (!info) continue;
      if (!DRY) await unlink(file);
      removed.files++;
      removed.bytes += info.size;
    }
  }
  return removed;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { projects, listings, deals, problems } = await loadManifests(DIR, {
    projects: wants("projects") || wants("listings"),
    listings: (wants("listings") || wants("deals") || REMOVE) && !(REMOVE && ONLY === "projects"),
    deals: !REMOVE && wants("deals"),
  });
  if (problems.length) {
    console.error(`seed-demo: the manifests in ${DIR} have ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(
    `seed-demo: ${projects.length} projects, ${listings.length} listings, ${deals.length} deals in ${DIR} — manifests OK` +
      (DRY ? " (dry run: nothing will be written)" : "")
  );

  if (!process.env.DATABASE_URL) {
    if (warnings.length) console.log(`\nwarnings:\n  ${warnings.join("\n  ")}`);
    console.log("seed-demo: DATABASE_URL not set — nothing to do");
    return;
  }
  // Photos must land where the running app reads them. A relative UPLOAD_DIR
  // is one lib/storage.ts cannot serve from, and without one the app reads
  // <app root>/uploads — this directory only if it is the app root.
  if (process.env.UPLOAD_DIR && !path.isAbsolute(process.env.UPLOAD_DIR)) {
    throw new Error(`UPLOAD_DIR must be an absolute path (it is "${process.env.UPLOAD_DIR}")`);
  }
  if (!process.env.UPLOAD_DIR && path.resolve(process.cwd()) !== APP_ROOT) {
    throw new Error(`run this from the app root (${APP_ROOT}), where the app keeps ./uploads`);
  }

  conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    charset: "utf8mb4",
    // DATE columns stay yyyy-mm-dd strings, as in seed.mjs.
    dateStrings: ["DATE"],
  });
  try {
    if (REMOVE) {
      const r = await removeDemo(listings, projects);
      console.log(
        `\n${DRY ? "Would remove" : "Removed"} ${r.listings} listing(s) with ${r.deals} deal(s), ` +
          `${r.projects} project(s), ${r.files} photo file(s) (${mb(r.bytes)} MB).`
      );
      console.log(
        DRY
          ? "Dry run — nothing was changed."
          : "Public pages are cached — open any listing in /admin, press Save once, and the site refreshes."
      );
      return;
    }

    if (wants("projects")) await seedProjects(projects);
    // A dry run writes nothing, so what it would have added is passed along.
    const added = wants("listings")
      ? await seedListings(listings, new Set(DRY && wants("projects") ? projects.map((p) => p.slug) : []))
      : new Set();
    if (wants("deals")) await seedDeals(deals, added);
  } finally {
    await conn.end();
  }

  if (warnings.length) console.log(`\nwarnings:\n  ${warnings.join("\n  ")}`);
  const [pa, ps] = counts.projects;
  const [la, ls] = counts.listings;
  const [da, ds] = counts.deals;
  console.log(
    `\n${DRY ? "Would add" : "Added"} ${pa} project(s), ${la} listing(s), ${da} deal(s); ` +
      `skipped ${ps} project(s), ${ls} listing(s), ${ds} deal(s).`
  );
  if (DRY) {
    console.log("Dry run — nothing was written.");
    return;
  }
  console.log(
    `Photos: ${stats.filesWritten} new file(s), ${mb(stats.bytesWritten)} MB written to ${path.join(UPLOAD_DIR, "public")}; ` +
      `${stats.filesReused} already there. ${mb(stats.photoBytes)} MB of photos in total.`
  );
  console.log("Public pages are cached — open any demo listing in /admin, press Save once, and the site refreshes.");
}

try {
  await main();
} catch (err) {
  if (warnings.length) console.error(`\nwarnings:\n  ${warnings.join("\n  ")}`);
  console.error(`\nseed-demo: FAILED — ${err.message}`);
  process.exitCode = 1;
}
