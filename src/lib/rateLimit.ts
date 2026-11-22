const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const CLEANUP_INTERVAL_MS = 60_000;
const MAX_ENTRIES = 5_000;
let lastCleanup = Date.now();

const sweepExpiredEntries = (now: number): void => {
	if (now - lastCleanup < CLEANUP_INTERVAL_MS && rateLimitMap.size <= MAX_ENTRIES) {
		return;
	}

	for (const [entryKey, entryValue] of rateLimitMap.entries()) {
		if (now > entryValue.resetTime) {
			rateLimitMap.delete(entryKey);
		}
	}
	lastCleanup = now;
};

type RateLimitOptions = {
	interval: number; // ms
	maxRequests: number;
};

type RateLimitSuccess = { success: true; remaining: number };
type RateLimitFailure = { success: false; remaining: number; resetIn: number };

/**
 * Simple in-memory rate limiter with periodic expired-entry cleanup.
 * For production, replace with @upstash/ratelimit + Redis.
 */
export const rateLimit = (
	key: string,
	options: RateLimitOptions,
): RateLimitSuccess | RateLimitFailure => {
	const now = Date.now();
	sweepExpiredEntries(now);

	const entry = rateLimitMap.get(key);

	if (!entry || now > entry.resetTime) {
		if (entry) rateLimitMap.delete(key);
		if (rateLimitMap.size >= MAX_ENTRIES) {
			const oldestKey = rateLimitMap.keys().next().value;
			if (oldestKey !== undefined) {
				rateLimitMap.delete(oldestKey);
			}
		}
		rateLimitMap.set(key, { count: 1, resetTime: now + options.interval });
		return { success: true, remaining: options.maxRequests - 1 };
	}

	if (entry.count >= options.maxRequests) {
		return { success: false, remaining: 0, resetIn: entry.resetTime - now };
	}

	entry.count++;
	return { success: true, remaining: options.maxRequests - entry.count };
};

// Assessment-specific limits
export const ASSESSMENT_RATE_LIMIT = {
	validatePhoto: { interval: 60_000, maxRequests: 10 }, // 10/min
	analyze: { interval: 300_000, maxRequests: 3 }, // 3/5min
} as const;

// Chatbot-specific limits
export const CHATBOT_RATE_LIMIT = {
	message: { interval: 60_000, maxRequests: 15 }, // 15 requests per minute
} as const;
