"use server";

import { createClient } from "@/lib/supabase/server";

import type {
	AdminAppointment,
	AppointmentServiceItem,
} from "@/features/admin/types/appointments.types";

interface SupabaseServiceRecord {
	id: string;
	name: string | null;
	price_small: number | null;
	price_medium: number | null;
	price_large: number | null;
	price_suv: number | null;
	duration_hours: number | null;
}

interface SupabaseAppointmentServiceJoin {
	services: SupabaseServiceRecord | null;
}

export interface DashboardOverview {
	todaysAppointments: AdminAppointment[];
	upcomingAppointments: AdminAppointment[];
	metrics: {
		totalAppointments: number;
		monthlySubmissions: number;
		activeServices: number;
		knowledgeChunks: number;
		todayCount: number;
		upcomingCount: number;
		pendingCount: number;
	};
}

export async function getDashboardOverviewAction(): Promise<{
	success: boolean;
	data?: DashboardOverview;
	error?: string;
}> {
	try {
		const supabase = await createClient();

		const today = new Date();
		const todayStr = today.toISOString().split("T")[0];

		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);
		const nextWeekStr = nextWeek.toISOString().split("T")[0];

		const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
			.toISOString()
			.split("T")[0];

		// Fetch all data in parallel
		const [
			todaysRes,
			upcomingRes,
			totalAppointmentsRes,
			monthlyContactRes,
			activeServicesRes,
			knowledgeRes,
			pendingRes,
		] = await Promise.all([
			// Today's appointments with services
			supabase
				.from("appointments")
				.select(
					"*, appointment_services(services(id, name, price_small, price_medium, price_large, price_suv, duration_hours))",
				)
				.eq("booking_date", todayStr)
				.order("created_at", { ascending: true }),

			// Upcoming 7 days (excluding today)
			supabase
				.from("appointments")
				.select(
					"*, appointment_services(services(id, name, price_small, price_medium, price_large, price_suv, duration_hours))",
				)
				.gt("booking_date", todayStr)
				.lte("booking_date", nextWeekStr)
				.order("booking_date", { ascending: true }),

			// Total appointments count
			supabase.from("appointments").select("*", { count: "exact", head: true }),

			// Monthly contact submissions count
			supabase
				.from("contact_submissions")
				.select("*", { count: "exact", head: true })
				.gte("created_at", monthStart),

			// Active services count
			supabase.from("services").select("*", { count: "exact", head: true }).eq("active", true),

			// Knowledge chunks count
			supabase.from("chatbot_knowledge").select("*", { count: "exact", head: true }),

			// Pending appointments count
			supabase
				.from("appointments")
				.select("*", { count: "exact", head: true })
				.eq("status", "pending"),
		]);

		const mapAppointments = (rows: Array<Record<string, unknown>> | null): AdminAppointment[] => {
			if (!rows) return [];
			return rows.map((row) => {
				const joinedServices = (
					(row.appointment_services as SupabaseAppointmentServiceJoin[]) || []
				)
					.map((join) => join.services)
					.filter((s): s is SupabaseServiceRecord => s !== null);

				const services: AppointmentServiceItem[] = joinedServices.map((s) => ({
					id: s.id,
					name: s.name ?? "",
					price_small: s.price_small ?? 0,
					price_medium: s.price_medium ?? 0,
					price_large: s.price_large ?? 0,
					price_suv: s.price_suv ?? 0,
					duration_hours: s.duration_hours ?? 0,
				}));

				return {
					id: row.id as string,
					first_name: row.first_name as string,
					last_name: row.last_name as string,
					email: row.email as string,
					phone: row.phone as string,
					car_description: (row.car_description as string) ?? null,
					booking_date: row.booking_date as string,
					status: row.status as AdminAppointment["status"],
					created_at: row.created_at as string,
					services,
				};
			});
		};

		const data: DashboardOverview = {
			todaysAppointments: mapAppointments(todaysRes.data as Array<Record<string, unknown>> | null),
			upcomingAppointments: mapAppointments(
				upcomingRes.data as Array<Record<string, unknown>> | null,
			),
			metrics: {
				totalAppointments: totalAppointmentsRes.count ?? 0,
				monthlySubmissions: monthlyContactRes.count ?? 0,
				activeServices: activeServicesRes.count ?? 0,
				knowledgeChunks: knowledgeRes.count ?? 0,
				todayCount: todaysRes.data?.length ?? 0,
				upcomingCount: upcomingRes.data?.length ?? 0,
				pendingCount: pendingRes.count ?? 0,
			},
		};

		return { success: true, data };
	} catch (error) {
		console.error("[Dashboard] Failed to fetch overview:", error);
		return { success: false, error: "Failed to load dashboard data." };
	}
}
