/**
 * One insert per Create form, however many times it is submitted.
 *
 * The Add-property page issues a fresh key with every load and the form posts
 * it back. The server claims the key only once validation has passed, so:
 *
 *   - a double click, a retry, or a second tap while the first is still
 *     saving finds the key taken and does not insert again;
 *   - a submission rejected by validation never claims it, so the broker can
 *     fix the form and send it again;
 *   - a failed insert releases it for the same reason.
 *
 * This replaced a guard that refused any title matching a listing created in
 * the last two minutes. That guard matched autosave's own draft and genuinely
 * identical flats, which is how brokers saw "already exists" for a listing
 * they had just deleted.
 *
 * ponytail: in-process memory, exact for the single pm2 process this runs as.
 * If the app ever runs as several processes, move this to a unique
 * `submission_key` column so the database enforces it across all of them. A
 * restart forgets keys, which only matters for a double click that straddles
 * the restart.
 *
 * Checked by scripts/check-forms.mjs.
 */

const used = new Map<string, number>();
export const SUBMISSION_KEY_TTL_MS = 30 * 60 * 1000;

/**
 * True the first time a key is seen, false after. Synchronous on purpose:
 * with no await between the check and the set, two concurrent submits of the
 * same form cannot both pass.
 */
export function claimSubmission(key: string, now = Date.now()): boolean {
  for (const [k, at] of used) {
    if (now - at > SUBMISSION_KEY_TTL_MS) used.delete(k);
  }
  if (used.has(key)) return false;
  used.set(key, now);
  return true;
}

/** Frees a key whose submission created nothing, so the same form can retry. */
export function releaseSubmission(key: string): void {
  used.delete(key);
}
