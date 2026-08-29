CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"city" text,
	"match_city" text,
	"match_locality" text,
	"cover_image" text,
	"cover_image_key" text,
	"blurb" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "property_unit_sizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"unit_label" text NOT NULL,
	"area_value" integer,
	"area_unit" text,
	"price" bigint,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"href" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote" text NOT NULL,
	"author" text NOT NULL,
	"context" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tour_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"tour_type" text,
	"preferred_date" date,
	"preferred_time" text,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "longitude" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "show_map_publicly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "property_documents" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "property_unit_sizes" ADD CONSTRAINT "property_unit_sizes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_requests" ADD CONSTRAINT "tour_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "areas_published_idx" ON "areas" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_created_idx" ON "newsletter_subscribers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "property_unit_sizes_property_idx" ON "property_unit_sizes" USING btree ("property_id","sort_order");--> statement-breakpoint
CREATE INDEX "services_published_idx" ON "services" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "text_testimonials_published_idx" ON "text_testimonials" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "tour_requests_status_idx" ON "tour_requests" USING btree ("status","created_at");