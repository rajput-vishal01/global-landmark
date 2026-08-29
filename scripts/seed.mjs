// Seed the real Global Landmark Tricity portfolio (projects sourced from the
// agency's own listings) plus their Instagram reels as landing-page videos.
// Idempotent: skips rows that already exist. Run: npm run db:push && npm run db:seed
import { Client } from "pg";

try {
  process.loadEnvFile();
} catch {
  /* rely on real env */
}

// Same guard as migrate.mjs: this now runs as part of `npm run build`, which
// also happens with no database at all (the Docker image build) — without
// this, `pg` would try to connect to a default local socket and throw.
if (!process.env.DATABASE_URL) {
  console.log("seed: DATABASE_URL not set — skipping (image build)");
  process.exit(0);
}

const u = (id) =>
  `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;

// Mirrors lib/taxonomy/status.ts's cityCode()/refCode() — duplicated rather
// than imported since this script is plain .mjs run standalone with `node`,
// not through the Next.js/TS toolchain.
const CITY_CODES = {
  Chandigarh: "CHD", Panchkula: "PKL", "Panchkula Extension": "PKX",
  Mohali: "MOH", Zirakpur: "ZKP", "New Chandigarh": "NCH",
  Derabassi: "DRB", Kharar: "KHR", Mullanpur: "MLP",
};
const refCode = (city, year, seq) =>
  `GL-${(city && CITY_CODES[city]) || "GEN"}-${String(year % 100).padStart(2, "0")}-${String(seq).padStart(4, "0")}`;

// Visually verified, genuinely Indian-shot stock imagery (each confirmed via
// its Unsplash location tag before being added — see REQUIREMENTS_V2.md).
// Swap for the client's real project photos when available.
const IMG = {
  villaDusk: "photo-1711114377419-09b0cd2d786b", // Velgaon, Maharashtra
  whiteVilla: "photo-1777816268139-7c5ba8399d48", // Fort Kochi, Kerala
  towers: "photo-1632400990400-416d5460f337",
  apartments: "photo-1564834552305-aea63611ff08", // Noida, Uttar Pradesh
  township: "photo-1623668864555-4bb967176e6c", // Worli, Mumbai
  livingRoom: "photo-1785402231092-859d0a6c4397", // New Delhi
  bedroom: "photo-1750420556288-d0e32a6f517b", // New Delhi
  lobby: "photo-1745301558339-44eb3217d5da", // New Delhi
  glassLiving: "photo-1785402231092-859d0a6c4397", // New Delhi
  kitchenLiving: "photo-1684222965591-1662016c2d2c", // Mumbai, Maharashtra
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
    location: "Panchkula Extension", city: "Panchkula Extension", propertyType: "Residential Plot", configuration: null,
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
    location: "Sector 62, Mohali (Phase 8)", city: "Mohali", propertyType: "Flat/Apartment", configuration: "2–4 BHK",
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
    location: "Peer Muchalla, Zirakpur", city: "Zirakpur", propertyType: "Flat/Apartment", configuration: "3 BHK",
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
    location: "Tricity", city: null, propertyType: "Villa", configuration: "3–5 BHK",
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
    location: "Banur–Thepla Road, Tricity", city: null, propertyType: "Residential Plot", configuration: null,
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
    location: "Panchkula", city: "Panchkula", propertyType: "Independent House", configuration: "5 BHK Duplex",
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

/**
 * Every block below runs through this wrapper — a real production database
 * (months of a broker adding real listings through the admin panel) can have
 * data this script never anticipated, and one section hitting an edge case
 * must not stop every section after it from running. Before this existed,
 * an unhandled rejection anywhere (e.g. the projects insert, which only
 * guards `on conflict (slug)` — a broker-created project with a colliding
 * NAME but different slug throws a bare unique-violation) silently killed
 * the rest of the script, including the videos loop far below. `npm run
 * build`'s `(node scripts/seed.mjs || true)` swallows the exit code, so this
 * failed with no visible symptom beyond "some seed rows just never showed
 * up in production."
 */
async function section(name, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`seed: "${name}" section failed — continuing with the rest:`, err.message);
    return undefined;
  }
}

const projectId =
  (await section("projects", async () => {
    for (const [name, slug, description, builder, rera] of PROJECTS) {
      // Real production projects come from resolveProjectId() in the admin
      // panel, keyed only by name (see app/admin/(panel)/properties/actions.ts)
      // — a broker-typed project can land with the exact seed name but a
      // different slug, which `on conflict (slug)` alone won't catch, since
      // `name` carries its own unique constraint too. Caught and skipped per
      // row rather than per section, so one real collision doesn't also skip
      // the other three seed projects.
      try {
        await client.query(
          `insert into projects (name, slug, description, builder_name, rera_number)
           values ($1,$2,$3,$4,$5) on conflict (slug) do nothing`,
          [name, slug, description, builder, rera]
        );
      } catch (err) {
        console.error(`seed: project "${name}" insert failed — skipping:`, err.message);
      }
    }
    const { rows } = await client.query(`select id, slug from projects`);
    return Object.fromEntries(rows.map((r) => [r.slug, r.id]));
  })) ?? {};

await section("properties", async () => {
  for (const p of PROPERTIES) {
    const res = await client.query(
      `insert into properties (slug, title, kind, category, project_id, description, location, city,
         property_type, configuration, beds, baths, area_value, area_unit,
         facing, possession_status, furnishing, amenities, extras, publication_state)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'published')
       on conflict (slug) do nothing
       returning id`,
      [p.slug, p.title, p.kind, p.category, p.project ? projectId[p.project] : null,
       p.description, p.location, p.city, p.propertyType, p.configuration, p.beds, p.baths,
       p.area, p.unit, p.facing, p.possession, p.furnishing,
       p.amenities, JSON.stringify(p.extras)]
    );
    // A property that already existed still needs its id — `on conflict do
    // nothing` returns no row, so re-select by slug rather than skip outright.
    const newId = res.rows[0]?.id;
    const id =
      newId ??
      (await client.query(`select id from properties where slug = $1`, [p.slug])).rows[0].id;
    // Backfill by null check, not "was this row new this run" — a row can be
    // missing its ref_code from before this fix existed too, same as
    // createProperty() in the admin panel assigns one (buildRefCode from
    // city/year/id) the moment a broker saves a listing.
    await client.query(
      `update properties set ref_code = $1 where id = $2 and ref_code is null`,
      [refCode(p.city, new Date().getFullYear(), id), id]
    );
    // Always re-sync the gallery to the current IMG mapping (delete + reinsert)
    // instead of "insert once, skip forever" — otherwise swapping IMG.* here
    // never reaches an already-seeded database, and stale stock photos survive
    // every re-run indefinitely.
    await client.query(`delete from property_images where property_id = $1`, [id]);
    for (let i = 0; i < p.images.length; i++) {
      await client.query(
        `insert into property_images (property_id, url, alt, sort_order) values ($1,$2,$3,$4)`,
        [id, u(p.images[i]), p.title, i]
      );
    }
  }
});

