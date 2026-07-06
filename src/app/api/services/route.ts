import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const GET = async () => {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("services")
			.select("*")
			.eq("active", true)
			.order("sort_order", { ascending: true });

		if (error) {
			console.error("[services API] Error fetching services:", error.message);
			return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
		}

		return NextResponse.json(data);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Internal Server Error";
		console.error("[services API] Error:", message);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
};
