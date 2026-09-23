-- A Deal of the Week is sometimes a property the office does not want in the
-- listings at all — a one-off sale, a unit offered only through the strip.
-- Until now a deal could only point at a published listing, which also put it
-- in /properties, so there was no way to run the deal without listing it.
--
-- `hide_from_listings` keeps the listing live (its own page opens, the deal
-- strip shows it) while leaving it out of the listings grid, the search, the
-- home page strips and the sitemap.
alter table properties
  add column hide_from_listings tinyint(1) not null default 0;
