-- IF NOT EXISTS for the same reason 0000_baseline.sql carries its guards:
-- the column may already have been added by hand on an environment that ran
-- ahead of this file, and a migration that cannot be re-run is a migration
-- that blocks a deploy.
ALTER TABLE "text_testimonials" ADD COLUMN IF NOT EXISTS "avatar_url" text;