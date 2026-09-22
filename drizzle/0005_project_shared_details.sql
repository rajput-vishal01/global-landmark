-- Projects now carry the details every unit in them shares (Sep 2026), so
-- the property form can fill them in when a unit is filed under a project:
-- the address, a Google Maps link, and the legal and loan facts. Amenities
-- and the RERA number were already here.
alter table projects add column address text null;
--> statement-breakpoint
alter table projects add column maps_url text null;
--> statement-breakpoint
alter table projects add column legal_flags json null;
--> statement-breakpoint
alter table projects add column loan_flags json null;
--> statement-breakpoint
alter table projects add column banks_on_panel json null;
