import type { ReactNode } from "react";

/**
 * The icon set for the public amenities grid.
 *
 * Same construction as components/service-icons.tsx: a FIXED map keyed by
 * the amenity's own name, never stored markup and never a URL. Amenities
 * are free-add text (a broker can type anything), so an unrecognised name
 * falls back to a neutral mark rather than leaving a hole in the grid —
 * and nothing a broker types can ever reach the DOM as SVG.
 *
 * Drawn on the same 24-grid and hairline stroke as the service icons; this
 * repo ships no icon library on purpose.
 *
 * Keys mirror AMENITIES in lib/taxonomy/features.ts. Where two amenities
 * are the same idea to a buyer scanning a grid (Security / CCTV, the racquet
 * sports), they deliberately share a glyph rather than inventing a
 * distinction the drawing cannot carry at 28px.
 */

const svg = (children: ReactNode) => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

const water = svg(
  <>
    <path d="M2 16c2 0 2 1.5 4 1.5S8 16 10 16s2 1.5 4 1.5S16 16 18 16s2 1.5 4 1.5" />
    <path d="M2 20c2 0 2 1.5 4 1.5S8 20 10 20s2 1.5 4 1.5S16 20 18 20s2 1.5 4 1.5" />
    <path d="M7 14V5a2 2 0 0 1 4 0M15 14V5a2 2 0 0 1 4 0" />
  </>
);

const dumbbell = svg(
  <>
    <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />
  </>
);

const shield = svg(<path d="M12 2.5 20 6v6c0 4.5-3.2 7.8-8 9.5C7.2 19.8 4 16.5 4 12V6z" />);

const racquet = svg(
  <>
    <ellipse cx="9.5" cy="8.5" rx="5.5" ry="6.5" transform="rotate(-30 9.5 8.5)" />
    <path d="M13.5 13.5 20 21" />
  </>
);

const ball = svg(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v17M3.5 12h17" />
  </>
);

const building = svg(
  <>
    <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" />
    <path d="M3 21h18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
  </>
);

const tree = svg(
  <>
    <path d="M12 21v-5" />
    <path d="M12 3 6.5 11h3L5 16.5h14L14.5 11h3z" />
  </>
);

const bolt = svg(<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" />);

const wifi = svg(
  <>
    <path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.5 16a4 4 0 0 1 5 0" />
    <circle cx="12" cy="19.5" r="0.75" fill="currentColor" />
  </>
);

const car = svg(
  <>
    <path d="M3.5 16v-3l2-5A1.5 1.5 0 0 1 7 7h10a1.5 1.5 0 0 1 1.5 1l2 5v3" />
    <path d="M3.5 13h17" />
    <circle cx="7" cy="17" r="1.75" />
    <circle cx="17" cy="17" r="1.75" />
  </>
);

const screen = svg(
  <>
    <rect x="2.5" y="4.5" width="19" height="12" rx="1" />
    <path d="M8 20.5h8M12 16.5v4" />
  </>
);

const child = svg(
  <>
    <circle cx="12" cy="5.5" r="2.5" />
    <path d="M12 8v6M7 11h10M9 20l3-6 3 6" />
  </>
);

const paw = svg(
  <>
    <circle cx="6" cy="10" r="1.75" />
    <circle cx="10" cy="6.5" r="1.75" />
    <circle cx="14" cy="6.5" r="1.75" />
    <circle cx="18" cy="10" r="1.75" />
    <path d="M12 12c3.5 0 5.5 2.3 5.5 4.7S15.3 21 12 21s-5.5-1.9-5.5-4.3S8.5 12 12 12z" />
  </>
);

const phone = svg(
  <>
    <rect x="6.5" y="2.5" width="11" height="19" rx="1.5" />
    <path d="M10.5 5.5h3" />
  </>
);

const scissors = svg(
  <>
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M7.8 16.2 18 3.5M16.2 16.2 6 3.5" />
  </>
);

const steam = svg(
  <>
    <path d="M8 3c0 2-1.5 2.5-1.5 4.5S8 10 8 12M16 3c0 2-1.5 2.5-1.5 4.5S16 10 16 12" />
    <path d="M4 15.5h16a0 0 0 0 1 0 0c0 3.3-2.7 6-6 6h-4c-3.3 0-6-2.7-6-6z" />
  </>
);

const lift = svg(
  <>
    <rect x="4.5" y="2.5" width="15" height="19" rx="1" />
    <path d="M12 2.5v19M8 9l-1.5-2L5 9M16 15l1.5 2 1.5-2" />
  </>
);

const home = svg(
  <>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 12v9h13v-9" />
    <path d="M10 21v-5h4v5" />
  </>
);

const track = svg(
  <>
    <ellipse cx="12" cy="12" rx="9" ry="5.5" />
    <ellipse cx="12" cy="12" rx="5" ry="2.5" />
  </>
);

/** A quiet diamond — reads as "listed feature", claims nothing specific. */
export const AMENITY_ICON_FALLBACK = svg(<path d="M12 3.5 20.5 12 12 20.5 3.5 12z" />);

export const AMENITY_ICONS: Record<string, ReactNode> = {
  "Club House": building,
  "Swimming Pool": water,
  Gym: dumbbell,
  Lift: lift,
  "Power Backup": bolt,
  Security: shield,
  CCTV: screen,
  "Gated Community": shield,
  "Children's Play Area": child,
  Park: tree,
  "Jogging Track": track,
  "Sports Facilities": ball,
  "Community Hall": building,
  "EV Charging": bolt,
  "Smart Home": home,
  "Wi-Fi": wifi,
  "Visitor Parking": car,
  Theatre: screen,
  Sauna: steam,
  Steam: steam,
  "Pickleball Court": racquet,
  Tennis: racquet,
  Cricket: ball,
  Squash: racquet,
  Badminton: racquet,
  Basketball: ball,
  Salon: scissors,
  "Day Care (Kids)": child,
  "Pet Play Area": paw,
  Intercom: phone,
};

export function amenityIcon(name: string): ReactNode {
  return AMENITY_ICONS[name] ?? AMENITY_ICON_FALLBACK;
}
