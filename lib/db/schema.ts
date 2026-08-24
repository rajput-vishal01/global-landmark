import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
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
export const propertyKind = pgEnum("property_kind", ["project", "unit"]);

// The four hero categories; user-facing labels live in lib/categories.ts.
export const propertyCategory = pgEnum("property_category", [
  "sale",
  "purchase",
  "lease",
  "invest",
]);

/** Builders, so a project pitch pulls their details straight from the CRM. */
export const builders = pgTable("builders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
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
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  /** Kept as free text for legacy rows; `builderId` is the real link. */
  builderName: text("builder_name"),
  builderId: integer("builder_id").references(() => builders.id, {
    onDelete: "set null",
  }),
  reraNumber: text("rera_number"),
  possessionStatus: text("possession_status"),
  launchDate: date("launch_date"),
  possessionDate: date("possession_date"),
  /** Internal — a projection, not a published claim. */
  priceAppreciation: text("price_appreciation"),
  totalTowers: integer("total_towers"),
  totalUnits: integer("total_units"),
  numberOfFloors: integer("number_of_floors"),
  greenAreaValue: integer("green_area_value"),
  greenAreaUnit: text("green_area_unit"),
  /** Society-wide amenities; a unit inherits these instead of re-entering. */
  amenities: text("amenities").array(),
  country: text("country").default("India"),
  city: text("city"),
  locality: text("locality"),
  sector: text("sector"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Towers within a project — a single building can hold many available units. */
export const towers = pgTable("towers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  totalFloors: integer("total_floors"),
  unitsPerFloor: integer("units_per_floor"),
  totalUnits: integer("total_units"),
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
export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    kind: propertyKind("kind").notNull().default("unit"),
    category: propertyCategory("category").notNull().default("sale"),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    towerId: integer("tower_id").references(() => towers.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull().default(""),

    // --- Provenance and lifecycle (CFF 1) — all internal ------------------
    /** GL-PKL-26-0142. Assigned once on insert, never reused. */
    refCode: text("ref_code").unique(),
    /** draft | published | archived. Only published + Available is public. */
    publicationState: text("publication_state").notNull().default("draft"),
    listingStatus: text("listing_status").notNull().default("Available"),
    /** Global Landmark | Dealer | Owner, with `sourceName` naming which. */
    addedBy: text("added_by").notNull().default("Global Landmark"),
    sourceName: text("source_name"),
    /** When it went on the market — distinct from row creation. */
    listedAt: timestamp("listed_at").defaultNow().notNull(),

    // --- Location (CFF 3) --------------------------------------------------
    /** Free-text address line, kept as the display fallback for legacy rows. */
    location: text("location").notNull().default(""),
    country: text("country").default("India"),
    city: text("city"),
    locality: text("locality"),
    sector: text("sector"),
    block: text("block"),
    society: text("society"),
    floorNumber: integer("floor_number"),
    totalFloors: integer("total_floors"),
    /** CONFIRM whether this may be shown publicly; treated as internal. */
    unitNumber: text("unit_number"),

    // --- Classification (CFF 2, 7, 10, 11, 12) -----------------------------
    propertyType: text("property_type"),
    /** Pre-Leased / Investment — deal shape, orthogonal to the type. */
    dealAttributes: text("deal_attributes").array(),
    /** One value for a unit. */
    configuration: text("configuration"),
    /** Projects advertise a range ("2-4 BHK"), which one value cannot hold. */
    configurations: text("configurations").array(),
    beds: integer("beds"),
    baths: integer("baths"),
    balconies: integer("balconies"),
    roomFlags: text("room_flags").array(),
    facing: text("facing"),
    possessionStatus: text("possession_status"),
    propertyAge: text("property_age"),

    // --- Area (CFF 5) ------------------------------------------------------
    /** Legacy display area — the value shown when no measure is specified. */
    areaValue: integer("area_value"),
    areaUnit: text("area_unit").notNull().default("sqft"),
    plotArea: integer("plot_area"),
    plotAreaUnit: text("plot_area_unit"),
    builtUpArea: integer("built_up_area"),
    builtUpAreaUnit: text("built_up_area_unit"),
    superArea: integer("super_area"),
    superAreaUnit: text("super_area_unit"),
    carpetArea: integer("carpet_area"),
    carpetAreaUnit: text("carpet_area_unit"),
    /**
     * Primary area normalised to sq.ft, written by the server action. Exists
     * only so filtering and sorting can compare a 500 sq.yd plot against a
     * 2000 sq.ft flat; never rendered.
     */
    areaSqft: integer("area_sqft"),
    frontFeet: integer("front_feet"),
    depthFeet: integer("depth_feet"),
    plcAttributes: text("plc_attributes").array(),

    // --- Specifications (CFF 20) -------------------------------------------
    roadWidth: integer("road_width"),
    entranceWidth: integer("entrance_width"),
    ceilingHeight: integer("ceiling_height"),
    isCorner: boolean("is_corner").default(false),
    isParkFacing: boolean("is_park_facing").default(false),

    // --- Features (CFF 9, 15, 16) ------------------------------------------
    furnishing: text("furnishing"),
    furnishingInventory: text("furnishing_inventory").array(),
    amenities: text("amenities").array(),
    parkingTypes: text("parking_types").array(),
    parkingSlots: integer("parking_slots"),

    // --- Legal, documentation, loan (CFF 13, 14, 17) -----------------------
    /** Public subset only; "Mortgaged" lives on property_internal. */
    legalFlags: text("legal_flags").array(),
    reraNumber: text("rera_number"),
    /** Internal by default — CONFIRM a trimmed public version. */
    documentationFlags: text("documentation_flags").array(),
    loanFlags: text("loan_flags").array(),
    banksOnPanel: text("banks_on_panel").array(),

    // --- Price (CFF 6) -----------------------------------------------------
    /** Rupees. bigint because int4 tops out around 214 Cr. */
    demandPrice: bigint("demand_price", { mode: "number" }),
    perSqftRate: integer("per_sqft_rate"),
    isNegotiable: boolean("is_negotiable").default(false),
    /** Off by default — "Price on request" stays the standing behaviour. */
    showPricePublicly: boolean("show_price_publicly").notNull().default(false),

    /** Admin-defined custom attributes — anything not covered above. */
    extras: jsonb("extras").$type<{ title: string; description: string }[]>(),
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
export const propertyImages = pgTable(
  "property_images",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
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
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("property_images_property_idx").on(t.propertyId, t.sortOrder)]
);

/**
 * Link media — video, drone, virtual tour, Google Map, brochure. Separate
 * from `property_images` because these are URLs to embed, not files we host,
 * and each embed host needs its own CSP `frame-src` entry before it renders.
 */
export const propertyMedia = pgTable(
  "property_media",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    label: text("label").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("property_media_property_idx").on(t.propertyId, t.sortOrder)]
);

// ─── Internal-only tables — never imported by lib/db/queries.ts ─────────────

/**
 * Owner and seller contacts. The most sensitive group on the site: these
 * phone numbers must never reach a public component. Multiple rows per
 * property because joint ownership is the norm.
 */
export const propertyOwners = pgTable(
  "property_owners",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sellerCategory: text("seller_category"),
    ownerType: text("owner_type"),
    ownerCount: integer("owner_count"),
    mobile: text("mobile"),
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
export const propertyInternal = pgTable("property_internal", {
  propertyId: integer("property_id")
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
export const propertyCharges = pgTable(
  "property_charges",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
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
export const propertyPriceHistory = pgTable(
  "property_price_history",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
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
export const propertyDocuments = pgTable(
  "property_documents",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    note: text("note"),
    uploadedBy: text("uploaded_by"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (t) => [index("property_documents_property_idx").on(t.propertyId)]
);

/**
 * Every enquiry, persisted before the email is sent so an SMTP failure
 * cannot lose a lead.
 */
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    interest: text("interest"),
    message: text("message"),
    /** Shortlisted properties when the enquiry came from the cart. */
    propertyIds: integer("property_ids").array(),
    pageUrl: text("page_url"),
    source: text("source"),
    utm: jsonb("utm").$type<Record<string, string>>(),
    status: text("status").notNull().default("new"),
    assignedTo: text("assigned_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("leads_status_idx").on(t.status, t.createdAt)]
);

// ─── CRM — internal always, never imported by lib/db/queries.ts ────────────
// Named crm_* deliberately: `deals` (above) is the unrelated Deal-of-the-Week
// marketing feature, and the two must never collide on a shared name.

export const crmClients = pgTable("crm_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  requirementNotes: text("requirement_notes"),
  budgetMin: bigint("budget_min", { mode: "number" }),
  budgetMax: bigint("budget_max", { mode: "number" }),
  preferredLocations: text("preferred_locations").array(),
  preferredTypes: text("preferred_types").array(),
  /** Set when this client originated from a website enquiry (R-30). */
  convertedFromLeadId: integer("converted_from_lead_id").references(() => leads.id, {
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
export const crmDeals = pgTable(
  "crm_deals",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => crmClients.id, { onDelete: "cascade" }),
    propertyId: integer("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    stage: text("stage").notNull().default("Enquiry"),
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
export const crmPayments = pgTable(
  "crm_payments",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => crmDeals.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    paidAt: date("paid_at").notNull(),
    mode: text("mode"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("crm_payments_deal_idx").on(t.dealId)]
);

/** Call / site visit / note / WhatsApp / email, timestamped and authored (R-30). */
export const crmActivities = pgTable(
  "crm_activities",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => crmClients.id, { onDelete: "cascade" }),
    dealId: integer("deal_id").references(() => crmDeals.id, { onDelete: "cascade" }),
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
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoProvider = pgEnum("video_provider", ["youtube", "instagram"]);

/** Video testimonials/reels, managed in the admin, shown on the landing page. */
export const testimonialVideos = pgTable("testimonial_videos", {
  id: serial("id").primaryKey(),
  provider: videoProvider("provider").notNull().default("youtube"),
  /** YouTube 11-char id, or Instagram post/reel shortcode. */
  videoId: text("video_id").notNull(),
  /** Caption under the video — e.g. "Grand Mega Township, Panchkula Extension". */
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TestimonialVideo = typeof testimonialVideos.$inferSelect;

/**
 * Deal of the Week queue. Active = today within [startsAt, endsAt].
 * NOTE: this is the marketing feature, not the CRM. The CRM's pipeline
 * tables are named crm_* precisely so they never collide with this.
 */
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  startsAt: date("starts_at").notNull(),
  endsAt: date("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export type PropertyOwner = typeof propertyOwners.$inferSelect;
export type PropertyCharge = typeof propertyCharges.$inferSelect;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type PropertyInternal = typeof propertyInternal.$inferSelect;

/**
 * Legacy alias. Public code should move to PublicProperty; kept so the
 * existing components keep compiling until phase 4 reworks them.
 */
export type Property = AdminProperty;

export type PropertyWithImages = AdminProperty & {
  images: PropertyImage[];
  project: Project | null;
};