/**
 * Deal of the Week — one live, one queued.
 *
 * Windows are relative to today and re-seeded whenever none is currently
 * live. The old `if (count === 0)` guard meant the first run's windows
 * expired and were never replaced, so `active_deals` sat at 0 forever and
 * the landing page lost its Deal of the Week section on day six.
 */
await section("deal of the week", async () => {
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
});

/**
 * Instagram reel videos. Upserted per row rather than skipped wholesale:
 * the old `if (count === 0)` guard meant adding a video to VIDEOS never
 * landed on a database that had already been seeded, which is why the
 * check below could never see all seven.
 */
await section("videos", async () => {
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
});

/**
 * Areas, services and written testimonials (redesign Phase C / F).
 *
 * The area rows matter more than they look: `match_city` / `match_locality`
 * are what let an area claim listings, so these are seeded to match the
 * cities the six seed properties actually use. Seed an area that matches
 * nothing and its landing page renders "0 properties", which reads as a bug
 * rather than as empty data.
 *
 * Published by default — unlike a property, an area with a cover image and
 * a blurb is complete the moment it is created, and leaving the whole
 * discovery section invisible on a fresh database helps nobody.
 */
const AREAS = [
  ["Panchkula", "panchkula", "Panchkula", "Panchkula", null, IMG.whiteVilla,
   "Wide sector roads, mature trees and the Tricity's most settled family addresses."],
  ["Panchkula Extension", "panchkula-extension", "Panchkula Extension", "Panchkula Extension", null, IMG.township,
   "The region's fastest-growing edge — plotted townships and new launches."],
  ["Zirakpur", "zirakpur", "Zirakpur", "Zirakpur", null, IMG.apartments,
   "The airport-side corridor: ready-to-move apartments and strong rental demand."],
  ["Mohali", "mohali", "Mohali", "Mohali", null, IMG.towers,
   "Planned sectors, the IT corridor and the Tricity's deepest apartment inventory."],
  ["New Chandigarh", "new-chandigarh", "New Chandigarh", "New Chandigarh", null, IMG.villaDusk,
   "Low-density living against the Shivaliks, built around the education belt."],
  ["Kharar", "kharar", "Kharar", "Kharar", null, IMG.kitchenLiving,
   "Entry pricing on the Chandigarh-Ludhiana highway, with steady appreciation."],
];

