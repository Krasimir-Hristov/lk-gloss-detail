import { unstable_cache } from "next/cache";

import { createServiceClient } from "@/lib/supabase/service";

export interface PublicService {
	id: string;
	name: Record<string, string> | string;
	short_description: Record<string, string> | string | null;
	icon: string;
	image_url: string | null;
	category: string;
	price_small: number;
	price_medium: number;
	price_large: number;
	price_suv: number;
	duration_hours: number;
}

export const getPublicServices = unstable_cache(
	async (): Promise<PublicService[]> => {
		try {
			const supabase = createServiceClient();

			const { data, error } = await supabase
				.from("services")
				.select("*")
				.eq("active", true)
				.order("sort_order", { ascending: true });

			if (error) {
				console.error("[getPublicServices] DB error:", error.message);
				return [];
			}

			return data as PublicService[];
		} catch (err) {
			console.error("[getPublicServices] Uncaught error:", err);
			return [];
		}
	},
	["public-services-list"],
	{ revalidate: 3600, tags: ["services"] },
);
