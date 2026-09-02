-- Public "list your property" submissions (R-56).
--
-- A submission is not a new kind of record: it is an ordinary properties row
-- that arrives in `publication_state = 'draft'`, which isPubliclyVisible()
-- already hides. Approving one is publishing it; declining one is archiving
-- it. So the whole feature costs one nullable column.
--
-- `submitted_at` is null for every row an admin created, and set only by the
-- public form. That, not `added_by`, is what separates a submission from a
-- draft the office started itself — an admin entering an owner-sourced
-- listing by hand also sets added_by = 'Owner'.
--
-- IF NOT EXISTS for the same reason 0000_baseline.sql carries its guards: a
-- migration that cannot be re-run is a migration that blocks a deploy.
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp;

-- The review queue asks exactly one question — "what is waiting for me?" —
-- so it is a partial index over just those rows rather than the whole table.
CREATE INDEX IF NOT EXISTS "properties_submitted_idx"
  ON "properties" ("submitted_at" DESC)
  WHERE "submitted_at" IS NOT NULL;
