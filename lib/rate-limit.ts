// ponytail: in-memory throttle (per server instance) — move to a shared
// store if the site ever scales horizontally.
//
// Two layers per scope: a per-key cap (normally the client IP) and a global
// cap. The client IP comes from x-forwarded-for, which a direct client can
// spoof for a fresh bucket — the global cap is the backstop that spoofing
// cannot escape.

const WINDOW_MS = 60 * 60 * 1000;
const logs = new Map<string, number[]>();

function hit(bucket: string, max: number): boolean {
  const now = Date.now();
  const recent = (logs.get(bucket) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) return true;
  recent.push(now);
  logs.set(bucket, recent);
  if (logs.size > 10_000) {
    // Memory backstop: evict per-key buckets only — the :g buckets are the
    // spoofing backstop and must survive (an attacker fabricating keys must
    // not be able to reset the global caps).
    for (const k of logs.keys()) {
      if (!k.endsWith(":g")) logs.delete(k);
      if (logs.size <= 5_000) break;
    }
  }
  return false;
}

/**
 * True when this key (or the scope as a whole) is over its hourly budget.
 * Per-key is checked first so requests already rejected there don't consume
 * the global budget — otherwise one hammering IP could exhaust the global
 * cap and lock the endpoint for everyone.
 */
export function isRateLimited(
  scope: string,
  key: string,
  perKeyMax: number,
  globalMax: number
): boolean {
  if (hit(`${scope}:${key}`, perKeyMax)) return true;
  return hit(`${scope}:g`, globalMax);
}

/** Best-effort client key for rate limiting; spoofable — pair with globalMax. */
export function clientIp(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
