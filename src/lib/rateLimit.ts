type RateLimitEntry = { count: number; resetTime: number };

type RateLimiterConfig = {
	maxEntries?: number;
	cleanupIntervalMs?: number;
};

type RateLimitOptions = {
	interval: number; // ms
	maxRequests: number;
};

type RateLimitSuccess = { success: true; remaining: number };
type RateLimitFailure = { success: false; remaining: number; resetIn: number };
export type RateLimitResult = RateLimitSuccess | RateLimitFailure;

const DEFAULT_CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 5_000;

/**
 * Creates a bounded in-memory rate limiter that sweeps expired entries first
 * and fails closed without evicting live active counters if capacity stays full.
 * For multi-instance production scaling, replace with @upstash/ratelimit + Redis.
 */
export const createRateLimiter = (config: RateLimiterConfig = {}) => {
	const maxEntries = config.maxEntries ?? DEFAULT_MAX_ENTRIES;
	const cleanupIntervalMs = config.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS;
	const rateLimitMap = new Map<string, RateLimitEntry>();
	let lastCleanup = Date.now();

	const sweepExpiredEntries = (now: number, force = false): void => {
		if (!force && now - lastCleanup < cleanupIntervalMs && rateLimitMap.size < maxEntries) {
			return;
		}

		for (const [entryKey, entryValue] of rateLimitMap.entries()) {
			if (now > entryValue.resetTime) {
				rateLimitMap.delete(entryKey);
			}
		}
		lastCleanup = now;
	};

	const findEarliestResetTime = (fallbackResetTime: number): number => {
		let earliest = fallbackResetTime;
		for (const entryValue of rateLimitMap.values()) {
			if (entryValue.resetTime < earliest) {
				earliest = entryValue.resetTime;
			}
		}
		return earliest;
	};

	return (key: string, options: RateLimitOptions): RateLimitResult => {
		const now = Date.now();
		sweepExpiredEntries(now);

		const entry = rateLimitMap.get(key);

		if (!entry || now > entry.resetTime) {
			if (entry) rateLimitMap.delete(key);

			if (rateLimitMap.size >= maxEntries) {
				sweepExpiredEntries(now, true);
			}

			if (rateLimitMap.size >= maxEntries) {
				const earliestResetTime = findEarliestResetTime(now + options.interval);
				return {
					success: false,
					remaining: 0,
					resetIn: Math.max(1, earliestResetTime - now),
				};
			}

			rateLimitMap.set(key, { count: 1, resetTime: now + options.interval });
			return { success: true, remaining: options.maxRequests - 1 };
		}

		if (entry.count >= options.maxRequests) {
			return { success: false, remaining: 0, resetIn: Math.max(1, entry.resetTime - now) };
		}

		entry.count++;
		return { success: true, remaining: options.maxRequests - entry.count };
	};
};

export const rateLimit = createRateLimiter();

// Assessment-specific limits
export const ASSESSMENT_RATE_LIMIT = {
	validatePhoto: { interval: 60_000, maxRequests: 10 }, // 10/min
	analyze: { interval: 300_000, maxRequests: 3 }, // 3/5min
} as const;

// Chatbot-specific limits
export const CHATBOT_RATE_LIMIT = {
	message: { interval: 60_000, maxRequests: 15 }, // 15 requests per minute
} as const;
