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

// Deal of the Week — one live, one queued.
const { rows: dealCount } = await client.query(`select count(*)::int as n from deals`);
if (dealCount[0].n === 0) {
  const { rows: pr } = await client.query(
    `select id, slug from properties where slug in ('imperial-residency-3bhk','grand-mega-township-plots')`
  );
  const bySlug = Object.fromEntries(pr.map((r) => [r.slug, r.id]));
  await client.query(
    `insert into deals (property_id, starts_at, ends_at) values
     ($1, current_date - 2, current_date + 5),
     ($2, current_date + 6, current_date + 13)`,
    [bySlug["imperial-residency-3bhk"], bySlug["grand-mega-township-plots"]]
  );
}

// Instagram reel videos.
const { rows: vidCount } = await client.query(`select count(*)::int as n from testimonial_videos`);
if (vidCount[0].n === 0) {
  for (let i = 0; i < VIDEOS.length; i++) {
    await client.query(
      `insert into testimonial_videos (provider, video_id, caption, sort_order)
       values ('instagram', $1, $2, $3)`,
      [VIDEOS[i][0], VIDEOS[i][1], i]
    );
  }
}

// Runnable check (ponytail).
const { rows: check } = await client.query(
  `select
     (select count(*)::int from projects) as projects,
     (select count(*)::int from properties) as properties,
     (select count(*)::int from property_images) as images,
     (select count(*)::int from deals where current_date between starts_at and ends_at) as active_deals,
     (select count(*)::int from testimonial_videos) as videos`
);
console.table(check);
const c = check[0];
if (c.projects < 4 || c.properties < 6 || c.active_deals !== 1 || c.videos < 7) {
  console.error("Seed check FAILED");
  process.exit(1);
}
console.log("Seed check passed.");
await client.end();
