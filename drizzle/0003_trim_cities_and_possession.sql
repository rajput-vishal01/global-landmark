-- The client dropped two cities and four possession statuses from every
-- filter and form (Sep 2026). The admin form validates a saved value against
-- the current list and drops anything unknown, so a listing still holding a
-- removed value would lose it the next time anyone pressed Save. Remap those
-- rows to the nearest value that still exists instead.
--
-- Cities: Panchkula Extension folds into Panchkula. Mullanpur becomes New
-- Chandigarh with Mullanpur as the locality, which is how the location list
-- already describes it. Properties, projects and areas all carry a city.
--
-- Possession: Soft Launch reads as New Launch; the 6-month and 1-year bands
-- are still under construction; Other carried no information, so it clears.
--
-- Every statement is guarded on the old value, so re-running changes nothing.
update properties set city = 'Panchkula' where city = 'Panchkula Extension';
--> statement-breakpoint
update properties set city = 'New Chandigarh', locality = coalesce(locality, 'Mullanpur') where city = 'Mullanpur';
--> statement-breakpoint
update projects set city = 'Panchkula' where city = 'Panchkula Extension';
--> statement-breakpoint
update projects set city = 'New Chandigarh', locality = coalesce(locality, 'Mullanpur') where city = 'Mullanpur';
--> statement-breakpoint
update areas set city = 'Panchkula' where city = 'Panchkula Extension';
--> statement-breakpoint
update areas set city = 'New Chandigarh' where city = 'Mullanpur';
--> statement-breakpoint
update properties set possession_status = 'New Launch' where possession_status = 'Soft Launch';
--> statement-breakpoint
update properties set possession_status = 'Under Construction' where possession_status in ('Possession in 6 Months', 'Possession in 1 Year');
--> statement-breakpoint
update properties set possession_status = null where possession_status = 'Other';
--> statement-breakpoint
update projects set possession_status = 'New Launch' where possession_status = 'Soft Launch';
--> statement-breakpoint
update projects set possession_status = 'Under Construction' where possession_status in ('Possession in 6 Months', 'Possession in 1 Year');
--> statement-breakpoint
update projects set possession_status = null where possession_status = 'Other';