await section("areas", async () => {
  for (let i = 0; i < AREAS.length; i++) {
    const [name, slug, city, matchCity, matchLocality, img, blurb] = AREAS[i];
    await client.query(
      `insert into areas (name, slug, city, match_city, match_locality, cover_image, blurb, sort_order, is_published)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true)
       on conflict (slug) do nothing`,
      [name, slug, city, matchCity, matchLocality, u(img), blurb, i]
    );
  }
});

const SERVICES = [
  ["Buying or Selling", "End-to-end representation on both sides of a transaction, from search to registry.", "home"],
  ["Legal Advice", "Title checks, chain-of-ownership review and registry paperwork handled in-house.", "shield"],
  ["Real Estate Investment", "Yield and appreciation modelling on plots, pre-launch inventory and rentals.", "chart"],
  ["Home Loan", "Sanction support across lenders, with realistic eligibility read before you commit.", "bank"],
  ["Home Vastu", "Orientation, entry and layout reviewed before you sign, not after you move in.", "compass"],
  ["Home Interior", "Fit-out and furnishing through vetted contractors once possession is handed over.", "brush"],
];

await section("services", async () => {
  for (let i = 0; i < SERVICES.length; i++) {
    const [title, description, icon] = SERVICES[i];
    await client.query(
      `insert into services (title, description, icon, sort_order, is_published)
       select $1,$2,$3,$4,true
       where not exists (select 1 from services where title = $1)`,
      [title, description, icon, i]
    );
  }
});

const TEXT_TESTIMONIALS = [
  ["They walked every floor with us and told us plainly which two were worth the money. We closed on the second.",
   "Nishchal Nagpal", "Bought a 3 BHK in Zirakpur"],
  ["Paperwork was the part I dreaded. The registry was done in one sitting and nothing came back later.",
   "Parul Harjai", "Sold a plot in Panchkula Extension"],
  ["I was calling from Dubai and never once felt out of the loop. Video walkthroughs the same day I asked.",
   "Sandeep Dalal", "NRI purchase, Mohali"],
  ["We were shown four properties, not forty. That restraint is the whole reason we trusted the recommendation.",
   "Nakul Grover", "Bought a kothi in Panchkula"],
];

await section("text testimonials", async () => {
  for (let i = 0; i < TEXT_TESTIMONIALS.length; i++) {
    const [quote, author, context] = TEXT_TESTIMONIALS[i];
    await client.query(
      `insert into text_testimonials (quote, author, context, sort_order, is_published)
       select $1,$2,$3,$4,true
       where not exists (select 1 from text_testimonials where author = $2)`,
      [quote, author, context, i]
    );
  }
});

// ─── CFF expansion: one fully-populated example of every new entity ────────
// Without these, the admin screens and the leak check have nothing to
// exercise on a fresh database.

const one = async (sql, params = []) => (await client.query(sql, params)).rows[0];

const propId =
  (await section("CFF fixtures", async () => {
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
    const ids = Object.fromEntries(allProps.map((r) => [r.slug, r.id]));

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
     * scripts/leak-check.mjs — if any of them ever appears in public HTML or
     * a client bundle, that check fails. Keep the two files in step.
     */
    const leakProp = ids["panchkula-corner-kothi"];
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
    const mediaProp = ids["imperial-residency-3bhk"];
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

    return ids;
  })) ?? (await client.query(`select id, slug from properties`)).rows.reduce(
    (acc, r) => ((acc[r.slug] = r.id), acc),
    {}
  );

/**
 * Unit sizes for the two project listings — the "2 BHK / 1750 sq.ft /
 * ₹3.2 Cr" table. Seeded against projects rather than the resale kothi,
 * because a single resale unit has one size and one price and would render
 * a one-row table that looks broken.
 */
