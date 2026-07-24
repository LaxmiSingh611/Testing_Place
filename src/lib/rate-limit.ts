/**
 * In-memory sliding-window rate limiter. Fine for a single-process local dev
 * server; if this app moves to a multi-instance deployment, swap the Map below
 * for a Redis-backed counter (e.g. Memurai/ElastiCache) behind the same
 * `check()` signature.
 */
const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  hits.set(key, timestamps);

  const allowed = timestamps.length <= limit;
  return { allowed, remaining: Math.max(0, limit - timestamps.length) };
}
