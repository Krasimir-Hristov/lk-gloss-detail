export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface AppointmentServiceItem {
	id: string;
	name: Record<string, string> | string;
	price_small: number;
	price_medium: number;
	price_large: number;
	price_suv: number;
	duration_hours: number;
}

export interface AdminAppointment {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone: string;
	car_description: string | null;
	booking_date: string;
	status: AppointmentStatus;
	created_at: string;
	services: AppointmentServiceItem[];
}

export interface BlockedDateItem {
	id: string;
	blocked_date: string;
	reason: string | null;
	created_at: string;
}

export interface AppointmentFilters {
	status?: AppointmentStatus | "all";
	search?: string;
	startDate?: string;
	endDate?: string;
}
