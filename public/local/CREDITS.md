# Local photography — sources and permission status

Every image here is a real Tricity development, self-hosted rather than
hotlinked, and every one is **a developer's own marketing photography**.
They are used because Global Landmark brokers flats in these projects.

| File | Where it appears | Project / source |
|---|---|---|
| `tricity-courtyard-night.jpg` | Hero — Sale | Green Lotus (greenlotusgroup.co) |
| `tricity-avenue.jpg` | Hero — Purchase | Trishla City (trishlacity.com) |
| `tricity-lounge.jpg` | Hero — Lease | Green Lotus (greenlotusgroup.co) |
| `tricity-pool.jpg` | Hero — Invest | Green Lotus (greenlotusgroup.co) |
| `tricity-clubhouse.jpg` | About — split image | Green Lotus (greenlotusgroup.co) |
| `tricity-theatre.jpg` | Listing gallery (seed) | Green Lotus (greenlotusgroup.co) |
| `tricity-towers-night.jpg` | About — ethos band | Green Lotus (greenlotusgroup.co) |

## Before this goes to production

Brokering a project is not by itself a licence to republish the developer's
photography. What normally makes it fine is the **channel-partner marketing
kit** builders issue to their authorised brokers. Confirm one of:

1. Global Landmark holds the marketing kit for Green Lotus and Trishla
   that includes these images, or
2. Each developer has given written permission (an email is enough), or
3. Replace them with Global Landmark's own photographs of the projects.

Every file is referenced from `lib/data.ts` by path only, so swapping one is
a single-line change — drop a new JPEG in under the same filename and
nothing else moves.

## Selection rules applied

- **No developer branding.** Anything showing a builder's name or logo was
  rejected or cropped: several Trishla shots carry a red "TRISHLA CITY"
  entrance gate, and a Green Lotus facade shot carried the project name.
  A competitor's name has no place on Global Landmark's masthead.
- **Buildings, not land.** Field and open-ground shots were dropped at the
  client's instruction — this is a luxury brokerage, so the imagery is
  towers, courtyards, clubhouses and interiors.
- **No marketing furniture.** "Ranked No. 1" badges, celebrity endorsements
  and icon graphics were all rejected.

## Adding more

The admin panel takes image uploads directly (Properties → a listing →
Photos), so the client's own site photography can go in without a code
change — that is the route that removes the permission question entirely.
