# Demo data seed

`scripts/seed-demo.mjs` adds demo projects, listings and Deal of the Week entries
so the site does not look empty. It only ever **adds** rows, and everything it
adds can be removed again with `--remove`.

What it seeds, from the three manifests in this folder:

| File | Rows |
|---|---|
| `projects.json` | Invented projects in real Tricity localities |
| `listings.json` | Published listings, most filed under those projects, each with 3–20 photos |
| `deals.json` | Deal of the Week windows, relative to the day the seed runs |

What it never seeds: prices (every listing shows "Price on request"), RERA
numbers or registration/approval flags, owners, documents, testimonials,
reviews, ratings, leads, clients or tours.

## Commands

```bash
npm run db:seed-demo                       # seed (skips anything already there)
npm run db:seed-demo -- --dry-run          # validate + print the plan; no writes, no downloads
npm run db:seed-demo -- --remove           # delete the demo rows and their photo files
npm run db:seed-demo -- --only=projects    # or listings, or deals
npm run db:seed-demo -- --dir=<folder>     # read the manifests from another folder
```

The script loads `.env` itself. It needs `DATABASE_URL`, and it stores photos
where the app reads them: `UPLOAD_DIR`, or `./uploads` when that is unset.
Run it from the app root.

**After seeding, refresh the site's cache:** public pages are cached, and a
script writing to the database does not clear that cache. Open any demo
listing in the admin, press Save once without changing anything, and the site
refreshes. (Not Settings → Save: that copies the code defaults into the
database overrides.)

## How demo rows are recognised

- **Listings:** `addedBy = "Dealer"` and `sourceName = "Demo data"`, shown in
  the admin as "Listing comes from: Dealer · Demo data". Dealer rather than
  Global Landmark because the admin form clears the source name whenever
  "Global Landmark" is selected, so the first admin save would erase the
  marker and `--remove` would no longer find the listing.
- **Projects:** by the slug and name in `projects.json`.
- **Deals:** any deal on a demo listing.

`--remove` deletes only listings whose slug is in `listings.json` **and** whose
source name is still "Demo data" (with their photos, media links and deals), a
project only when no other listing still points at it, and then every stored
photo file that no row references any more. Both keys, because either alone
could match the office's own data: a real listing can share a demo title, and
a real dealer could be entered with any name. A demo listing an admin has
retitled (which changes its slug) or re-sourced is treated as the office's own
and kept.

## Photos and licences

Photos are downloaded when the script runs, so the repository stays small.
Each is checked (JPEG, PNG, WebP or AVIF by its bytes, at most 20 MB), never
re-encoded, and stored exactly like an admin upload:
`uploads/public/<first two hex>/<sha256>.<ext>`, served at
`/api/images/<sha256>.<ext>`. A photo that fails to download is skipped with a
warning; a listing left with fewer than 3 photos is skipped.

Only Unsplash (`images.unsplash.com`, `unsplash.com`) and Pexels
(`images.pexels.com`) are accepted. Both licences allow free commercial use
without attribution; the manifests still record the source page, author and
licence of every photo. Unsplash+ (`plus.unsplash.com`) is a paid licence and
is refused.

## Manifest format

Each file is a JSON array. Field names are the admin forms' own.

**projects.json** — `slug` (must equal the slug the admin would make from the
name), `name`, `builderName`, `description`, `possessionStatus`, `launchDate`,
`possessionDate`, `totalTowers`, `totalUnits`, `numberOfFloors`,
`greenAreaValue`, `greenAreaUnit`, `amenities`, `address` (must name a city),
`mapsUrl`, `legalFlags`, `loanFlags`, `banksOnPanel`, and `coverImage`
(`null` or a photo object).

**listings.json** — `slug` (must equal the slug the admin would make from the
title), `title`, `kind` (`unit` | `project`), `projectName` (`""` or a name
from projects.json), `description`, `location` (the address; must name a city,
locality level only), `mapsUrl`, `propertyType` (one of the five admin types or
`null`; a Residential Plot needs `plotArea`), `plotArea` / `builtUpArea` /
`superArea` / `carpetArea` with their `…Unit`, `frontFeet`, `depthFeet`,
`plcAttributes`, `furnishing`, `furnishingInventory`, `amenities`,
`parkingTypes`, `parkingSlots`, `legalFlags`, `loanFlags`, `banksOnPanel`,
`extras` (`[{ title, description }]`), `media` (`[{ kind, url, label }]`) and
`images`.

A **photo object** is `{ url, alt, source, author, licence }`: `url` is the
image file, `source` the photo's page.

**deals.json** — `[{ listing, startsInDays, days }]`: the listing's slug, the
first day counted from the day of the run (0 = today, in IST), and the length
in days. A deal never overlaps another one: a window that would is moved to
the first free days after it (the home page shows the earliest deal covering
today, so an overlap would hide one). A listing that already has a deal gets
no second one, so re-running adds nothing.

Anything outside the admin's own lists (a property type, an area unit, a
checklist value) fails the run and names the slug and the field. The checks
live in `manifest.mjs`, which carries copies of the admin's lists because the
server runs this with plain Node; wherever Node can read TypeScript (any dev
machine here) it compares those copies with `lib/` and refuses to run if they
have drifted.
