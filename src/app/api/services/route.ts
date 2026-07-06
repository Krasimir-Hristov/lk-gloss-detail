import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const ServiceResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	short_description: z.string().nullable(),
	icon: z.string(),
	image_url: z.string().nullable(),
	category: z.string(),
	price_small: z.number(),
	price_medium: z.number(),
	price_large: z.number(),
	price_suv: z.number(),
	duration_hours: z.number(),
	sort_order: z.number(),
});

export const GET = async () => {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("services")
			.select(
				"id, name, short_description, icon, image_url, category, price_small, price_medium, price_large, price_suv, duration_hours, sort_order",
			)
			.eq("active", true)
			.order("sort_order", { ascending: true });

		if (error) {
			console.error("[services API] Error fetching services:", error.message);
			return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
		}

		// Validate each row with Zod
		const validated = z.array(ServiceResponseSchema).safeParse(data ?? []);
		if (!validated.success) {
			console.error("[services API] Invalid response shape:", validated.error.issues);
			return NextResponse.json({ error: "Invalid service data" }, { status: 500 });
		}

		return NextResponse.json(validated.data);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Internal Server Error";
		console.error("[services API] Error:", message);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
};
