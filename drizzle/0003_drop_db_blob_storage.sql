-- Image bytes move out of Postgres and onto the server's filesystem
-- ($UPLOAD_DIR), so this table has no reason to exist.
--
-- Safe to drop: file_blobs was added and removed within the same unreleased
-- branch and never reached production. Verified empty before generating this
-- migration. CASCADE only has to drop the table's own constraints — nothing
-- references it, because property_images stores a URL, not a foreign key.
DROP TABLE IF EXISTS "file_blobs" CASCADE;
