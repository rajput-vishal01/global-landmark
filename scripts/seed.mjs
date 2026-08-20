// Seed the real Global Landmark Tricity portfolio (projects sourced from the
// agency's own listings) plus their Instagram reels as landing-page videos.
// Idempotent: skips rows that already exist. Run: npm run db:push && npm run db:seed
import { Client } from "pg";

try {
  process.loadEnvFile();
} catch {
  /* rely on real env */
}

const u = (id) =>
  `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;

// Visually verified stock imagery — swap for the client's real project photos.
const IMG = {
  villaDusk: "photo-1599809275671-b5942cabc7a2",
  whiteVilla: "photo-1602343168117-bb8ffe3e2e9f",
  towers: "photo-1580216643062-cf460548a66a",
  apartments: "photo-1545324418-cc1a3fa10c00",
  township: "photo-1596176530529-78163a4f7af2",
  livingRoom: "photo-1615873968403-89e068629265",
  bedroom: "photo-1590490360182-c33d57733427",
  lobby: "photo-1625244724120-1fd1d34d00f6",
  glassLiving: "photo-1600607687939-ce8a6c25118c",
  kitchenLiving: "photo-1600585154340-be6161a56a0c",
};

const PROJECTS = [
  ["Grand Mega Township", "grand-mega-township", "208-acre township in Panchkula Extension with 300 & 500 gaj premium plots.", "Global Landmark Realty Group", null],
  ["Homeland Urva Luxury", "homeland-urva-luxury", "Premium residential project at Sector 62, Mohali (Phase 8) — 12.5 & 5.5 acre development.", "Homeland", null],
  ["Imperial Residency", "imperial-residency", "RERA-approved gated township of 3 BHK apartments at Peer Muchalla, Zirakpur.", "Imperial", null],
  ["Trishla", "trishla", "Forest-inspired luxury living with a lazy river, wave pool and multi-tier security.", "Trishla", null],
];

const PROPERTIES = [
  {
    slug: "grand-mega-township-plots",
    title: "Premium Plots, Grand Mega Township",
    kind: "project", category: "invest", project: "grand-mega-township",
    location: "Panchkula Extension", propertyType: "Residential Plot", configuration: null,
    beds: null, baths: null, area: 500, unit: "sqyd",
    facing: "North", possession: "New Launch", furnishing: null,
    amenities: ["Gated Community", "Club House", "Swimming Pool", "Children's Play Area", "Jogging Track", "Park Facing", "Wide Roads", "24/7 Water Supply"],
    extras: [{ title: "Project Size", description: "208 acres" }, { title: "Plot Sizes", description: "300 & 500 gaj" }, { title: "Infrastructure", description: "Sports complex, artificial lake, underground wiring" }],
    description:
      "A 208-acre Grand Mega Township in Panchkula Extension offering 300 and 500 gaj premium plots. Sports complex, club house, artificial lake, 24/7 water supply, underground wiring and wide roads. A future-investment address at the region's fastest-growing edge.",
    images: [IMG.township, IMG.towers, IMG.villaDusk],
  },
  {
    slug: "homeland-urva-luxury-mohali",
    title: "Homeland Urva Luxury, Sector 62 Mohali",
    kind: "project", category: "sale", project: "homeland-urva-luxury",
    location: "Sector 62, Mohali (Phase 8)", propertyType: "Flat/Apartment", configuration: "2–4 BHK",
    beds: null, baths: null, area: null, unit: "sqft",
    facing: null, possession: "Under Construction", furnishing: "Semi Furnished",
    amenities: ["Gated Community", "Lift", "Power Backup", "Club House", "Security / CCTV", "Covered Parking"],
    extras: [{ title: "Development", description: "12.5 acre & 5.5 acre" }, { title: "Stage", description: "Pre-to-Pre Launch booking" }],
    description:
      "A premium residential project at Sector 62, Mohali (Phase 8) — a 12.5-acre and 5.5-acre development now open for pre-to-pre-launch booking. Considered layouts, luxury amenities and the future of residential living in Mohali.",
    images: [IMG.towers, IMG.lobby, IMG.livingRoom],
  },
  {
    slug: "imperial-residency-3bhk",
    title: "3 BHK Residence, Imperial Residency",
    kind: "unit", category: "sale", project: "imperial-residency",
    location: "Peer Muchalla, Zirakpur", propertyType: "Flat/Apartment", configuration: "3 BHK",
    beds: 3, baths: 3, area: 1850, unit: "sqft",
    facing: "East", possession: "Ready to Move", furnishing: "Semi Furnished",
    amenities: ["Gated Community", "Lift", "Power Backup", "Swimming Pool", "Security / CCTV", "Covered Parking"],
    extras: [{ title: "Location", description: "Opposite D-Mart, prime pocket" }, { title: "Parking", description: "2 dedicated car spaces" }, { title: "Lifts", description: "2 on every floor" }],
    description:
      "A 1,850 sq ft 3 BHK luxury apartment in Imperial Residency, opposite D-Mart at Peer Muchalla, Zirakpur. RERA-approved gated township with swimming pool, CCTV, 24x7 power backup, two lifts on every floor and two dedicated car parking spaces. End-to-end documentation support.",
    images: [IMG.apartments, IMG.glassLiving, IMG.bedroom],
  },
  {
    slug: "trishla-forest-residences",
    title: "Trishla Forest Residences",
    kind: "project", category: "sale", project: "trishla",
    location: "Tricity", propertyType: "Villa", configuration: "3–5 BHK",
    beds: null, baths: null, area: null, unit: "sqft",
    facing: null, possession: "New Launch", furnishing: "Luxury Furnished",
    amenities: ["Gated Community", "Swimming Pool", "Club House", "Security / CCTV", "Children's Play Area", "Park Facing"],
    extras: [{ title: "Signature", description: "Lazy river with wave pool" }, { title: "Security", description: "Multi-tier" }],
    description:
      "Forest-inspired uber-luxury living where elegance meets nature. Peaceful green surroundings, a lazy river with wave pool, multi-tier security and an impressive grand entrance — a perfect address for those who value time, ease and elegance.",
    images: [IMG.villaDusk, IMG.glassLiving, IMG.livingRoom, IMG.lobby],
  },
  {
    slug: "banur-plotted-project",
    title: "Premium Residential Plots, Banur",
    kind: "project", category: "invest", project: null,
    location: "Banur–Thepla Road, Tricity", propertyType: "Residential Plot", configuration: null,
    beds: null, baths: null, area: 27, unit: "acre",
    facing: null, possession: "New Launch", furnishing: null,
    amenities: ["Gated Community", "Wide Roads", "Park Facing"],
    extras: [{ title: "Availability", description: "Only 55 plots" }, { title: "Approach", description: "300 m off Banur–Thepla road" }],
    description:
      "A 27-acre RERA-approved plotted project with only 55 plots — limited inventory, an excellent location just 300 metres off the Banur–Thepla road, and development already underway. Best pricing at the pre-to-pre-launch stage.",
    images: [IMG.township, IMG.whiteVilla],
  },
  {
    slug: "panchkula-corner-kothi",
    title: "Corner Kothi, Panchkula",
    kind: "unit", category: "sale", project: null,
    location: "Panchkula", propertyType: "Independent House", configuration: "5 BHK Duplex",
    beds: 5, baths: 6, area: 400, unit: "sqyd",
    facing: "North", possession: "Ready to Move", furnishing: "Semi Furnished",
    amenities: ["Corner", "Park Facing", "Modular Kitchen", "Terrace / Roof Rights", "Servant Room", "Pooja Room"],
    extras: [{ title: "Road Width", description: "Wide sector road, double entry" }],
    description:
      "A corner kothi on a settled Panchkula street — five suites, a shaded verandah, park on one side and a wide sector road on the other. Rebuilt to a modern plan behind a dignified facade.",
    images: [IMG.whiteVilla, IMG.livingRoom, IMG.kitchenLiving],
  },
];

// Instagram reels from @globallandmarkrealtygroup, shown in the video section.
const VIDEOS = [
  ["DW61A1IkycX", "Grand Mega Township — Panchkula Extension"],
  ["DY9CK_Rzs0C", "Imperial Residency — 3 BHK, Zirakpur"],
  ["Dacz9kAmoc9", "Smart Investors — Panchkula Extension plots"],
  ["DV8K_mtE66H", "Homeland Urva Luxury — Sector 62 Mohali"],
  ["DV2mf3_ETUj", "Premium Residential Plots — Banur"],
  ["DV24_4ojTT4", "Trishla — forest-inspired luxury living"],
  ["DY4mauazbgi", "Global Landmark — property, plots & kothis"],
];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

for (const [name, slug, description, builder, rera] of PROJECTS) {
  await client.query(
    `insert into projects (name, slug, description, builder_name, rera_number)
     values ($1,$2,$3,$4,$5) on conflict (slug) do nothing`,
    [name, slug, description, builder, rera]
  );
}

const { rows: projectRows } = await client.query(`select id, slug from projects`);
const projectId = Object.fromEntries(projectRows.map((r) => [r.slug, r.id]));

for (const p of PROPERTIES) {
  const res = await client.query(
    `insert into properties (slug, title, kind, category, project_id, description, location,
       property_type, configuration, beds, baths, area_value, area_unit,
       facing, possession_status, furnishing, amenities, extras)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     on conflict (slug) do nothing
     returning id`,
    [p.slug, p.title, p.kind, p.category, p.project ? projectId[p.project] : null,
     p.description, p.location, p.propertyType, p.configuration, p.beds, p.baths,
     p.area, p.unit, p.facing, p.possession, p.furnishing,
     p.amenities, JSON.stringify(p.extras)]
  );
  if (!res.rows.length) continue; // already seeded
  const id = res.rows[0].id;
  for (let i = 0; i < p.images.length; i++) {
    await client.query(
      `insert into property_images (property_id, url, alt, sort_order) values ($1,$2,$3,$4)`,
      [id, u(p.images[i]), p.title, i]
    );
  }
}

/**
 * Deal of the Week — one live, one queued.
 *
 * Windows are relative to today and re-seeded whenever none is currently
 * live. The old `if (count === 0)` guard meant the first run's windows
 * expired and were never replaced, so `active_deals` sat at 0 forever and
 * the landing page lost its Deal of the Week section on day six.
 */
const { rows: liveDeals } = await client.query(
  `select count(*)::int as n from deals where current_date between starts_at and ends_at`
);
if (liveDeals[0].n === 0) {
  const { rows: pr } = await client.query(
    `select id, slug from properties where slug in ('imperial-residency-3bhk','grand-mega-township-plots')`
  );
  const bySlug = Object.fromEntries(pr.map((r) => [r.slug, r.id]));
  await client.query(`delete from deals`);
  await client.query(
    `insert into deals (property_id, starts_at, ends_at) values
     ($1, current_date - 2, current_date + 5),
     ($2, current_date + 6, current_date + 13)`,
    [bySlug["imperial-residency-3bhk"], bySlug["grand-mega-township-plots"]]
  );
}

/**
 * Instagram reel videos. Upserted per row rather than skipped wholesale:
 * the old `if (count === 0)` guard meant adding a video to VIDEOS never
 * landed on a database that had already been seeded, which is why the
 * check below could never see all seven.
 */
for (let i = 0; i < VIDEOS.length; i++) {
  // `on conflict` would not help here: video_id carries no unique
  // constraint, so only a primary-key collision would trigger it and every
  // re-run would duplicate the row instead.
  await client.query(
    `insert into testimonial_videos (provider, video_id, caption, sort_order)
     select 'instagram', $1, $2, $3
     where not exists (select 1 from testimonial_videos where video_id = $1)`,
    [VIDEOS[i][0], VIDEOS[i][1], i]
  );
}

// ─── CFF expansion: one fully-populated example of every new entity ────────
// Without these, the admin screens and the leak check have nothing to
// exercise on a fresh database.

const one = async (sql, params = []) => (await client.query(sql, params)).rows[0];

const { id: builderId } = await one(
  `insert into builders (name, slug, belongs_to, about, website, contact_name, contact_phone, past_projects)
   values ('Homeland Group','homeland-group','Mohali, Punjab',
           'Regional developer active across Mohali and New Chandigarh.',
           'https://example.com','Seed Builder Contact','9812300001',
           'Homeland Heights, Homeland Residency')
   on conflict (slug) do update set name = excluded.name
   returning id`
);

await client.query(
  `update projects set builder_id = $1, possession_status = 'Under Construction',
     launch_date = current_date - 400, possession_date = current_date + 365,
     total_towers = 4, total_units = 320, number_of_floors = 14,
     green_area_value = 3, green_area_unit = 'acre',
     amenities = $2, country = 'India', city = 'Mohali', locality = 'Sector Area'
   where slug = 'homeland-urva-luxury'`,
  [builderId, ["Club House", "Swimming Pool", "Gym", "Gated Community"]]
);

const { rows: allProps } = await client.query(`select id, slug from properties`);
const propId = Object.fromEntries(allProps.map((r) => [r.slug, r.id]));

// A tower, so the project page has real inventory to group units under.
// Insert-then-select rather than relying on RETURNING: on a re-run the
// insert matches nothing and returns no row, which would leave the unit
// unlinked.
await client.query(
  `insert into towers (project_id, name, total_floors, units_per_floor, total_units)
   select p.id, 'Tower A', 14, 4, 56 from projects p
   where p.slug = 'homeland-urva-luxury'
     and not exists (select 1 from towers t where t.project_id = p.id and t.name = 'Tower A')`
);
const towerRow = await one(
  `select t.id from towers t
   join projects p on p.id = t.project_id
   where p.slug = 'homeland-urva-luxury' and t.name = 'Tower A'`
);
const towerId = towerRow?.id ?? null;

if (towerId) {
  await client.query(
    `update properties set tower_id = $1, floor_number = 7, total_floors = 14,
       unit_number = '704', configuration = '3 BHK', balconies = 2,
       super_area = 1850, super_area_unit = 'sqft',
       carpet_area = 1320, carpet_area_unit = 'sqft'
     where slug = 'imperial-residency-3bhk'`,
    [towerId]
  );
}

/**
 * Internal fixtures. These exact values are the needles in
 * scripts/leak-check.mjs — if any of them ever appears in public HTML or a
 * client bundle, that check fails. Keep the two files in step.
 */
const leakProp = propId["panchkula-corner-kothi"];
if (leakProp) {
  await client.query(
    `insert into property_owners (property_id, name, seller_category, owner_type,
       owner_count, mobile, alt_mobile, address, notes)
     select $1,'Leakcheck Owner','Owner','Individual',2,'9876500011','9876500022',
       'Leakcheck Address, Panchkula','Seeded fixture for the section 4.1 leak check'
     where not exists (select 1 from property_owners where property_id = $1)`,
    [leakProp]
  );
  await client.query(
    `insert into property_internal (property_id, circle_rate, market_value_note,
       is_mortgaged, internal_notes)
     values ($1, 733377, 'Leakcheck circle rate note', true, 'Leakcheck internal note')
     on conflict (property_id) do update set circle_rate = excluded.circle_rate`,
    [leakProp]
  );
  await client.query(
    `insert into property_charges (property_id, charge_type, amount, basis, is_included_in_demand)
     select $1,'Club Charges',588899,'lump_sum',false
     where not exists (select 1 from property_charges where property_id = $1)`,
    [leakProp]
  );
  await client.query(
    `insert into property_documents (property_id, doc_type, storage_key, file_name,
       mime_type, size_bytes, uploaded_by)
     select $1,'Registry Available','private/seed/registry.pdf','registry.pdf',
       'application/pdf', 24680, 'seed'
     where not exists (select 1 from property_documents where property_id = $1)`,
    [leakProp]
  );
  await client.query(
    `insert into property_price_history (property_id, demand_price, changed_by, reason)
     select $1, 244466600, 'seed', 'Initial listing price'
     where not exists (select 1 from property_price_history where property_id = $1)`,
    [leakProp]
  );
  // Price captured but deliberately NOT published — the default everywhere.
  await client.query(
    `update properties set demand_price = 244466600, per_sqft_rate = 6790,
       is_negotiable = true, show_price_publicly = false
     where id = $1`,
    [leakProp]
  );
}

// Link media: Instagram and YouTube embeds, plus a map.
const mediaProp = propId["imperial-residency-3bhk"];
if (mediaProp) {
  for (const [kind, url, label] of [
    ["video", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "Walkthrough"],
    ["drone", "https://www.instagram.com/reel/DW61A1IkycX/", "Drone reel"],
    ["google_map", "https://www.google.com/maps?q=Zirakpur", "Location"],
  ]) {
    await client.query(
      `insert into property_media (property_id, kind, url, label)
       select $1,$2,$3,$4
       where not exists (select 1 from property_media where property_id = $1 and kind = $2)`,
      [mediaProp, kind, url, label]
    );
  }
}

await client.query(
  `insert into leads (name, email, phone, interest, message, source, status)
   select 'Seed Enquiry','seed@example.com','9800000000','buy',
     'Seeded lead so the admin inbox is not empty on a fresh database.','seed','new'
   where not exists (select 1 from leads where email = 'seed@example.com')`
);

await client.query(
  `insert into site_settings (key, value)
   values ('officeHours', '"Mon-Sat, 10:00-19:00 IST"'::jsonb)
   on conflict (key) do nothing`
);

// Runnable check (ponytail).
const { rows: check } = await client.query(
  `select
     (select count(*)::int from projects) as projects,
     (select count(*)::int from properties) as properties,
     (select count(*)::int from property_images) as images,
     (select count(*)::int from deals where current_date between starts_at and ends_at) as active_deals,
     (select count(*)::int from testimonial_videos) as videos,
     (select count(*)::int from builders) as builders,
     (select count(*)::int from towers) as towers,
     (select count(*)::int from property_owners) as owners,
     (select count(*)::int from property_internal) as internal,
     (select count(*)::int from property_charges) as charges,
     (select count(*)::int from property_documents) as documents,
     (select count(*)::int from property_media) as media,
     (select count(*)::int from leads) as leads,
     (select count(*)::int from properties where ref_code is null) as missing_ref_code,
     (select count(*)::int from properties where publication_state = 'published') as published`
);
console.table(check);
const c = check[0];
const failures = Object.entries({
  "projects >= 4": c.projects >= 4,
  "properties >= 6": c.properties >= 6,
  "images >= 6": c.images >= 6,
  "exactly one live deal": c.active_deals === 1,
  [`videos >= ${VIDEOS.length}`]: c.videos >= VIDEOS.length,
  "builders >= 1": c.builders >= 1,
  "towers >= 1": c.towers >= 1,
  "owners >= 1": c.owners >= 1,
  "internal >= 1": c.internal >= 1,
  "charges >= 1": c.charges >= 1,
  "documents >= 1": c.documents >= 1,
  "media >= 1": c.media >= 1,
  "leads >= 1": c.leads >= 1,
  "every property has a ref code": c.missing_ref_code === 0,
  "published listings exist": c.published >= 1,
})
  .filter(([, ok]) => !ok)
  .map(([label]) => label);

if (failures.length) {
  console.error("Seed check FAILED:", failures.join(", "));
  process.exit(1);
}
console.log("Seed check passed.");
await client.end();
