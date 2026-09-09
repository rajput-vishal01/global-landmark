-- Drop the stale address and email out of the saved contact override.
--
-- site_settings.company_contact overrides lib/data.ts at runtime, per field,
-- through resolveCompany(). The row seeded before the client supplied their
-- Udyam certificate still held the placeholder email
-- ("inquiries@globallandmark.com") and the non-address "Based in Panchkula /
-- Tricity, India" — so the footer and contact page kept publishing those no
-- matter what the code said, and the deploy that corrected COMPANY would have
-- changed nothing visible.
--
-- That is precisely the mismatch Meta's business verification rejects on: a
-- website whose address cannot be matched against the submitted certificate.
--
-- Removing the two keys rather than rewriting them, so the code becomes the
-- single source again and there is nothing left to drift. resolveCompany()
-- already falls back per field:
--   addressLines: override.addressLines?.length ? ... : COMPANY.addressLines
--   email:        override.email ?? COMPANY.email
--
-- Guarded on the exact placeholder values, so it is idempotent and cannot
-- touch a real address someone has since entered through Admin -> Settings.
update site_settings
set `value` = json_remove(`value`, '$.addressLines', '$.email')
where `key` = 'company_contact'
  and json_unquote(json_extract(`value`, '$.email')) = 'inquiries@globallandmark.com';
