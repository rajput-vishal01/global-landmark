CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`city` varchar(100),
	`match_city` text,
	`match_locality` text,
	`cover_image` text,
	`cover_image_key` text,
	`blurb` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `areas_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `builders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`belongs_to` text,
	`about` text,
	`website` text,
	`logo_url` text,
	`contact_name` text,
	`contact_phone` text,
	`past_projects` text,
	`price_appreciation` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `builders_id` PRIMARY KEY(`id`),
	CONSTRAINT `builders_name_unique` UNIQUE(`name`),
	CONSTRAINT `builders_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `crm_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`deal_id` int,
	`kind` text NOT NULL,
	`note` text,
	`author` text,
	`occurred_at` timestamp NOT NULL DEFAULT (now()),
	`follow_up_at` timestamp,
	CONSTRAINT `crm_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` text,
	`email` varchar(255),
	`requirement_notes` text,
	`budget_min` bigint,
	`budget_max` bigint,
	`preferred_locations` json,
	`preferred_types` json,
	`converted_from_lead_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`property_id` int,
	`stage` varchar(40) NOT NULL DEFAULT 'Enquiry',
	`deal_value` bigint,
	`brokerage_percent_bp` bigint,
	`brokerage_amount_override` bigint,
	`shared_with_name` text,
	`shared_amount` bigint,
	`assigned_to` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`closed_at` timestamp,
	CONSTRAINT `crm_deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deal_id` int NOT NULL,
	`amount` bigint NOT NULL,
	`paid_at` date NOT NULL,
	`mode` text,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`starts_at` date NOT NULL,
	`ends_at` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` text,
	`interest` text,
	`message` text,
	`property_ids` json,
	`page_url` text,
	`source` text,
	`utm` json,
	`status` varchar(40) NOT NULL DEFAULT 'new',
	`assigned_to` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`source` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`unsubscribed_at` timestamp,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`builder_name` text,
	`builder_id` int,
	`rera_number` text,
	`possession_status` text,
	`launch_date` date,
	`possession_date` date,
	`price_appreciation` text,
	`total_towers` int,
	`total_units` int,
	`number_of_floors` int,
	`green_area_value` int,
	`green_area_unit` text,
	`amenities` json,
	`country` text DEFAULT ('India'),
	`city` varchar(100),
	`locality` text,
	`sector` text,
	`cover_image` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_name_unique` UNIQUE(`name`),
	CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`kind` enum('project','unit') NOT NULL DEFAULT 'unit',
	`category` enum('sale','purchase','lease','invest') NOT NULL DEFAULT 'sale',
	`project_id` int,
	`tower_id` int,
	`description` text NOT NULL DEFAULT (''),
	`ref_code` varchar(40),
	`publication_state` varchar(40) NOT NULL DEFAULT 'draft',
	`listing_status` varchar(40) NOT NULL DEFAULT 'Available',
	`added_by` text NOT NULL DEFAULT ('Global Landmark'),
	`source_name` text,
	`listed_at` timestamp NOT NULL DEFAULT (now()),
	`submitted_at` timestamp,
	`location` text NOT NULL DEFAULT (''),
	`country` text DEFAULT ('India'),
	`city` varchar(100),
	`locality` text,
	`sector` text,
	`block` text,
	`society` text,
	`floor_number` int,
	`total_floors` int,
	`unit_number` text,
	`latitude` text,
	`longitude` text,
	`show_map_publicly` boolean NOT NULL DEFAULT false,
	`property_type` varchar(100),
	`deal_attributes` json,
	`configuration` text,
	`configurations` json,
	`beds` int,
	`baths` int,
	`balconies` int,
	`room_flags` json,
	`facing` text,
	`possession_status` text,
	`property_age` text,
	`area_value` int,
	`area_unit` text NOT NULL DEFAULT ('sqft'),
	`plot_area` int,
	`plot_area_unit` text,
	`built_up_area` int,
	`built_up_area_unit` text,
	`super_area` int,
	`super_area_unit` text,
	`carpet_area` int,
	`carpet_area_unit` text,
	`area_sqft` int,
	`front_feet` int,
	`depth_feet` int,
	`plc_attributes` json,
	`road_width` int,
	`entrance_width` int,
	`ceiling_height` int,
	`is_corner` boolean DEFAULT false,
	`is_park_facing` boolean DEFAULT false,
	`furnishing` text,
	`furnishing_inventory` json,
	`amenities` json,
	`parking_types` json,
	`parking_slots` int,
	`legal_flags` json,
	`rera_number` text,
	`documentation_flags` json,
	`loan_flags` json,
	`banks_on_panel` json,
	`demand_price` bigint,
	`per_sqft_rate` int,
	`is_negotiable` boolean DEFAULT false,
	`show_price_publicly` boolean NOT NULL DEFAULT false,
	`extras` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `properties_id` PRIMARY KEY(`id`),
	CONSTRAINT `properties_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `properties_ref_code_unique` UNIQUE(`ref_code`)
);
--> statement-breakpoint
CREATE TABLE `property_charges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`charge_type` text NOT NULL,
	`amount` bigint NOT NULL,
	`basis` text NOT NULL DEFAULT ('lump_sum'),
	`is_included_in_demand` boolean NOT NULL DEFAULT false,
	`public_visible` boolean NOT NULL DEFAULT false,
	CONSTRAINT `property_charges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`doc_type` text NOT NULL,
	`storage_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` int NOT NULL,
	`note` text,
	`uploaded_by` text,
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	`is_public` boolean NOT NULL DEFAULT false,
	CONSTRAINT `property_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`url` text NOT NULL,
	`public_id` text,
	`media_kind` text NOT NULL DEFAULT ('other'),
	`alt` text NOT NULL DEFAULT (''),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `property_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_internal` (
	`property_id` int NOT NULL,
	`circle_rate` bigint,
	`market_value_note` text,
	`is_mortgaged` boolean DEFAULT false,
	`internal_notes` text,
	`next_follow_up_at` timestamp,
	CONSTRAINT `property_internal_property_id` PRIMARY KEY(`property_id`)
);
--> statement-breakpoint
CREATE TABLE `property_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`label` text NOT NULL DEFAULT (''),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `property_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_owners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`seller_category` text,
	`owner_type` text,
	`owner_count` int,
	`mobile` varchar(40),
	`alt_mobile` text,
	`address` text,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_owners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`demand_price` bigint,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	`changed_by` text,
	`reason` text,
	CONSTRAINT `property_price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_unit_sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`unit_label` text NOT NULL,
	`area_value` int,
	`area_unit` text,
	`price` bigint,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `property_unit_sizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`icon` text,
	`href` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT true,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` varchar(100) NOT NULL,
	`value` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `testimonial_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('youtube','instagram') NOT NULL DEFAULT 'youtube',
	`video_id` text NOT NULL,
	`caption` text NOT NULL DEFAULT (''),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonial_videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `text_testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote` text NOT NULL,
	`author` text NOT NULL,
	`context` text,
	`avatar_url` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `text_testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tour_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int,
	`name` varchar(255) NOT NULL,
	`phone` text,
	`email` varchar(255),
	`tour_type` text,
	`preferred_date` date,
	`preferred_time` text,
	`message` text,
	`status` varchar(40) NOT NULL DEFAULT 'new',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tour_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `towers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`total_floors` int,
	`units_per_floor` int,
	`total_units` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `towers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_client_id_crm_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `crm_clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_activities` ADD CONSTRAINT `crm_activities_deal_id_crm_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `crm_deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_clients` ADD CONSTRAINT `crm_clients_converted_from_lead_id_leads_id_fk` FOREIGN KEY (`converted_from_lead_id`) REFERENCES `leads`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_client_id_crm_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `crm_clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_deals` ADD CONSTRAINT `crm_deals_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_payments` ADD CONSTRAINT `crm_payments_deal_id_crm_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `crm_deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deals` ADD CONSTRAINT `deals_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_builder_id_builders_id_fk` FOREIGN KEY (`builder_id`) REFERENCES `builders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_tower_id_towers_id_fk` FOREIGN KEY (`tower_id`) REFERENCES `towers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_charges` ADD CONSTRAINT `property_charges_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_documents` ADD CONSTRAINT `property_documents_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_images` ADD CONSTRAINT `property_images_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_internal` ADD CONSTRAINT `property_internal_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_media` ADD CONSTRAINT `property_media_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_owners` ADD CONSTRAINT `property_owners_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_price_history` ADD CONSTRAINT `property_price_history_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_unit_sizes` ADD CONSTRAINT `property_unit_sizes_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tour_requests` ADD CONSTRAINT `tour_requests_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `towers` ADD CONSTRAINT `towers_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `areas_published_idx` ON `areas` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE INDEX `crm_activities_client_idx` ON `crm_activities` (`client_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `crm_activities_followup_idx` ON `crm_activities` (`follow_up_at`);--> statement-breakpoint
CREATE INDEX `crm_deals_client_idx` ON `crm_deals` (`client_id`);--> statement-breakpoint
CREATE INDEX `crm_deals_stage_idx` ON `crm_deals` (`stage`);--> statement-breakpoint
CREATE INDEX `crm_payments_deal_idx` ON `crm_payments` (`deal_id`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_created_idx` ON `newsletter_subscribers` (`created_at`);--> statement-breakpoint
CREATE INDEX `properties_public_idx` ON `properties` (`publication_state`,`listing_status`);--> statement-breakpoint
CREATE INDEX `properties_city_idx` ON `properties` (`city`);--> statement-breakpoint
CREATE INDEX `properties_type_idx` ON `properties` (`property_type`);--> statement-breakpoint
CREATE INDEX `properties_project_idx` ON `properties` (`project_id`);--> statement-breakpoint
CREATE INDEX `properties_tower_idx` ON `properties` (`tower_id`);--> statement-breakpoint
CREATE INDEX `properties_price_idx` ON `properties` (`demand_price`);--> statement-breakpoint
CREATE INDEX `properties_area_idx` ON `properties` (`area_sqft`);--> statement-breakpoint
CREATE INDEX `property_charges_property_idx` ON `property_charges` (`property_id`);--> statement-breakpoint
CREATE INDEX `property_documents_property_idx` ON `property_documents` (`property_id`);--> statement-breakpoint
CREATE INDEX `property_images_property_idx` ON `property_images` (`property_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `property_media_property_idx` ON `property_media` (`property_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `property_owners_property_idx` ON `property_owners` (`property_id`);--> statement-breakpoint
CREATE INDEX `property_owners_mobile_idx` ON `property_owners` (`mobile`);--> statement-breakpoint
CREATE INDEX `property_price_history_property_idx` ON `property_price_history` (`property_id`,`changed_at`);--> statement-breakpoint
CREATE INDEX `property_unit_sizes_property_idx` ON `property_unit_sizes` (`property_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `services_published_idx` ON `services` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE INDEX `text_testimonials_published_idx` ON `text_testimonials` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE INDEX `tour_requests_status_idx` ON `tour_requests` (`status`,`created_at`);