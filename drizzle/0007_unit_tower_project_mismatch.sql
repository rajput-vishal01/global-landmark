-- A unit's tower must belong to the unit's own project. The bootstrap seed
-- filed the Imperial Residency unit under Homeland Urva Luxury's "Tower A"
-- (fixed in scripts/seed.mjs, Sep 2026), so the unit showed under the wrong
-- project and Imperial Residency's page listed none. The admin form no longer
-- edits towers, so this can't be corrected there. Clear every tower link that
-- points across projects; the unit then lists under its own project, among
-- the units without a tower.
update properties p
  join towers t on t.id = p.tower_id
   set p.tower_id = null
 where p.project_id is null
    or t.project_id <> p.project_id;
