import { z } from "zod";

export const ServiceInputSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	short_description: z.string().optional().nullable(),
	category: z.string().min(1, "Category is required"),
	icon: z.string().min(1, "Icon name is required"),
	image_url: z.string().optional().nullable(),
	price_small: z.number().min(0),
	price_medium: z.number().min(0),
	price_large: z.number().min(0),
	price_suv: z.number().min(0),
	duration_hours: z.number().min(0.5, "Duration must be at least 30 mins"),
	active: z.boolean(),
	sort_order: z.number().int(),
});

export type ServiceInput = z.infer<typeof ServiceInputSchema>;

export const ToggleServiceActiveSchema = z.object({
	id: z.string().uuid(),
	active: z.boolean(),
});

export type ToggleServiceActiveInput = z.infer<typeof ToggleServiceActiveSchema>;
