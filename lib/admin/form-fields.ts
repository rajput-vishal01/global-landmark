/**
 * FormData readers for the admin server actions.
 *
 * These are the trust boundary. Every admin form posts a FormData whose
 * every value is a string the browser will happily let anyone change, so
 * each field is trimmed, length-capped and range-checked on the way in
 * rather than trusted because the form had a `maxlength`.
 *
 * They lived as private copies in six action files under four different
 * names — `textField`, `str`, `int`, `money` — which is exactly how a
 * validation rule ends up fixed in five places and missed in the sixth.
 * One definition each now.
 */

/**
 * Trimmed, capped, and empty-as-null.
 *
 * Null rather than "" on purpose: an empty form field means "no value",
 * and storing "" instead would make a cleared field read back as a
 * present-but-blank one — different in a NOT NULL check, in a `??`
 * fallback, and on the page.
 */
export function textField(formData: FormData, key: string, max: number): string | null {
  return String(formData.get(key) ?? "").trim().slice(0, max) || null;
}

/**
 * Non-negative whole number within `max`, or null.
 *
 * Anything that is not a clean integer in range — "12.5", "-3", "abc",
 * 1e9 in a field capped at 100k — becomes null rather than a coerced
 * number. These land in counts, floors and rupee amounts, where a
 * silently coerced value is worse than a blank one.
 */
export function intField(
  formData: FormData,
  key: string,
  max = 100_000
): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
}

/** Whole rupees. Same rules as intField, with a cap that fits a deal value. */
export function moneyField(
  formData: FormData,
  key: string,
  max = 1_000_000_000
): number | null {
  return intField(formData, key, max);
}
