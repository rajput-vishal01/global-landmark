-- The admin form now takes a Google Maps link instead of latitude and
-- longitude (Sep 2026). The link is shown publicly whenever it is set, so
-- there is no separate "show on map" switch any more.
--
-- Listings whose pin was already published keep a map: their coordinates
-- become a maps link, rounded to three decimals (~110 m) exactly as the old
-- public pin was, so nothing more precise is published than before. Pins
-- that were never published stay unpublished.
--
-- latitude, longitude and show_map_publicly are left in place, unread, so
-- no existing data is thrown away.
alter table properties add column maps_url text null;
--> statement-breakpoint
update properties
   set maps_url = concat('https://www.google.com/maps?q=', round(latitude, 3), ',', round(longitude, 3))
 where show_map_publicly = 1
   and latitude is not null and latitude <> ''
   and longitude is not null and longitude <> ''
   and maps_url is null;
