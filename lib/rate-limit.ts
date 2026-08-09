/**
 * A fixed-memory sliding-window counter.
 *
 * This is an accident-stopper, not a security control. It lives in the process,
 * so every serverless cold start resets it and every instance counts
 * separately. It stops a stuck retry loop and a naive script; it does not stop
 * a determined attacker, and nothing downstream should assume otherwise.
 */

export type RateLimiter = {
	/** True when the caller is within budget. Records the hit either way. */
	check: (key: string, now: number) => boolean;
};

export type RateLimiterOptions = {
	limit: number;
	windowMs: number;
	/**
	 * Hard cap on tracked keys, so a flood of unique keys cannot grow the map
	 * without bound. The oldest key is evicted when the cap is reached.
	 */
	maxKeys?: number;
};

const DEFAULT_MAX_KEYS = 5000;

export function createRateLimiter({
	limit,
	windowMs,
	maxKeys = DEFAULT_MAX_KEYS,
}: RateLimiterOptions): RateLimiter {
	// Insertion-ordered, so the first key is always the least recently created.
	const hits = new Map<string, Array<number>>();

	return {
		check(key: string, now: number): boolean {
			const cutoff = now - windowMs;
			const recent = (hits.get(key) ?? []).filter(
				(timestamp) => timestamp > cutoff,
			);

			if (recent.length >= limit) {
				hits.set(key, recent);
				return false;
			}

			recent.push(now);
			// Re-insert so this key moves to the back of the eviction order.
			hits.delete(key);
			hits.set(key, recent);

			if (hits.size > maxKeys) {
				const oldest = hits.keys().next();
				if (!oldest.done) {
					hits.delete(oldest.value);
				}
			}
			return true;
		},
	};
}