await section("unit sizes", async () => {
  const rows = [
    ["imperial-residency-3bhk", "2 BHK", 1750, "sqft", 32000000],
    ["imperial-residency-3bhk", "3 BHK", 2366, "sqft", 54000000],
    ["imperial-residency-3bhk", "3 + S BHK", 2420, "sqft", 53000000],
    ["homeland-urva-luxury-mohali", "2 BHK", 1290, "sqft", 9800000],
    ["homeland-urva-luxury-mohali", "3 BHK", 1685, "sqft", 14500000],
    ["homeland-urva-luxury-mohali", "4 BHK", 2240, "sqft", 21000000],
  ];
  for (let i = 0; i < rows.length; i++) {
    const [slug, label, area, unit, price] = rows[i];
    const id = propId[slug];
    if (!id) continue;
    await client.query(
      `insert into property_unit_sizes (property_id, unit_label, area_value, area_unit, price, sort_order)
       select $1,$2,$3,$4,$5,$6
       where not exists (
         select 1 from property_unit_sizes where property_id = $1 and unit_label = $2
       )`,
      [id, label, area, unit, price, i]
    );
  }
});

/**
 * Two project listings advertise their starting price publicly.
 *
 * Every other seed row leaves show_price_publicly at its default false,
 * which is right for a resale kothi — the owner's number is nobody's
 * business until they enquire. But with ALL six hidden, the public site
 * rendered 'Price on request' six times and the 'Starts from' treatment
 * never appeared at all, which reads as broken pricing rather than as
 * deliberate discretion. Projects are exactly the listings whose entry
 * price is already public everywhere else, so they carry it here.
 *
 * The leak-check needle (the kothi's 244466600) is untouched and stays
 * internal — see scripts/leak-check.mjs.
 */
/**
 * Two project listings advertise their starting price publicly.
 *
 * Every other seed row leaves show_price_publicly at its default false,
 * which is right for a resale kothi — the owner's number is nobody's
 * business until they enquire. But with all six hidden the public site
 * rendered "Price on request" six times and the "Starts from" treatment
 * never appeared at all, which reads as broken pricing rather than as
 * deliberate discretion. Projects are exactly the listings whose entry
 * price is already public everywhere else, so they carry it here.
 *
 * The leak-check needle (the kothi's 244466600) is untouched and stays
 * internal — see scripts/leak-check.mjs.
 */
await section("public project pricing", async () => {
  for (const [slug, price, rate] of [
    ["homeland-urva-luxury-mohali", 9800000, 7600],
    ["grand-mega-township-plots", 4100000, 8200],
  ]) {
    await client.query(
      `update properties
         set demand_price = $2, per_sqft_rate = $3, show_price_publicly = true
       where slug = $1 and demand_price is null`,
      [slug, price, rate]
    );
  }
});

/**
 * One project carries a public map pin so the gallery/map toggle has
 * something to show. Deliberately a launched project and not the resale
 * kothi: show_map_publicly defaults false precisely because publishing a
 * private seller doorstep is not the same decision as publishing a
 * builder site, and the seed should demonstrate that difference rather
 * than paper over it.
 */
await section("map pins", async () => {
  // [slug, lat, lng, public?]
  for (const [slug, lat, lng, isPublic] of [
    ["grand-mega-township-plots", "30.66502", "76.85013", true],
    ["homeland-urva-luxury-mohali", "30.70461", "76.71791", true],
    ["imperial-residency-3bhk", "30.66012", "76.83004", true],
    ["trishla-forest-residences", "30.71005", "76.73008", true],
    ["banur-plotted-project", "30.55607", "76.72003", true],
    // The resale kothi carries a pin but is NOT published. It is the one
    // listing whose owner details are internal, and it exists here
    // precisely so the gate has something to hold shut — the public page
    // must show no MAP button and leak no coordinate for this row.
    ["panchkula-corner-kothi", "30.69421", "76.86061", false],
  ]) {
    await client.query(
      `update properties
         set latitude = $1, longitude = $2, show_map_publicly = $3
       where slug = $4 and latitude is null`,
      [lat, lng, isPublic, slug]
    );
  }
});

