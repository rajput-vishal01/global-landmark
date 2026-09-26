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

/**
 * Whole rupees. Same rules as intField, with a cap that fits a deal value —
 * and commas and spaces ignored, because "1,50,00,000" is how a broker types
 * an amount, and Number() read it as NaN: the budget was silently dropped.
 */
export function moneyField(
  formData: FormData,
  key: string,
  max = 1_000_000_000
): number | null {
  const raw = String(formData.get(key) ?? "").replace(/[,\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
}

/**
 * A row id: a positive whole number, or null.
 *
 * Every action used to read ids as `Number(formData.get("id"))` and check
 * `Number.isInteger(id)`. A missing or empty field is `Number("") === 0`, and
 * 0 IS an integer — so the check passed, and the action went on to
 * `update … where id = 0`, matched nothing, and reported success on a save
 * that never happened. On inserts that reference a parent (a deal's
 * property, a payment's deal, a tower's project) the same 0 surfaced as a
 * foreign-key failure behind a generic "could not save".
 *
 * Returning null makes the missing case a type the caller cannot ignore.
 * scripts/check-forms.mjs fails the build on `Number(formData.get(...Id))`.
 */
export function idField(formData: FormData, key = "id"): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}
