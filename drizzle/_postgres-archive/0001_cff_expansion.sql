CREATE TABLE "builders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"belongs_to" text,
	"about" text,
	"website" text,
	"logo_url" text,
	"contact_name" text,
	"contact_phone" text,
	"past_projects" text,
	"price_appreciation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "builders_name_unique" UNIQUE("name"),
	CONSTRAINT "builders_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"interest" text,
	"message" text,
	"property_ids" integer[],
	"page_url" text,
	"source" text,
	"utm" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"assigned_to" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"charge_type" text NOT NULL,
	"amount" bigint NOT NULL,
	"basis" text DEFAULT 'lump_sum' NOT NULL,
	"is_included_in_demand" boolean DEFAULT false NOT NULL,
	"public_visible" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"doc_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"note" text,
	"uploaded_by" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_internal" (
	"property_id" integer PRIMARY KEY NOT NULL,
	"circle_rate" bigint,
	"market_value_note" text,
	"is_mortgaged" boolean DEFAULT false,
	"internal_notes" text,
	"next_follow_up_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "property_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"name" text NOT NULL,
	"seller_category" text,
	"owner_type" text,
	"owner_count" integer,
	"mobile" text,
	"alt_mobile" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"demand_price" bigint,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by" text,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "towers" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"total_floors" integer,
	"units_per_floor" integer,
	"total_units" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "builder_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "possession_status" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "launch_date" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "possession_date" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "price_appreciation" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "total_towers" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "total_units" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "number_of_floors" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "green_area_value" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "green_area_unit" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "amenities" text[];--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "country" text DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "locality" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sector" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "tower_id" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "ref_code" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "publication_state" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "listing_status" text DEFAULT 'Available' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "added_by" text DEFAULT 'Global Landmark' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "source_name" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "listed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "country" text DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "locality" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "sector" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "block" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "society" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "floor_number" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "total_floors" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "unit_number" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "deal_attributes" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "configurations" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "balconies" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "room_flags" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "property_age" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "plot_area" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "plot_area_unit" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "built_up_area" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "built_up_area_unit" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "super_area" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "super_area_unit" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "carpet_area" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "carpet_area_unit" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "area_sqft" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "front_feet" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "depth_feet" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "plc_attributes" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "road_width" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "entrance_width" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "ceiling_height" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_corner" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_park_facing" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "furnishing_inventory" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "parking_types" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "parking_slots" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "legal_flags" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rera_number" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "documentation_flags" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "loan_flags" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "banks_on_panel" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "demand_price" bigint;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "per_sqft_rate" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_negotiable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "show_price_publicly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "property_images" ADD COLUMN "media_kind" text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "property_charges" ADD CONSTRAINT "property_charges_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_internal" ADD CONSTRAINT "property_internal_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_price_history" ADD CONSTRAINT "property_price_history_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "towers" ADD CONSTRAINT "towers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "property_charges_property_idx" ON "property_charges" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_documents_property_idx" ON "property_documents" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_media_property_idx" ON "property_media" USING btree ("property_id","sort_order");--> statement-breakpoint
CREATE INDEX "property_owners_property_idx" ON "property_owners" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_owners_mobile_idx" ON "property_owners" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "property_price_history_property_idx" ON "property_price_history" USING btree ("property_id","changed_at");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_builder_id_builders_id_fk" FOREIGN KEY ("builder_id") REFERENCES "public"."builders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_tower_id_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."towers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_public_idx" ON "properties" USING btree ("publication_state","listing_status");--> statement-breakpoint
CREATE INDEX "properties_city_idx" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "properties_project_idx" ON "properties" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "properties_tower_idx" ON "properties" USING btree ("tower_id");--> statement-breakpoint
CREATE INDEX "properties_price_idx" ON "properties" USING btree ("demand_price");--> statement-breakpoint
CREATE INDEX "properties_area_idx" ON "properties" USING btree ("area_sqft");--> statement-breakpoint
CREATE INDEX "property_images_property_idx" ON "property_images" USING btree ("property_id","sort_order");--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_ref_code_unique" UNIQUE("ref_code");--> statement-breakpoint
-- ─── Backfill for rows that existed before the CFF expansion ───────────────
-- New columns default to the values that are right for NEW listings, which
-- are not the values that are right for the six already-live ones. Without
-- this block every existing property would silently vanish from the public
-- site the moment this migration ran, because publication_state defaults to
-- 'draft'.