await section("leads and settings", async () => {
  await client.query(
    `insert into leads (name, email, phone, interest, message, source, status)
     select 'Seed Enquiry','seed@example.com','9800000000','buy',
       'Seeded lead so the admin inbox is not empty on a fresh database.','seed','new'
     where not exists (select 1 from leads where email = 'seed@example.com')`
  );

  // site_settings rows must match the admin-override shape in lib/site-settings.ts
  // (SETTING_KEYS + ContactOverride/CredibilityOverride) — a bare 'officeHours'
  // key, as this used to seed, is never read by resolveCompany()/resolveCredibility().
  await client.query(
    `insert into site_settings (key, value)
     values ('company_contact', $1::jsonb)
     on conflict (key) do nothing`,
    [
      JSON.stringify({
        addressLines: ["Based in Panchkula", "Tricity, India"],
        phone: "+91 98820-84786",
        phoneHref: "tel:+919882084786",
        phoneAlt: "+91 70090-00164",
        phoneAltHref: "tel:+917009000164",
        email: "inquiries@globallandmark.com",
        officeHours: "Mon-Sat, 10:00-19:00 IST",
        socials: [
          { label: "Instagram", href: "https://www.instagram.com/globallandmarkrealtygroup/" },
        ],
      }),
    ]
  );
  await client.query(
    `insert into site_settings (key, value)
     values ('credibility', $1::jsonb)
     on conflict (key) do nothing`,
    [
      JSON.stringify({
        headingPre: "Over",
        headingHighlight: "₹85 Crore",
        headingPost: "in landmark sales",
        sub: "Considered residences across the Tricity, trusted by the most private buyers and sellers.",
        stats: [
          { value: 85, prefix: "₹", suffix: " Cr+", label: "Worth of Real Estate Sold" },
          { value: 120, prefix: "", suffix: "+", label: "Properties Transacted" },
          { value: 15, prefix: "", suffix: "", label: "Years in the Tricity" },
        ],
      }),
    ]
  );
});

