const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

type RateLimitOptions = {
	interval: number; // ms
	maxRequests: number;
};

type RateLimitSuccess = { success: true; remaining: number };
type RateLimitFailure = { success: false; remaining: number; resetIn: number };

/**
 * Simple in-memory rate limiter.
 * For production, replace with @upstash/ratelimit + Redis.
 */
export const rateLimit = (
	key: string,
	options: RateLimitOptions,
): RateLimitSuccess | RateLimitFailure => {
	const now = Date.now();
	const entry = rateLimitMap.get(key);

	if (!entry || now > entry.resetTime) {
		// Clean up expired entry before setting new one
		if (entry) rateLimitMap.delete(key);
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
