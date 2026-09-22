import { POSSESSION_STATUSES } from "./taxonomy/property";

/**
 * Title, description and photo alt text for the listing and project pages,
 * built from the record's own facts: type, BHK, society, locality, city.
 *
 * Never a price. Almost every listing is "Price on request", and a figure in
 * a search snippet cannot be taken back once it has been crawled.
 *
 * The root layout appends " | Global Landmark" (18 characters), which leaves
 * 42 for the page's own part before the whole title passes 60 and search
 * results start cutting it.
 */
export const TITLE_MAX = 42;
export const DESCRIPTION_MAX = 160;

type Text = string | null | undefined;

/** Whitespace collapsed. Anything over `max` is cut at the last word boundary and ends in "…", never mid-word. */
export function clipText(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const head = flat.slice(0, max - 1);
  const space = head.lastIndexOf(" ");
  return `${(space > 0 ? head.slice(0, space) : head).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** The first candidate that fits `max`. If none fits, the last one, clipped. */
export function fitText(candidates: (Text | false)[], max: number): string {
  const list = candidates
    .filter((c): c is string => typeof c === "string" && c.trim() !== "")
    .map((c) => c.replace(/\s+/g, " ").trim());
  return list.find((c) => c.length <= max) ?? clipText(list.at(-1) ?? "", max);
}

/** The admin form takes "20" as readily as "Sector 20". A bare number is a sector. */
function sectorLabel(sector: Text): string | null {
  const s = sector?.trim();
  if (!s) return null;
  return /^\d+[a-z]?$/i.test(s) ? `Sector ${s}` : s;
}

/**
 * The locality, else the sector. "Sector Area" and "MC Area" are real values
 * in lib/locations.ts, but they say which authority planned the area, not
 * where it is, so they are not a place name to put in a title.
 */
function nearLabel(locality: Text, sector: Text): string | null {
  const named = locality?.trim() && !/^(sector|mc) area$/i.test(locality.trim()) ? locality.trim() : null;
  return named || sectorLabel(sector);
}

/** The place names given, in order, each once, leaving out any that `said` already contains. */
export function placeLine(parts: Text[], said = ""): string {
  const known = said.toLowerCase();
  const seen = new Set<string>();
  return parts
    .map((p) => p?.trim() ?? "")
    .filter((p) => {
      const key = p.toLowerCase();
      if (!p || seen.has(key) || known.includes(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

const isPossession = (value: Text): value is string =>
  (POSSESSION_STATUSES as readonly string[]).includes(value ?? "");

/** What a listing page knows about itself. A PublicPropertyWithMedia fits as it is. */
export type ListingFacts = {
  title: string;
  kind: string;
  category: string;
  description: string;
  propertyType: Text;
  configuration: Text;
  society: Text;
  locality: Text;
  sector: Text;
  city: Text;
  /** The free-text address. Only its last part (the town) is used, when the city is empty: the rest can hold a house number. */
  location: Text;
  possessionStatus: Text;
  furnishing: Text;
  project: { name: string } | null;
};

/** The word people search for, where it differs from the admin form's label. */
const TYPE_WORD: Record<string, string> = {
  "Flat/Apartment": "Flat",
  "Independent House": "Kothi",
  "Residential Plot": "Plot",
};

const DEAL: Record<string, string> = { sale: " for Sale", lease: " for Rent" };

/**
 * "3 BHK Flat" or "500 Sq Yd Plot", made from the facts, with the society,
 * locality and city to go after it. A whole project, or a unit with no known
 * type, keeps the broker's own title, because the facts alone would not say
 * what it is.
 */
function listingParts(p: ListingFacts, area: Text) {
  const built = p.kind !== "project" && Boolean(p.propertyType);
  const noun = TYPE_WORD[p.propertyType ?? ""] ?? p.propertyType ?? "";
  const what = built
    ? [noun === "Plot" ? area : p.configuration, noun].filter(Boolean).join(" ")
    : p.title.trim();
  return {
    built,
    what,
    deal: built ? (DEAL[p.category] ?? "") : "",
    sep: built ? " in " : ", ",
    spot: p.project?.name || p.society,
    near: nearLabel(p.locality, p.sector),
    city: p.city || p.location?.split(",").at(-1),
  };
}

/**
 * "3 BHK Flat in Imperial Residency, Zirakpur": type and place, the place
 * narrowed until the title fits. A society name goes ahead of the locality,
 * because people search for societies by name, and the place goes ahead of
 * "for Sale", because it is what tells two similar listings apart.
 */
export function listingTitle(p: ListingFacts, area: Text): string {
  const { built, what, deal, sep, spot, near, city } = listingParts(p, area);
  const places = [
    ...new Set([
      spot ? placeLine([spot, city], what) : "",
      near ? placeLine([near, city], what) : "",
      placeLine([city], what),
    ]),
  ].filter(Boolean);
  // A long broker title still gets its place: its first phrase ("3 BHK
  // Builder Floor") and the city, before falling back to the title clipped.
  const lead = p.title.split(",")[0].trim();
  const leadCity = placeLine([city], lead);
  return fitText(
    [
      ...places.flatMap((place) => [`${what}${deal}${sep}${place}`, deal && `${what}${sep}${place}`]),
      `${what}${deal}`,
      what,
      !built && leadCity && `${lead} in ${leadCity}`,
      !built && lead,
    ],
    TITLE_MAX
  );
}

/** "3 BHK Flat in Imperial Residency, Peer Muchalla, Zirakpur": the long form, for sentences. */
function listingLine(p: ListingFacts, area: Text, withDeal: boolean): string {
  const { what, deal, sep, spot, near, city } = listingParts(p, area);
  const place = placeLine([spot, near, city], what);
  return `${what}${withDeal ? deal : ""}${place ? `${sep}${place}` : ""}`;
}

const VIEWINGS = "Viewings arranged personally by Global Landmark.";

/**
 * The broker's own description when it says enough on its own (120
 * characters or more). A shorter one is topped up with a line of facts, so
 * the snippet names the type, the place and the size.
 */
export function listingDescription(p: ListingFacts, area: Text): string {
  const body = p.description.replace(/\s+/g, " ").trim();
  if (body.length >= 120) return clipText(body, DESCRIPTION_MAX);
  const line = listingLine(p, area, true);
  const facts = [
    area && !line.includes(area) ? area : null,
    isPossession(p.possessionStatus) ? p.possessionStatus : null,
    p.furnishing,
  ]
    .filter(Boolean)
    .join(", ");
  const lead = `${line}${facts ? `: ${facts}` : ""}.`;
  return fitText(
    [`${body} ${lead} ${VIEWINGS}`, `${body} ${lead}`, `${body} ${line}.`, body, lead],
    DESCRIPTION_MAX
  );
}

/**
 * Alt text for one of a listing's photographs, when the broker gave none, or
 * gave the listing's title, which says nothing about the photograph and is
 * the same on every one of them.
 */
export function photoAlt(p: ListingFacts, area: Text, n: number, of: number): string {
  return `${listingLine(p, area, false)}, photo ${n} of ${of}`;
}

/** What a project page knows about itself. A PublicProjectDetail fits as it is. */
export type ProjectFacts = {
  name: string;
  description: string | null;
  builderName: Text;
  locality: Text;
  sector: Text;
  city: Text;
  possessionStatus: Text;
};

/** "Imperial Residency, Peer Muchalla, Zirakpur", narrowed to the city if that is too long. */
export function projectTitle(p: ProjectFacts): string {
  const full = placeLine([nearLabel(p.locality, p.sector), p.city], p.name);
  const city = placeLine([p.city], p.name);
  return fitText([full && `${p.name}, ${full}`, city && `${p.name}, ${city}`, p.name], TITLE_MAX);
}

/** The project's own description, topped up with builder, place and possession when it is short. */
export function projectDescription(p: ProjectFacts): string {
  const body = (p.description ?? "").replace(/\s+/g, " ").trim();
  if (body.length >= 120) return clipText(body, DESCRIPTION_MAX);
  const place = placeLine([nearLabel(p.locality, p.sector), p.city], p.name);
  const where = `${place ? ` in ${place}` : ""}${
    isPossession(p.possessionStatus) ? `, ${p.possessionStatus.toLowerCase()}` : ""
  }.`;
  // "Trishla is a residential project by Trishla" says nothing twice.
  const by =
    p.builderName && !p.name.toLowerCase().includes(p.builderName.toLowerCase())
      ? ` by ${p.builderName}`
      : "";
  const lead = `${p.name} is a residential project${by}${where}`;
  const shortLead = `${p.name} is a residential project${where}`;
  const visits = "Unit availability and site visits through Global Landmark.";
  return fitText(
    [`${body} ${lead} ${visits}`, `${body} ${lead}`, `${body} ${shortLead}`, body, lead],
    DESCRIPTION_MAX
  );
}
