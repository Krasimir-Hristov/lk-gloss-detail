import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const GET = async () => {
	try {
		const supabase = await createClient();
		const today = new Date().toISOString().slice(0, 10);

		const [{ data: appointments }, { data: blockedDates }] = await Promise.all([
			supabase.from("appointments").select("booking_date").gte("booking_date", today),
			supabase.from("blocked_dates").select("blocked_date").gte("blocked_date", today),
		]);

		const appointmentDates = (appointments ?? []).map((a) => a.booking_date as string);
		const blocked = (blockedDates ?? []).map((b) => b.blocked_date as string);

		const unavailableDates = Array.from(new Set([...appointmentDates, ...blocked]));

		return NextResponse.json(unavailableDates);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Internal Server Error";
		console.error("[booking/unavailable-dates] Error:", message);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
};
