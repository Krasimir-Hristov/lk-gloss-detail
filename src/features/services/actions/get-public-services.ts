import { unstable_cache } from "next/cache";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";

export const PublicServiceSchema = z.object({
	id: z.string(),
	name: z.union([z.record(z.string(), z.string()), z.string()]),
	short_description: z.union([z.record(z.string(), z.string()), z.string()]).nullable(),
	icon: z.string(),
	image_url: z.string().nullable(),
	category: z.string(),
	price_small: z.number(),
	price_medium: z.number(),
	price_large: z.number(),
	price_suv: z.number(),
	duration_hours: z.number(),
});

export type PublicService = z.infer<typeof PublicServiceSchema>;

export const getPublicServices = unstable_cache(
	async (): Promise<PublicService[]> => {
		const supabase = createServiceClient();

		const { data, error } = await supabase
			.from("services")
			.select(
				"id, name, short_description, icon, image_url, category, price_small, price_medium, price_large, price_suv, duration_hours",
			)
			.eq("active", true)
			.order("sort_order", { ascending: true });

		if (error) {
			console.error("[getPublicServices] DB error:", error.message);
			throw new Error(`Failed to fetch public services: ${error.message}`);
		}

		const parsed = PublicServiceSchema.array().safeParse(data);
		if (!parsed.success) {
			console.error("[getPublicServices] Zod schema validation error:", parsed.error.format());
			throw new Error("Invalid service schema returned from database");
		}

		return parsed.data;
	},
	["public-services-list"],
	{ revalidate: 3600, tags: ["services"] },
);
