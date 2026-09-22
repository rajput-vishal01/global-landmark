-- The /sell form promises the seller's address is private, but it was saved
-- as the listing's own (public) address line (fixed Sep 2026). For every
-- submission still awaiting review, move that address onto the owner record
-- (internal) and give the listing a public line from sector, locality and
-- city instead. Approved submissions are left alone: an admin reviewed what
-- went live and may already have rewritten it.
update property_owners o
  join properties p on p.id = o.property_id
   set o.address = coalesce(o.address, p.location)
 where p.submitted_at is not null
   and p.publication_state = 'draft'
   and p.location <> '';
--> statement-breakpoint
update properties
   set location = concat_ws(', ', nullif(sector, ''), nullif(locality, ''), city)
 where submitted_at is not null
   and publication_state = 'draft';
