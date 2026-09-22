import {
  bigint,
  boolean,
  date,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";


/**
 * PUBLIC / INTERNAL BOUNDARY
 * --------------------------
 * `projects`, `properties`, `property_images`, `property_media` and `towers`
 * are the public-safe records. Everything the client marked internal —
 * owners, brokerage, circle rate, documents, leads, CRM — lives in sibling
 * tables the public read layer never imports, because a query that never
 * references a table cannot leak it.
 *
 * Public-safe does NOT mean every column is public: `properties` still
 * carries `listingStatus`, `addedBy` and `refCode`, which are admin-only.
 * That is what the explicit `columns:` allowlists in lib/db/public-columns.ts
 * are for. Never add a public query without one.
 *
 * Taxonomy values (property type, facing, amenities, statuses...) are stored
 * as text and validated against the lists in lib/taxonomy/* on write, so
 * adding an option never needs a migration. Enums are reserved for values
 * the database itself should refuse.
 */

// A listing is either a whole project/society or a single unit within one.
export const PROPERTY_KINDS = ["project", "unit"] as const;

// The four hero categories; user-facing labels live in lib/categories.ts.
export const PROPERTY_CATEGORIES = ["sale", "purchase", "lease", "invest"] as const;

/** Builders, so a project pitch pulls their details straight from the CRM. */
export const builders = mysqlTable("builders", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  /** "Belongs To" in the CFF — the builder's home city/region. */
  belongsTo: text("belongs_to"),
  about: text("about"),
  website: text("website"),
  logoUrl: text("logo_url"),
  /** Internal: never selected by a public query. */
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  /** Track record used when pitching, not published. */
  pastProjects: text("past_projects"),
  priceAppreciation: text("price_appreciation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Societies/projects managed by the admin ("Nirvana", "Green Lotus", ...). */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  /** Kept as free text for legacy rows; `builderId` is the real link. */
  builderName: text("builder_name"),
  builderId: int("builder_id").references(() => builders.id, {
    onDelete: "set null",
  }),
  reraNumber: text("rera_number"),
  possessionStatus: text("possession_status"),
  launchDate: date("launch_date", { mode: "string" }),
  possessionDate: date("possession_date", { mode: "string" }),
  /** Internal — a projection, not a published claim. */
  priceAppreciation: text("price_appreciation"),
  totalTowers: int("total_towers"),
  totalUnits: int("total_units"),
  numberOfFloors: int("number_of_floors"),
  greenAreaValue: int("green_area_value"),
  greenAreaUnit: text("green_area_unit"),
  /** Society-wide amenities; a unit inherits these instead of re-entering. */
  amenities: json("amenities").$type<string[]>(),
  country: text("country").default("India"),
  city: varchar("city", { length: 100 }),
  locality: text("locality"),
  sector: text("sector"),
  coverImage: text("cover_image"),
  /**
   * What every unit in the project shares (Sep 2026, migration 0005). The
   * property form copies these in when a unit is filed under the project,
   * so a broker types a society's address and bank panel once.
   */
  address: text("address"),
  mapsUrl: text("maps_url"),
  legalFlags: json("legal_flags").$type<string[]>(),
  loanFlags: json("loan_flags").$type<string[]>(),
  banksOnPanel: json("banks_on_panel").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Towers within a project — a single building can hold many available units. */
export const towers = mysqlTable("towers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  totalFloors: int("total_floors"),
  unitsPerFloor: int("units_per_floor"),
  totalUnits: int("total_units"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Listings. Public-safe columns only — see the boundary note above.
 *
 * Price is captured in full (superseding the earlier "no price by design"
 * decision) but only published when `showPricePublicly` is set, which
 * defaults to false. Circle rate is NOT here; it is internal always.
 */
export const properties = mysqlTable(
  "properties",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: text("title").notNull(),
    kind: mysqlEnum("kind", PROPERTY_KINDS).notNull().default("unit"),
    category: mysqlEnum("category", PROPERTY_CATEGORIES).notNull().default("sale"),
    projectId: int("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    towerId: int("tower_id").references(() => towers.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull().default(""),

    // --- Provenance and lifecycle (CFF 1) — all internal ------------------
    /** GL-PKL-26-0142. Assigned once on insert, never reused. */
    refCode: varchar("ref_code", { length: 40 }).unique(),
    /** draft | published | archived. Only published + Available is public. */
    publicationState: varchar("publication_state", { length: 40 }).notNull().default("draft"),
    listingStatus: varchar("listing_status", { length: 40 }).notNull().default("Available"),
    /** Global Landmark | Dealer | Owner, with `sourceName` naming which. */
    addedBy: text("added_by").notNull().default("Global Landmark"),
    sourceName: text("source_name"),
    /** When it went on the market — distinct from row creation. */
    listedAt: timestamp("listed_at").defaultNow().notNull(),
    /**
     * Set only by the public "list your property" form; null for anything an
     * admin created. Its presence is what makes a row a SUBMISSION rather
     * than a draft the office started itself, which is the difference the
     * review queue is built on — `addedBy = 'Owner'` cannot carry that,
     * since an admin entering an owner-sourced listing by hand sets it too.
     *
     * A submission needs no lifecycle vocabulary of its own: it arrives as
     * `publication_state = 'draft'`, which the single `isPubliclyVisible`
     * gate already hides, approving it is publishing it, and declining it is
     * archiving it.
     */
    submittedAt: timestamp("submitted_at"),

    // --- Location (CFF 3) --------------------------------------------------
    /** Free-text address line, kept as the display fallback for legacy rows. */
    location: text("location").notNull().default(""),
    country: text("country").default("India"),
    city: varchar("city", { length: 100 }),
    locality: text("locality"),
    sector: text("sector"),
    block: text("block"),
    society: text("society"),
    floorNumber: int("floor_number"),
    totalFloors: int("total_floors"),
    /** CONFIRM whether this may be shown publicly; treated as internal. */
    unitNumber: text("unit_number"),
    /**
     * Map pin, stored as text rather than a numeric/PostGIS type: these are
     * copied out of Google Maps by hand and never arithmetic'd, so parsing
     * them into floats would buy nothing and lose the operator's precision.
     *
     * `showMapPublicly` defaults to FALSE and is the only thing that puts a
     * pin on a public page. That default is deliberate: publishing exact
     * coordinates is fine for a launched project and not fine for a private
     * resale kothi whose owner details are internal — so the safe answer is
     * the one you get by doing nothing.
     */
    latitude: text("latitude"),
    longitude: text("longitude"),
    showMapPublicly: boolean("show_map_publicly").notNull().default(false),
    /**
     * A Google Maps share link (Sep 2026) — replaces latitude / longitude /
     * showMapPublicly in the admin form, which no longer writes those three.
     * Public: pasting the link is the decision to show the map. The old
     * columns stay so no existing data is lost; migration 0004 carried every
     * published pin across into this column.
     */
    mapsUrl: text("maps_url"),

    // --- Classification (CFF 2, 7, 10, 11, 12) -----------------------------
    propertyType: varchar("property_type", { length: 100 }),
    /** Pre-Leased / Investment — deal shape, orthogonal to the type. */
    dealAttributes: json("deal_attributes").$type<string[]>(),
    /** One value for a unit. */
    configuration: text("configuration"),
    /** Projects advertise a range ("2-4 BHK"), which one value cannot hold. */
    configurations: json("configurations").$type<string[]>(),
    beds: int("beds"),
    baths: int("baths"),
    balconies: int("balconies"),
    roomFlags: json("room_flags").$type<string[]>(),
    facing: text("facing"),
    possessionStatus: text("possession_status"),
    propertyAge: text("property_age"),

    // --- Area (CFF 5) ------------------------------------------------------
    /** Legacy display area — the value shown when no measure is specified. */
    areaValue: int("area_value"),
    areaUnit: text("area_unit").notNull().default("sqft"),
    plotArea: int("plot_area"),
    plotAreaUnit: text("plot_area_unit"),
    builtUpArea: int("built_up_area"),
    builtUpAreaUnit: text("built_up_area_unit"),
    superArea: int("super_area"),
    superAreaUnit: text("super_area_unit"),
    carpetArea: int("carpet_area"),
    carpetAreaUnit: text("carpet_area_unit"),
    /**
     * Primary area normalised to sq.ft, written by the server action. Exists
     * only so filtering and sorting can compare a 500 sq.yd plot against a
     * 2000 sq.ft flat; never rendered.
     */
    areaSqft: int("area_sqft"),
    frontFeet: int("front_feet"),
    depthFeet: int("depth_feet"),
    plcAttributes: json("plc_attributes").$type<string[]>(),

    // --- Specifications (CFF 20) -------------------------------------------
    roadWidth: int("road_width"),
    entranceWidth: int("entrance_width"),
    ceilingHeight: int("ceiling_height"),
    isCorner: boolean("is_corner").default(false),
    isParkFacing: boolean("is_park_facing").default(false),

    // --- Features (CFF 9, 15, 16) ------------------------------------------
    furnishing: text("furnishing"),
    furnishingInventory: json("furnishing_inventory").$type<string[]>(),
    amenities: json("amenities").$type<string[]>(),
    parkingTypes: json("parking_types").$type<string[]>(),
    parkingSlots: int("parking_slots"),

    // --- Legal, documentation, loan (CFF 13, 14, 17) -----------------------
    /** Public subset only; "Mortgaged" lives on property_internal. */
    legalFlags: json("legal_flags").$type<string[]>(),
    reraNumber: text("rera_number"),
    /** Internal by default — CONFIRM a trimmed public version. */
    documentationFlags: json("documentation_flags").$type<string[]>(),
    loanFlags: json("loan_flags").$type<string[]>(),
    banksOnPanel: json("banks_on_panel").$type<string[]>(),

    // --- Price (CFF 6) -----------------------------------------------------
    /** Rupees. bigint because int4 tops out around 214 Cr. */
    demandPrice: bigint("demand_price", { mode: "number" }),
    perSqftRate: int("per_sqft_rate"),
    isNegotiable: boolean("is_negotiable").default(false),
    /** Off by default — "Price on request" stays the standing behaviour. */
    showPricePublicly: boolean("show_price_publicly").notNull().default(false),

    /** Admin-defined custom attributes — anything not covered above. */
    extras: json("extras").$type<{ title: string; description: string }[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // The public list query always filters on these two together, and every
    // filtered view narrows from there.
    index("properties_public_idx").on(t.publicationState, t.listingStatus),
    index("properties_city_idx").on(t.city),
    index("properties_type_idx").on(t.propertyType),
    index("properties_project_idx").on(t.projectId),
    index("properties_tower_idx").on(t.towerId),
    index("properties_price_idx").on(t.demandPrice),
    index("properties_area_idx").on(t.areaSqft),
  ]
);

/** File media. `storageKey` is the opaque handle used to delete the asset. */
export const propertyImages = mysqlTable(
  "property_images",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    /**
     * The opaque handle used to delete the asset. Null means an external URL
     * we do not own and must never try to delete (seed rows, pasted links).
     *
     * ponytail: the DB column is still `public_id` from the Cloudinary-only
     * era. Renaming it buys nothing today and a rename migration can lose
     * data if mis-resolved, so only the TS name is generalised. Rename the
     * column in its own migration if/when we move off Cloudinary.
     */
    storageKey: text("public_id"),
    /** cover | interior | exterior | floor_plan | other. One cover per property. */
    mediaKind: text("media_kind").notNull().default("other"),
    alt: text("alt").notNull().default(""),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("property_images_property_idx").on(t.propertyId, t.sortOrder)]
);

/**
 * Link media — video, drone, virtual tour, Google Map, brochure. Separate
 * from `property_images` because these are URLs to embed, not files we host,
 * and each embed host needs its own CSP `frame-src` entry before it renders.
 */
export const propertyMedia = mysqlTable(
  "property_media",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    label: text("label").notNull().default(""),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("property_media_property_idx").on(t.propertyId, t.sortOrder)]
);

// ─── Internal-only tables — never imported by lib/db/queries.ts ─────────────

/**
 * Owner and seller contacts. The most sensitive group on the site: these
 * phone numbers must never reach a public component. Multiple rows per
 * property because joint ownership is the norm.
 */
export const propertyOwners = mysqlTable(
  "property_owners",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    sellerCategory: text("seller_category"),
    ownerType: text("owner_type"),
    ownerCount: int("owner_count"),
    mobile: varchar("mobile", { length: 40 }),
    altMobile: text("alt_mobile"),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("property_owners_property_idx").on(t.propertyId),
    // Duplicate detection: the same number listing twice is the common
    // dealer-sourced failure.
    index("property_owners_mobile_idx").on(t.mobile),
  ]
);

/** 1:1 internal facts. Circle rate lives here and nowhere else. */
export const propertyInternal = mysqlTable("property_internal", {
  propertyId: int("property_id")
    .primaryKey()
    .references(() => properties.id, { onDelete: "cascade" }),
  circleRate: bigint("circle_rate", { mode: "number" }),
  marketValueNote: text("market_value_note"),
  /** CFF 14 "Mortgaged" — a negotiating position, not a selling point. */
  isMortgaged: boolean("is_mortgaged").default(false),
  internalNotes: text("internal_notes"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
});

/**
 * Charges beyond the demand price. A row per charge so the list grows
 * without a migration and each carries its own basis.
 */
export const propertyCharges = mysqlTable(
  "property_charges",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    chargeType: text("charge_type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    /** lump_sum | per_sqft | percent */
    basis: text("basis").notNull().default("lump_sum"),
    isIncludedInDemand: boolean("is_included_in_demand").notNull().default(false),
    /** Off by default; a charge is only published when deliberately opened. */
    publicVisible: boolean("public_visible").notNull().default(false),
  },
  (t) => [index("property_charges_property_idx").on(t.propertyId)]
);

/** Every demand-price change, so a negotiation has a paper trail. */
export const propertyPriceHistory = mysqlTable(
  "property_price_history",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    demandPrice: bigint("demand_price", { mode: "number" }),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    changedBy: text("changed_by"),
    reason: text("reason"),
  },
  (t) => [index("property_price_history_property_idx").on(t.propertyId, t.changedAt)]
);

/**
 * Legal documents. Files are NEVER public URLs — `storageKey` is resolved
 * by an admin-gated route that calls requireAdmin() and streams the bytes.
 * Never put these in a sitemap, JSON-LD or an <Image> src.
 */
export const propertyDocuments = mysqlTable(
  "property_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: int("size_bytes").notNull(),
    note: text("note"),
    uploadedBy: text("uploaded_by"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    /**
     * The ONLY thing that makes a document downloadable without logging in.
     *
     * Read this before you touch it. Every row in this table has been
     * private since the table existed — registry papers, sale deeds, owner
     * KYC — and the public site has no route that can reach them. Brochures
     * are the one legitimate exception: buyers expect to download them, and
     * the client's reference portal offers exactly that.
     *
     * Three rules, all deliberate:
     *   1. Defaults to false. A document is private unless a human ticked
     *      this box for that specific file.
     *   2. NEVER infer it from `docType`. "Brochure" as a type is a label an
     *      admin typed; it is not consent to publish, and a mistyped type
     *      must not be able to publish a sale deed.
     *   3. A public document must be stored in the public bucket, not the
     *      private one — see lib/storage.ts. Flipping this flag alone does
     *      not move bytes, and serving a private-bucket file from a public
     *      route would defeat the split.
     * scripts/leak-check.mjs asserts the seeded registry document never
     * appears in public HTML; keep it that way.
     */
    isPublic: boolean("is_public").notNull().default(false),
  },
  (t) => [index("property_documents_property_idx").on(t.propertyId)]
);

/**
 * Every enquiry, persisted before the email is sent so an SMTP failure
 * cannot lose a lead.
 */
export const leads = mysqlTable(
  "leads",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: text("phone"),
    interest: text("interest"),
    message: text("message"),
    /** Shortlisted properties when the enquiry came from the cart. */
    propertyIds: json("property_ids").$type<number[]>(),
    pageUrl: text("page_url"),
    source: text("source"),
    utm: json("utm").$type<Record<string, string>>(),
    status: varchar("status", { length: 40 }).notNull().default("new"),
    assignedTo: text("assigned_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("leads_status_idx").on(t.status, t.createdAt)]
);

// ─── CRM — internal always, never imported by lib/db/queries.ts ────────────
// Named crm_* deliberately: `deals` (above) is the unrelated Deal-of-the-Week
// marketing feature, and the two must never collide on a shared name.

export const crmClients = mysqlTable("crm_clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: text("phone"),
  email: varchar("email", { length: 255 }),
  requirementNotes: text("requirement_notes"),
  budgetMin: bigint("budget_min", { mode: "number" }),
  budgetMax: bigint("budget_max", { mode: "number" }),
  preferredLocations: json("preferred_locations").$type<string[]>(),
  preferredTypes: json("preferred_types").$type<string[]>(),
  /** Set when this client originated from a website enquiry (R-30). */
  convertedFromLeadId: int("converted_from_lead_id").references(() => leads.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * One property per deal, many deals per client — R-30's stated default
 * where the client didn't confirm otherwise. A lead shortlisting three
 * properties becomes one client and three deals on conversion, not one
 * deal juggling three properties.
 */
export const crmDeals = mysqlTable(
  "crm_deals",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("client_id")
      .notNull()
      .references(() => crmClients.id, { onDelete: "cascade" }),
    propertyId: int("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    stage: varchar("stage", { length: 40 }).notNull().default("Enquiry"),
    dealValue: bigint("deal_value", { mode: "number" }),
    /** Percent of dealValue; the stored brokerage amount below can override it. */
    brokeragePercent: bigint("brokerage_percent_bp", { mode: "number" }),
    /** Basis points (1% = 100bp) — avoids float rounding on a money figure. */
    brokerageAmountOverride: bigint("brokerage_amount_override", { mode: "number" }),
    sharedWithName: text("shared_with_name"),
    sharedAmount: bigint("shared_amount", { mode: "number" }),
    assignedTo: text("assigned_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
  },
  (t) => [
    index("crm_deals_client_idx").on(t.clientId),
    index("crm_deals_stage_idx").on(t.stage),
  ]
);

/** Dated payment entries so partial brokerage receipts add up (R-31). */
export const crmPayments = mysqlTable(
  "crm_payments",
  {
    id: int("id").autoincrement().primaryKey(),
    dealId: int("deal_id")
      .notNull()
      .references(() => crmDeals.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    paidAt: date("paid_at", { mode: "string" }).notNull(),
    mode: text("mode"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("crm_payments_deal_idx").on(t.dealId)]
);

/** Call / site visit / note / WhatsApp / email, timestamped and authored (R-30). */
export const crmActivities = mysqlTable(
  "crm_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("client_id")
      .notNull()
      .references(() => crmClients.id, { onDelete: "cascade" }),
    dealId: int("deal_id").references(() => crmDeals.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    note: text("note"),
    author: text("author"),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    /** Optional next-contact reminder ("call back on…") set when logging this activity. */
    followUpAt: timestamp("follow_up_at"),
  },
  (t) => [
    index("crm_activities_client_idx").on(t.clientId, t.occurredAt),
    index("crm_activities_followup_idx").on(t.followUpAt),
  ]
);

export const crmClientsRelations = relations(crmClients, ({ many, one }) => ({
  deals: many(crmDeals),
  activities: many(crmActivities),
  fromLead: one(leads, { fields: [crmClients.convertedFromLeadId], references: [leads.id] }),
}));

export const crmDealsRelations = relations(crmDeals, ({ one, many }) => ({
  client: one(crmClients, { fields: [crmDeals.clientId], references: [crmClients.id] }),
  property: one(properties, { fields: [crmDeals.propertyId], references: [properties.id] }),
  payments: many(crmPayments),
  activities: many(crmActivities),
}));

export const crmPaymentsRelations = relations(crmPayments, ({ one }) => ({
  deal: one(crmDeals, { fields: [crmPayments.dealId], references: [crmDeals.id] }),
}));

export const crmActivitiesRelations = relations(crmActivities, ({ one }) => ({
  client: one(crmClients, { fields: [crmActivities.clientId], references: [crmClients.id] }),
  deal: one(crmDeals, { fields: [crmActivities.dealId], references: [crmDeals.id] }),
}));

/**
 * Admin-editable overrides for company details and stats, so changing a
 * phone number is not a code deploy. lib/data.ts stays the fallback default.
 */
export const siteSettings = mysqlTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const VIDEO_PROVIDERS = ["youtube", "instagram"] as const;

/** Video testimonials/reels, managed in the admin, shown on the landing page. */
export const testimonialVideos = mysqlTable("testimonial_videos", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", VIDEO_PROVIDERS).notNull().default("youtube"),
  /** YouTube 11-char id, or Instagram post/reel shortcode. */
  videoId: text("video_id").notNull(),
  /** Caption under the video — e.g. "Grand Mega Township, Panchkula Extension". */
  caption: text("caption").notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TestimonialVideo = typeof testimonialVideos.$inferSelect;

/**
 * Deal of the Week queue. Active = today within [startsAt, endsAt].
 * NOTE: this is the marketing feature, not the CRM. The CRM's pipeline
 * tables are named crm_* precisely so they never collide with this.
 */
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  startsAt: date("starts_at", { mode: "string" }).notNull(),
  endsAt: date("ends_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Areas — the "explore by location" landing pages (R-46).
 *
 * An area is editorial, not derived: the set of localities worth a landing
 * page is a judgement call the broker makes, and it needs a photograph and
 * a paragraph that no query can produce. What is NOT stored here is the
 * property count — that is always counted live off `properties`, because a
 * cached count is a number that goes stale silently and then lies on a
 * public page.
 *
 * `matchCity` / `matchLocality` are how an area claims its listings. Kept as
 * plain text matched case-insensitively against the same columns on
 * `properties` rather than a join table: a listing belongs to its locality
 * by virtue of where it is, and making the broker maintain that link by
 * hand on every save is work the address already did.
 */
export const areas = mysqlTable(
  "areas",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    /** Which city this area sits in — drives the "6 Areas of X" grouping. */
    city: varchar("city", { length: 100 }),
    /** Value matched against properties.city (case-insensitive). */
    matchCity: text("match_city"),
    /** Value matched against properties.locality (case-insensitive). */
    matchLocality: text("match_locality"),
    coverImage: text("cover_image"),
    coverImageKey: text("cover_image_key"),
    blurb: text("blurb"),
    sortOrder: int("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("areas_published_idx").on(t.isPublished, t.sortOrder)]
);

export type Area = typeof areas.$inferSelect;

/**
 * Unit sizes — the "2 BHK / 1750 sq.ft / ₹3.2 Cr" table a project page
 * shows. `properties.configurations` already holds the range as strings
 * ("2-4 BHK") for filtering; it cannot hold an area and a price per
 * configuration, which is what a buyer actually compares.
 *
 * Public. Price here is the advertised starting figure for that unit type,
 * not the negotiated one — the internal demand price stays on `properties`
 * behind `showPricePublicly`.
 */
export const propertyUnitSizes = mysqlTable(
  "property_unit_sizes",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    /** "2 BHK", "3 + S BHK" — free text, the client's own vocabulary. */
    unitLabel: text("unit_label").notNull(),
    areaValue: int("area_value"),
    areaUnit: text("area_unit"),
    /** Whole rupees, same convention as every other money column here. */
    price: bigint("price", { mode: "number" }),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("property_unit_sizes_property_idx").on(t.propertyId, t.sortOrder)]
);

/**
 * "Schedule a tour" requests. A sibling of `leads`, not a variant of it:
 * a tour has a date, a time and a tour type, and mixing those nullable
 * columns into the enquiry inbox would blur two things the broker works
 * through differently. Internal — never read by a public query.
 */
export const tourRequests = mysqlTable(
  "tour_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    propertyId: int("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    phone: text("phone"),
    email: varchar("email", { length: 255 }),
    /** In person / video call — the reference portal offers both. */
    tourType: text("tour_type"),
    preferredDate: date("preferred_date", { mode: "string" }),
    preferredTime: text("preferred_time"),
    message: text("message"),
    status: varchar("status", { length: 40 }).notNull().default("new"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("tour_requests_status_idx").on(t.status, t.createdAt)]
);

/** Advisory services shown on the landing page ("Buying or Selling", "Home Loan"). */
export const services = mysqlTable(
  "services",
  {
    id: int("id").autoincrement().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    /** Key into a fixed inline-SVG set in the UI — not a URL, not user HTML. */
    icon: text("icon"),
    href: text("href"),
    sortOrder: int("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
  },
  (t) => [index("services_published_idx").on(t.isPublished, t.sortOrder)]
);

/**
 * Written testimonials. Separate table from `testimonial_videos` rather
 * than a nullable-everything merge: a quote and a reel share only a sort
 * order, and the admin screens for them look nothing alike.
 */
export const textTestimonials = mysqlTable(
  "text_testimonials",
  {
    id: int("id").autoincrement().primaryKey(),
    quote: text("quote").notNull(),
    author: text("author").notNull(),
    /** "Bought in Sector 71" — context that makes the quote credible. */
    context: text("context"),
    /**
     * Client's photo for the testimonial wall. Optional on purpose: the
     * card falls back to the author's initials, so a quote is never held
     * back waiting for a headshot.
     */
    avatarUrl: text("avatar_url"),
    sortOrder: int("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("text_testimonials_published_idx").on(t.isPublished, t.sortOrder)]
);

/**
 * Newsletter list. Internal — an email address given for one purpose.
 * `unsubscribedAt` rather than a delete so an unsubscribe is durable: a
 * deleted row would be re-added silently by the next form submission.
 */
export const newsletterSubscribers = mysqlTable(
  "newsletter_subscribers",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    source: text("source"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
  },
  (t) => [index("newsletter_subscribers_created_idx").on(t.createdAt)]
);

// ─── Relations ─────────────────────────────────────────────────────────────

export const buildersRelations = relations(builders, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  builder: one(builders, {
    fields: [projects.builderId],
    references: [builders.id],
  }),
  properties: many(properties),
  towers: many(towers),
}));

export const towersRelations = relations(towers, ({ one, many }) => ({
  project: one(projects, {
    fields: [towers.projectId],
    references: [projects.id],
  }),
  units: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  project: one(projects, {
    fields: [properties.projectId],
    references: [projects.id],
  }),
  tower: one(towers, {
    fields: [properties.towerId],
    references: [towers.id],
  }),
  images: many(propertyImages),
  media: many(propertyMedia),
  deals: many(deals),
  owners: many(propertyOwners),
  /**
   * 1:1 internal facts (circle rate, mortgage flag, private notes). Declared
   * so the admin edit page can load them; deliberately absent from every
   * allowlist in lib/db/public-columns.ts, and no public query names it.
   */
  internal: one(propertyInternal, {
    fields: [properties.id],
    references: [propertyInternal.propertyId],
  }),
  charges: many(propertyCharges),
  documents: many(propertyDocuments),
  priceHistory: many(propertyPriceHistory),
  unitSizes: many(propertyUnitSizes),
}));

export const propertyUnitSizesRelations = relations(propertyUnitSizes, ({ one }) => ({
  property: one(properties, {
    fields: [propertyUnitSizes.propertyId],
    references: [properties.id],
  }),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const propertyMediaRelations = relations(propertyMedia, ({ one }) => ({
  property: one(properties, {
    fields: [propertyMedia.propertyId],
    references: [properties.id],
  }),
}));

export const propertyOwnersRelations = relations(propertyOwners, ({ one }) => ({
  property: one(properties, {
    fields: [propertyOwners.propertyId],
    references: [properties.id],
  }),
}));

export const propertyChargesRelations = relations(propertyCharges, ({ one }) => ({
  property: one(properties, {
    fields: [propertyCharges.propertyId],
    references: [properties.id],
  }),
}));

export const propertyDocumentsRelations = relations(propertyDocuments, ({ one }) => ({
  property: one(properties, {
    fields: [propertyDocuments.propertyId],
    references: [properties.id],
  }),
}));

export const propertyInternalRelations = relations(propertyInternal, ({ one }) => ({
  property: one(properties, {
    fields: [propertyInternal.propertyId],
    references: [properties.id],
  }),
}));

export const propertyPriceHistoryRelations = relations(
  propertyPriceHistory,
  ({ one }) => ({
    property: one(properties, {
      fields: [propertyPriceHistory.propertyId],
      references: [properties.id],
    }),
  })
);

export const dealsRelations = relations(deals, ({ one }) => ({
  property: one(properties, {
    fields: [deals.propertyId],
    references: [properties.id],
  }),
}));

// ─── Types ─────────────────────────────────────────────────────────────────

export type Builder = typeof builders.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Tower = typeof towers.$inferSelect;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type PropertyMedium = typeof propertyMedia.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type CrmClient = typeof crmClients.$inferSelect;

/**
 * The FULL row, internal columns included. Admin-only by construction —
 * public components must accept PublicProperty (lib/db/public-columns.ts)
 * so that handing one of these to a public component is a type error.
 */
export type AdminProperty = typeof properties.$inferSelect;
