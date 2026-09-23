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

/** `n` consecutive weeks from the Monday of `iso`. */
export function weeksFrom(iso: string, count: number): { startsAt: string; endsAt: string }[] {
  const first = mondayOf(iso);
  return Array.from({ length: count }, (_, i) => weekOf(addDays(first, i * 7)));
}

/** "Mon 5 Oct — Sun 11 Oct 2026", for confirming the week before saving it. */
export function weekLabel(iso: string): string {
  const { startsAt, endsAt } = weekOf(iso);
  const day = (value: string) =>
    new Date(toUtc(value)).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${day(startsAt)} — ${day(endsAt)} ${endsAt.slice(0, 4)}`;
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
