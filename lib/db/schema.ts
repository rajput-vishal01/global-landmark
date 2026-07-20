import {
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// A listing is either a whole project/society or a single unit within one.
export const propertyKind = pgEnum("property_kind", ["project", "unit"]);

// The four hero categories; user-facing labels live in lib/categories.ts.
export const propertyCategory = pgEnum("property_category", [
  "sale",
  "purchase",
  "lease",
  "invest",
]);

/** Societies/projects managed by the admin ("Nirvana", "Green Lotus", ...). */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  builderName: text("builder_name"),
  reraNumber: text("rera_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Listings. No price by design — deals close over calls, not on the site. */
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  kind: propertyKind("kind").notNull().default("unit"),
  category: propertyCategory("category").notNull().default("sale"),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull().default(""),
  location: text("location").notNull().default(""),
  // Optional attributes — null/empty simply doesn't render. Values are
  // validated against the lists in lib/attributes.ts, stored as text so
  // adding an option never needs a migration.
  propertyType: text("property_type"),
  configuration: text("configuration"),
  beds: integer("beds"),
  baths: integer("baths"),
  areaValue: integer("area_value"),
  areaUnit: text("area_unit").notNull().default("sqft"),
  facing: text("facing"),
  possessionStatus: text("possession_status"),
  furnishing: text("furnishing"),
  amenities: text("amenities").array(),
  /** Admin-defined custom attributes — anything not covered by the fields above. */
  extras: jsonb("extras").$type<{ title: string; description: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Gallery images. publicId null = external URL (seed / paste mode), not Cloudinary. */
export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  publicId: text("public_id"),
  alt: text("alt").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
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

/** Deal of the Week queue. Active = today within [startsAt, endsAt]. */
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  startsAt: date("starts_at").notNull(),
  endsAt: date("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  project: one(projects, {
    fields: [properties.projectId],
    references: [projects.id],
  }),
  images: many(propertyImages),
  deals: many(deals),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  property: one(properties, {
    fields: [deals.propertyId],
    references: [properties.id],
  }),
}));

export type Project = typeof projects.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type Deal = typeof deals.$inferSelect;

export type PropertyWithImages = Property & {
  images: PropertyImage[];
  project: Project | null;
};
