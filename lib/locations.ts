/**
 * Location taxonomy (R-08, CFF group 3): Country -> City -> Locality, with
 * the development-authority classification the client asked for.
 *
 * One vocabulary shared by the admin form and the public filter tabs, so
 * the two can never drift into "Zirakpur" vs "zirakpur" vs "Zirkapur".
 *
 * ponytail: a typed list, not a `locations` table. The client's list is
 * stable and short, and a table would mean CRUD screens nobody asked for.
 * They did ask to add their own (Sep 2026): a locality typed on the property
 * form is stored as written (see `normaliseLocality`) and offered back on
 * every later listing in that city. This list is the seed, not the limit —
 * still no table, still no CRUD screen.
 */

import { normaliseCustomLabel } from "./taxonomy/label";

/** Which authority planned the area — a real buying consideration locally. */
export const AREA_AUTHORITIES = ["GMADA", "HUDA", "MC", "Other"] as const;

export type AreaAuthority = (typeof AREA_AUTHORITIES)[number];

export type Locality = { name: string; authority?: AreaAuthority };

export type City = { name: string; slug: string; localities: Locality[] };

export type Country = { name: string; cities: City[] };

/**
 * India is fully specified because it is the operating market. Dubai and
 * Australia are listed with no localities: the CFF names them as countries
 * the client deals in but supplied no areas, and an empty list is honest
 * where invented suburbs would not be.
 *
 * Localities are the client's own list from CFF group 3, kept in their
 * words. Corridor roads (PR-7, PR-8, PR-4, Airport Road) are localities
 * rather than cities — locally they are addresses, not municipalities.
 */
export const COUNTRIES: Country[] = [
  {
    name: "India",
    cities: [
      {
        name: "Chandigarh",
        slug: "chandigarh",
        localities: [
          { name: "Airport Road", authority: "MC" },
          { name: "IT City", authority: "GMADA" },
        ],
      },
      {
        name: "Panchkula",
        slug: "panchkula",
        localities: [
          { name: "Sector Area", authority: "HUDA" },
          { name: "MC Area", authority: "MC" },
        ],
      },
      {
        name: "Zirakpur",
        slug: "zirakpur",
        localities: [
          { name: "Peer Muchalla", authority: "MC" },
          { name: "PR-7 Road", authority: "GMADA" },
          { name: "Airport Road", authority: "MC" },
        ],
      },
      {
        name: "Mohali",
        slug: "mohali",
        localities: [
          { name: "Sector Area", authority: "GMADA" },
          { name: "Aerocity", authority: "GMADA" },
          { name: "IT City", authority: "GMADA" },
          { name: "Airport Road", authority: "GMADA" },
          { name: "PR-7 Road", authority: "GMADA" },
        ],
      },
      {
        name: "New Chandigarh",
        slug: "new-chandigarh",
        localities: [
          { name: "Mullanpur", authority: "GMADA" },
          { name: "PR-8", authority: "GMADA" },
        ],
      },
      {
        name: "Derabassi",
        slug: "derabassi",
        localities: [{ name: "MC Area", authority: "MC" }],
      },
      {
        name: "Kharar",
        slug: "kharar",
        localities: [
          { name: "PR-4", authority: "GMADA" },
          { name: "MC Area", authority: "MC" },
        ],
      },
      // Panchkula Extension and Mullanpur were dropped as cities by the
      // client (Sep 2026). Mullanpur stays as a locality of New Chandigarh.
    ],
  },
  { name: "Dubai", cities: [] },
  { name: "Australia", cities: [] },
];

/** Flat city list for the tab row and for validation. */
export const CITIES: City[] = COUNTRIES.flatMap((c) => c.cities);

export const CITY_NAMES = CITIES.map((c) => c.name);

/**
 * The micro-markets the location bento offers, in the order the client wants
 * them read. Shared by the landing page and the mid-grid break on
 * /properties so the two cannot drift apart. Aerocity is a locality of
 * Mohali rather than a city of its own, so its tile narrows on both.
 */
export const LANDING_LOCATIONS: { city: string; locality?: string }[] = [
  { city: "Chandigarh" },
  { city: "Panchkula" },
  { city: "Zirakpur" },
  { city: "Mohali" },
  { city: "Mohali", locality: "Aerocity" },
  { city: "New Chandigarh" },
];

export function isCity(name: string): boolean {
  return CITY_NAMES.includes(name);
}

/** Localities narrow with the selected city; unknown city yields none. */
export function localitiesIn(city: string | null | undefined): Locality[] {
  if (!city) return [];
  return CITIES.find((c) => c.name === city)?.localities ?? [];
}

export function isLocalityIn(city: string | null | undefined, locality: string): boolean {
  return localitiesIn(city).some((l) => l.name === locality);
}

/** Longest a typed-in locality may be — it has to fit a card's meta line. */
export const MAX_LOCALITY = 60;

/**
 * The stored locality for a submitted one: a known name for that city, a
 * clean typed-in one, or nothing.
 *
 * The list above is the client's own and was never complete — they sell in
 * colonies it does not name. Rather than promote localities to a table (the
 * CONFIRM at the top of this file), a typed-in name is stored as written and
 * offered back on every later listing in that city; the list stays the seed.
 */
export function normaliseLocality(
  city: string | null | undefined,
  raw: string | null | undefined
): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (isLocalityIn(city, value)) return value;
  return normaliseCustomLabel(value, MAX_LOCALITY);
}

/** Where `name` occurs in `text` as a whole word (case-insensitive), or -1. */
function wordIndex(text: string, name: string): number {
  const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(^|[^a-z0-9])${escaped}(?![a-z0-9])`).exec(text);
  return match ? match.index + match[1].length : -1;
}

/**
 * City and locality read out of a free-text address. The admin form asks
 * only for the address now, but the public city filter still runs on the
 * `city` column, so this fills it.
 *
 * Indian addresses run small to large ("Sector 20, Panchkula"), so when two
 * cities are named the one named LAST wins. "New Chandigarh" is blanked out
 * before looking for "Chandigarh", so it never counts as both. With no city
 * named, a locality that belongs to exactly one city ("Mullanpur", "Aerocity")
 * still gives the city away.
 *
 * ponytail: a word match against the known list, not geocoding. An address
 * naming no known city returns null and the listing keeps whatever city it
 * had; put the city name in the address to set it.
 */
export function placeFromAddress(
  address: string
): { city: string; locality: string | null } | null {
  let text = address.toLowerCase();
  let city: City | null = null;
  let cityAt = -1;
  // Longest name first, so "New Chandigarh" is taken before "Chandigarh".
  for (const c of [...CITIES].sort((a, b) => b.name.length - a.name.length)) {
    const at = wordIndex(text, c.name);
    if (at < 0) continue;
    if (at > cityAt) {
      city = c;
      cityAt = at;
    }
    text = text.slice(0, at) + " ".repeat(c.name.length) + text.slice(at + c.name.length);
  }

  if (!city) {
    const owners = CITIES.filter((c) =>
      c.localities.some((l) => wordIndex(text, l.name) >= 0)
    );
    if (owners.length !== 1) return null;
    city = owners[0];
  }
  const locality = city.localities.find((l) => wordIndex(text, l.name) >= 0);
  return { city: city.name, locality: locality?.name ?? null };
}
