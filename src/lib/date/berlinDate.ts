const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const berlinDateFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Europe/Berlin",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/**
 * Returns today's calendar date (YYYY-MM-DD) in Europe/Berlin business timezone.
 */
export const getBerlinTodayIso = (date: Date = new Date()): string => {
	return berlinDateFormatter.format(date);
};

/**
 * Adds a signed integer number of calendar days to a YYYY-MM-DD date string
 * using pure UTC calendar arithmetic (immune to DST and local server offsets).
 */
export const addDaysBerlinIso = (baseIso: string, days: number): string => {
	if (!ISO_DATE_REGEX.test(baseIso)) {
		throw new Error(`Invalid ISO date string: "${baseIso}". Expected YYYY-MM-DD.`);
	}
	if (!Number.isInteger(days)) {
		throw new Error(`Invalid day offset: ${days}. Expected an integer.`);
	}

	const [yearStr, monthStr, dayStr] = baseIso.split("-");
	const year = Number(yearStr);
	const month = Number(monthStr);
	const day = Number(dayStr);

	const utcDate = new Date(Date.UTC(year, month - 1, day));
	if (
		utcDate.getUTCFullYear() !== year ||
		utcDate.getUTCMonth() !== month - 1 ||
		utcDate.getUTCDate() !== day
	) {
		throw new Error(`Invalid calendar date: "${baseIso}".`);
	}

	utcDate.setUTCDate(utcDate.getUTCDate() + days);
	return utcDate.toISOString().slice(0, 10);
};
