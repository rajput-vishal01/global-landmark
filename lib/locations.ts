/**
 * Location taxonomy (R-08, CFF group 3): Country -> City -> Locality, with
 * the development-authority classification the client asked for.
 *
 * One vocabulary shared by the admin form and the public filter tabs, so
 * the two can never drift into "Zirakpur" vs "zirakpur" vs "Zirkapur".
 *
 * ponytail: a typed list, not a `locations` table. The client's list is
 * stable and short, and a table would mean CRUD screens nobody asked for.
 * CONFIRM whether they need to add localities themselves — if yes, this
 * promotes to a table and these values become its seed.
 */

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
        name: "Panchkula Extension",
        slug: "panchkula-extension",
        localities: [{ name: "Sector Area", authority: "HUDA" }],
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
      {
        name: "Mullanpur",
        slug: "mullanpur",
        localities: [{ name: "Sector Area", authority: "GMADA" }],
      },
    ],
  },
  { name: "Dubai", cities: [] },
  { name: "Australia", cities: [] },
];

/** Flat city list for the tab row and for validation. */
export const CITIES: City[] = COUNTRIES.flatMap((c) => c.cities);

export const CITY_NAMES = CITIES.map((c) => c.name);

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
