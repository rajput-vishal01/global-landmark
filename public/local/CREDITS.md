# Local photography — sources and provenance

Every image in this folder is a real Tricity property, self-hosted rather
than hotlinked. Two groups, with different obligations.

## 1. Creative Commons (attribution required, credit shown at /credits)

| File | Subject | Author | Licence | Source |
|---|---|---|---|---|
| `zirakpur-skyline.jpg` | Zirakpur skyline at dusk | Botjagdeep567 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — public domain | [Commons](https://commons.wikimedia.org/wiki/File:Zirakpur_Skyline.jpg) |
| `zirakpur-fields-towers.jpg` | Land at the Zirakpur edge, towers behind | Manojkhurana | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) — **attribution required** | [Commons](https://commons.wikimedia.org/wiki/File:Zirakpur.jpg) |

Both were downscaled to 2400px. Under CC BY-SA the resized copy is a
derivative and keeps the same licence and credit, which is what `/credits`
and the footer link exist for.

## 2. Developer project photography — PERMISSION REQUIRED

| File | Subject | Source |
|---|---|---|
| `gl-towers-night.jpg` | Courtyard at night below the towers | greenlotusgroup.co |
| `gl-towers-day.jpg` | Towers above landscaped grounds, daytime | greenlotusgroup.co |
| `gl-aerial.jpg` | Aerial of the development and surrounding streets | greenlotusgroup.co |
| `gl-lounge.jpg` | Clubhouse lounge interior | greenlotusgroup.co |
| `gl-gym.jpg` | Gym interior (not currently placed on any page) | greenlotusgroup.co |

These are **Green Lotus's own marketing photographs**, used here because
Global Landmark brokers flats in that project. Brokering a project is not by
itself a licence to republish the developer's photography — the thing that
makes this safe is the channel-partner marketing kit builders issue to their
authorised brokers.

**Before this goes to production, confirm one of:**

1. Global Landmark holds the Green Lotus channel-partner/marketing kit that
   includes these images, or
2. Green Lotus has given written permission (an email is enough), or
3. Replace them with Global Landmark's own photographs of the project.

Each file is referenced from `lib/data.ts` by path only, so swapping any one
of them is a single-line change — drop a new JPEG in with the same filename
and nothing else needs to move.

## Filling the rest

Only one developer's project is represented here, because automated
collection from the other builder sites (homelandgroup.org,
homelandglobalpark.com, flatszirakpur.com, trishlacity.com) was blocked
during the build. The better source for those is the client anyway:
**the admin panel takes image uploads directly** (Properties → a listing →
Photos), so their own site photography of Homeland Urva, Trishla, Imperial
Residency and Grand Mega Township can go straight in without a code change.
