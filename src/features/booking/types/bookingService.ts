export type BookingService = {
	id: string;
	name: Record<string, string> | string;
	short_description: Record<string, string> | string | null;
	icon: string;
	image_url?: string | null;
	category?: string;
	price_small?: number;
	price_medium?: number;
	price_large?: number;
	price_suv?: number;
	duration_hours?: number;
	sort_order?: number;
};

export const fetchBookingServices = async (): Promise<BookingService[]> => {
	try {
		const res = await fetch("/api/services");
		if (!res.ok) {
			throw new Error("Failed to fetch services");
		}
		const data: unknown = await res.json();
		if (!Array.isArray(data)) {
			throw new Error("Invalid services response");
		}
		return data as BookingService[];
	} catch (error: unknown) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to fetch services");
	}
};
