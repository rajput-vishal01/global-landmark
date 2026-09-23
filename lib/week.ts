/**
 * Monday-to-Sunday week maths for the Deal of the Week.
 *
 * Plain `YYYY-MM-DD` strings throughout, as the `deals` table stores them.
 * Dates are built with `Date.UTC`, never the local constructor: the server
 * runs in one timezone, the broker's browser in another, and a local-midnight
 * Date turns "2026-10-05" into the 4th for half the world.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function isDate(value: string): boolean {
  return DATE_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function toUtc(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIso(toUtc(iso) + days * DAY_MS);
}

/** The Monday of the week containing this date. Sunday belongs to the week that just ended. */
export function mondayOf(iso: string): string {
  const date = new Date(toUtc(iso));
  const weekday = date.getUTCDay(); // 0 = Sunday
  return addDays(iso, weekday === 0 ? -6 : 1 - weekday);
}

/** The Monday-to-Sunday window that starts on this date's Monday. */
export function weekOf(iso: string): { startsAt: string; endsAt: string } {
  const startsAt = mondayOf(iso);
  return { startsAt, endsAt: addDays(startsAt, 6) };
}

/** Whole days covered by a window, counting both ends: Mon–Sun is 7. */
export function lengthInDays(startsAt: string, endsAt: string): number {
  return Math.round((toUtc(endsAt) - toUtc(startsAt)) / DAY_MS) + 1;
}

/**
 * `count` runs of the same length, back to back, the first being the window
 * given. A sale can start on any date — the repeat simply keeps its length,
 * so a Thursday-to-Wednesday deal repeats Thursday to Wednesday.
 */
export function repeatWindow(
  startsAt: string,
  endsAt: string,
  count: number
): { startsAt: string; endsAt: string }[] {
  const span = lengthInDays(startsAt, endsAt);
  return Array.from({ length: count }, (_, i) => ({
    startsAt: addDays(startsAt, i * span),
    endsAt: addDays(endsAt, i * span),
  }));
}

function dayLabel(iso: string): string {
  return new Date(toUtc(iso)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "Thu, 8 Oct — Wed, 14 Oct 2026", for confirming a run before saving it. */
export function rangeLabel(startsAt: string, endsAt: string): string {
  if (startsAt === endsAt) return `${dayLabel(startsAt)} ${endsAt.slice(0, 4)}`;
  return `${dayLabel(startsAt)} — ${dayLabel(endsAt)} ${endsAt.slice(0, 4)}`;
}

/** The same, for a Monday-to-Sunday week named by any day inside it. */
export function weekLabel(iso: string): string {
  const { startsAt, endsAt } = weekOf(iso);
  return rangeLabel(startsAt, endsAt);
}

/** True when two closed date ranges share a day. */
export function overlaps(
  a: { startsAt: string; endsAt: string },
  b: { startsAt: string; endsAt: string }
): boolean {
  return a.startsAt <= b.endsAt && b.startsAt <= a.endsAt;
}

/**
 * The first Monday from `today` whose week no existing window touches — what
 * the scheduler offers, so queueing next week is one click rather than a
 * calendar puzzle. Gives up after two years and returns that Monday anyway;
 * the action still refuses a clash, and an infinite search would be worse.
 */
export function nextFreeWeek(
  today: string,
  taken: { startsAt: string; endsAt: string }[]
): string {
  let monday = mondayOf(today);
  for (let i = 0; i < 104; i++) {
    const week = weekOf(monday);
    if (week.endsAt >= today && !taken.some((t) => overlaps(week, t))) return monday;
    monday = addDays(monday, 7);
  }
  return monday;
}
