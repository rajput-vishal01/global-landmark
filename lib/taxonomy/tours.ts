/**
 * "Schedule a tour" vocabulary (Phase E).
 *
 * One list, shared by the public form and the admin inbox, for the same
 * reason the lead statuses are: the form must only offer values the server
 * will accept, and the inbox must only filter on values that can exist. Two
 * copies would drift the first time someone adds a tour type.
 *
 * A tour request is INTERNAL — name, phone and email of someone who asked
 * to visit a property. Nothing here is read by a public query; the public
 * side only ever writes.
 */

/** The reference portal offers exactly these two. */
export const TOUR_TYPES = ["In person", "Video call"] as const;

export type TourType = (typeof TOUR_TYPES)[number];

export const isTourType = (v: string): v is TourType =>
  (TOUR_TYPES as readonly string[]).includes(v);

/** Mirrors LEAD_STATUSES in shape so the two inboxes read the same way. */
export const TOUR_STATUSES = ["new", "scheduled", "completed", "cancelled"] as const;

export type TourStatus = (typeof TOUR_STATUSES)[number];



export const isTourStatus = (v: string): v is TourStatus =>
  (TOUR_STATUSES as readonly string[]).includes(v);

/**
 * Slot labels, not a free-text time box. A broker works a diary in blocks,
 * and "anytime after 4ish" is not something an inbox can sort.
 */
export const TOUR_TIMES = [
  "09:00 – 11:00",
  "11:00 – 13:00",
  "13:00 – 15:00",
  "15:00 – 17:00",
  "17:00 – 19:00",
] as const;

export const isTourTime = (v: string): boolean =>
  (TOUR_TIMES as readonly string[]).includes(v);
