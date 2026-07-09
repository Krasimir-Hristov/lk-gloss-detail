import { format } from "date-fns";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const GET = async () => {
	try {
		const supabase = await createClient();

		const [{ data: appointments }, { data: blockedDates }] = await Promise.all([
			supabase.from("appointments").select("booking_date"),
			supabase.from("blocked_dates").select("blocked_date"),
		]);

		const appointmentDates = (appointments ?? []).map((a) =>
			format(new Date(a.booking_date), "yyyy-MM-dd"),
		);
		const blocked = (blockedDates ?? []).map((b) => format(new Date(b.blocked_date), "yyyy-MM-dd"));

		const unavailableDates = Array.from(new Set([...appointmentDates, ...blocked]));

		return NextResponse.json(unavailableDates);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Internal Server Error";
		console.error("[booking/unavailable-dates] Error:", message);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
};
