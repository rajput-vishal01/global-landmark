-- Drop the seeded socials list out of the saved contact override.
--
-- Same trap as 0001, one field over. resolveCompany() takes the override's
-- socials whole whenever it is non-empty:
--
--   socials: override.socials?.length ? override.socials : COMPANY.socials
--
-- The seeded row lists Instagram and nothing else, so adding the client's
-- Facebook Page to COMPANY.socials in lib/data.ts would have rendered
-- nowhere — not in the footer, not in the menu, and not in the Organization
-- JSON-LD's sameAs. That last one matters: sameAs is a signal tying the
-- website to the Facebook Page, which is exactly what the Meta application
-- needs to line up.
--
-- Removing the key rather than rewriting it, so the code is the single source
-- and a Page added later needs one edit, not two. resolveCompany() falls back
-- to COMPANY.socials on its own.
--
-- Guarded on the exact seeded value — an Instagram-only list — so it is
-- idempotent and cannot discard a socials list someone has curated through
-- Admin -> Settings.
update site_settings
set `value` = json_remove(`value`, '$.socials')
where `key` = 'company_contact'
  and json_length(json_extract(`value`, '$.socials')) = 1
  and json_unquote(json_extract(`value`, '$.socials[0].label')) = 'Instagram';