UPDATE "properties"
SET "publication_state" = 'published',
    "listing_status"    = 'Available',
    "listed_at"         = "created_at"
WHERE "publication_state" = 'draft';--> statement-breakpoint

-- Best-effort city from the old free-text location. Anything that does not
-- name a known city is left NULL rather than guessed — "Tricity" is a
-- region, not a city, and a wrong city would put a listing under the wrong
-- filter tab. The original text stays in `location` as the display fallback.
UPDATE "properties" SET "city" =
  CASE
    WHEN "location" ILIKE '%Panchkula Extension%' THEN 'Panchkula Extension'
    WHEN "location" ILIKE '%Panchkula%'           THEN 'Panchkula'
    WHEN "location" ILIKE '%Zirakpur%'            THEN 'Zirakpur'
    WHEN "location" ILIKE '%Mohali%'              THEN 'Mohali'
    WHEN "location" ILIKE '%New Chandigarh%'      THEN 'New Chandigarh'
    WHEN "location" ILIKE '%Chandigarh%'          THEN 'Chandigarh'
    WHEN "location" ILIKE '%Derabassi%'           THEN 'Derabassi'
    WHEN "location" ILIKE '%Kharar%'              THEN 'Kharar'
    WHEN "location" ILIKE '%Mullanpur%'           THEN 'Mullanpur'
    ELSE NULL
  END
WHERE "city" IS NULL;--> statement-breakpoint

-- Normalised sq.ft, so mixed-unit sorting works on legacy rows too. The
-- multipliers must match SQFT_PER_UNIT in lib/taxonomy/area.ts.
UPDATE "properties" SET "area_sqft" = ROUND("area_value" *
  CASE "area_unit"
    WHEN 'sqft'  THEN 1
    WHEN 'sqyd'  THEN 9
    WHEN 'marla' THEN 272.25
    WHEN 'kanal' THEN 5445
    WHEN 'acre'  THEN 43560
    WHEN 'biswa' THEN 1361.25
    WHEN 'bigha' THEN 27225
    ELSE NULL
  END)
WHERE "area_value" IS NOT NULL AND "area_sqft" IS NULL;--> statement-breakpoint

-- Reference codes for pre-existing listings (R-07). Codes are assigned in
-- creation order so they read chronologically, and the city prefix mirrors
-- cityCode() in lib/taxonomy/status.ts. New listings get theirs on insert.
WITH numbered AS (
  SELECT "id",
         ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS seq,
         CASE "city"
           WHEN 'Chandigarh'          THEN 'CHD'
           WHEN 'Panchkula'           THEN 'PKL'
           WHEN 'Panchkula Extension' THEN 'PKX'
           WHEN 'Mohali'              THEN 'MOH'
           WHEN 'Zirakpur'            THEN 'ZKP'
           WHEN 'New Chandigarh'      THEN 'NCH'
           WHEN 'Derabassi'           THEN 'DRB'
           WHEN 'Kharar'              THEN 'KHR'
           WHEN 'Mullanpur'           THEN 'MLP'
           ELSE 'GEN'
         END AS prefix
  FROM "properties"
  WHERE "ref_code" IS NULL
)
UPDATE "properties" p
SET "ref_code" = 'GL-' || n.prefix || '-'
  || TO_CHAR("p"."created_at", 'YY') || '-'
  || LPAD(n.seq::text, 4, '0')
FROM numbered n
WHERE p."id" = n."id";--> statement-breakpoint

-- Existing gallery rows predate media categories; the first image of each
-- property is its cover, matching how the pages already render them.
UPDATE "property_images" pi
SET "media_kind" = 'cover'
WHERE pi."id" IN (
  SELECT DISTINCT ON ("property_id") "id"
  FROM "property_images"
  ORDER BY "property_id", "sort_order", "id"
);