// ─── CRM: clients, deals, payments, activities (R-30 / R-31) ──────────────
// Phases 5/6 shipped crm_clients/crm_deals/crm_payments/crm_activities with
// no seed coverage at all — the CRM screens were empty on a fresh database.
// One client per deal stage that exercises a different part of the UI: an
// active negotiation, a closed deal with brokerage paid in two tranches, and
// a bare enquiry converted straight from the seed lead above.
await section("CRM demo data", async () => {
  await client.query(
    `insert into crm_clients (name, phone, email, requirement_notes, budget_min, budget_max, preferred_locations, preferred_types)
     select 'Rohit Malhotra','9876543210','rohit.malhotra@example.com',
       'Looking for a 3-4 BHK independent floor, ready to move, vastu-compliant.',
       15000000, 22000000, $1, $2
     where not exists (select 1 from crm_clients where phone = '9876543210')`,
    [["Panchkula", "Zirakpur"], ["Independent Floor", "Kothi"]]
  );
  await client.query(
    `insert into crm_clients (name, phone, email, requirement_notes, budget_min, budget_max, preferred_locations, preferred_types)
     select 'Simran Kaur','9876543211','simran.kaur@example.com',
       'Investor client — closed on a 3 BHK in Mohali, brokerage settled in two tranches.',
       8000000, 12000000, $1, $2
     where not exists (select 1 from crm_clients where phone = '9876543211')`,
    [["Mohali"], ["Apartment"]]
  );
  await client.query(
    `insert into crm_clients (name, phone, email, requirement_notes, budget_min, budget_max, preferred_locations, preferred_types, converted_from_lead_id)
     select 'Anil Sharma','9876543212','anil.sharma@example.com',
       'Early-stage enquiry from the website contact form — plot in Panchkula Extension.',
       5000000, 9000000, $1, $2, l.id
     from leads l where l.email = 'seed@example.com'
     and not exists (select 1 from crm_clients where phone = '9876543212')`,
    [["Panchkula"], ["Plot"]]
  );

  const crmClientId = Object.fromEntries(
    (
      await client.query(
        `select id, phone from crm_clients where phone in ('9876543210','9876543211','9876543212')`
      )
    ).rows.map((r) => [r.phone, r.id])
  );

  if (crmClientId["9876543210"]) {
    await client.query(
      `insert into crm_deals (client_id, property_id, stage, deal_value, brokerage_percent_bp, assigned_to)
       select $1, $2, 'Negotiation', 18500000, 200, 'Ashu Goyal'
       where not exists (select 1 from crm_deals where client_id = $1 and stage = 'Negotiation')`,
      [crmClientId["9876543210"], propId["imperial-residency-3bhk"] ?? null]
    );
    await client.query(
      `insert into crm_activities (client_id, kind, note, author)
       select $1, 'Site Visit', 'Walked Imperial Residency 3BHK, unit 704. Client liked the layout, wants to negotiate on price.', 'Ashu Goyal'
       where not exists (select 1 from crm_activities where client_id = $1 and kind = 'Site Visit')`,
      [crmClientId["9876543210"]]
    );
    await client.query(
      `insert into crm_activities (client_id, kind, note, author)
       select $1, 'Call', 'Follow-up call, client to confirm by end of week.', 'Ashu Goyal'
       where not exists (select 1 from crm_activities where client_id = $1 and kind = 'Call')`,
      [crmClientId["9876543210"]]
    );
  }

  if (crmClientId["9876543211"]) {
    const existingClosed = await client.query(
      `select id from crm_deals where client_id = $1 and stage = 'Closed'`,
      [crmClientId["9876543211"]]
    );
    const closedDealId = existingClosed.rows.length
      ? existingClosed.rows[0].id
      : (
          await one(
            `insert into crm_deals (client_id, property_id, stage, deal_value, brokerage_percent_bp, assigned_to, closed_at)
             values ($1, $2, 'Closed', 9800000, 200, 'Divya Goyal', current_date - 30)
             returning id`,
            [crmClientId["9876543211"], propId["homeland-urva-luxury-mohali"] ?? null]
          )
        ).id;
    await client.query(
      `insert into crm_payments (deal_id, amount, paid_at, mode, note)
       select $1, 100000, current_date - 45, 'UPI', 'Token amount'
       where not exists (select 1 from crm_payments where deal_id = $1 and mode = 'UPI')`,
      [closedDealId]
    );
    await client.query(
      `insert into crm_payments (deal_id, amount, paid_at, mode, note)
       select $1, 95000, current_date - 20, 'Bank Transfer', 'Balance brokerage'
       where not exists (select 1 from crm_payments where deal_id = $1 and mode = 'Bank Transfer')`,
      [closedDealId]
    );
    await client.query(
      `insert into crm_activities (client_id, deal_id, kind, note, author)
       select $1, $2, 'Note', 'Deal closed and registered. Brokerage settled in two tranches.', 'Divya Goyal'
       where not exists (select 1 from crm_activities where client_id = $1 and kind = 'Note')`,
      [crmClientId["9876543211"], closedDealId]
    );
  }

  if (crmClientId["9876543212"]) {
    await client.query(
      `insert into crm_deals (client_id, property_id, stage, assigned_to)
       select $1, null, 'Enquiry', 'Ashu Goyal'
       where not exists (select 1 from crm_deals where client_id = $1 and stage = 'Enquiry')`,
      [crmClientId["9876543212"]]
    );
    await client.query(
      `insert into crm_activities (client_id, kind, note, author)
       select $1, 'WhatsApp', 'Shared plot options in Panchkula Extension, awaiting response.', 'Ashu Goyal'
       where not exists (select 1 from crm_activities where client_id = $1 and kind = 'WhatsApp')`,
      [crmClientId["9876543212"]]
    );
  }
});

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
     (select count(*)::int from crm_clients) as crm_clients,
     (select count(*)::int from crm_deals) as crm_deals,
     (select count(*)::int from crm_payments) as crm_payments,
     (select count(*)::int from crm_activities) as crm_activities,
     (select count(*)::int from site_settings where key = 'company_contact') as contact_setting,
     (select count(*)::int from site_settings where key = 'credibility') as credibility_setting,
     (select count(*)::int from properties where ref_code is null) as missing_ref_code,
     (select count(*)::int from properties where publication_state = 'published') as published,
     (select count(*)::int from areas) as areas,
     (select count(*)::int from services) as services,
     (select count(*)::int from text_testimonials) as text_testimonials,
     (select count(*)::int from property_unit_sizes) as unit_sizes`
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
  "crm_clients >= 3": c.crm_clients >= 3,
  "crm_deals >= 3": c.crm_deals >= 3,
  "crm_payments >= 2": c.crm_payments >= 2,
  "crm_activities >= 4": c.crm_activities >= 4,
  "company_contact setting seeded": c.contact_setting >= 1,
  "credibility setting seeded": c.credibility_setting >= 1,
  "every property has a ref code": c.missing_ref_code === 0,
  "every seeded property is published": c.published >= c.properties,
  "areas >= 6": c.areas >= 6,
  "services >= 6": c.services >= 6,
  "text testimonials >= 4": c.text_testimonials >= 4,
  "unit sizes >= 6": c.unit_sizes >= 6,
})
  .filter(([, ok]) => !ok)
  .map(([label]) => label);

if (failures.length) {
  console.error("Seed check FAILED:", failures.join(", "));
  process.exit(1);
}
console.log("Seed check passed.");
await client.end();
