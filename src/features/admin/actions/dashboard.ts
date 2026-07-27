"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type {
	AdminAppointment,
	AppointmentServiceItem,
} from "@/features/admin/types/appointments.types";

// ── Zod Validation Schemas for Supabase Rows ─────────────────────────────

const SupabaseServiceRecordSchema = z.object({
	id: z.string(),
	name: z.union([z.string(), z.record(z.string())]).nullable(),
	price_small: z.number().nullable(),
	price_medium: z.number().nullable(),
	price_large: z.number().nullable(),
	price_suv: z.number().nullable(),
	duration_hours: z.number().nullable(),
});

const SupabaseAppointmentJoinSchema = z.object({
	services: SupabaseServiceRecordSchema.nullable(),
});

const RawAppointmentRowSchema = z.object({
	id: z.string(),
	first_name: z.string(),
	last_name: z.string(),
	email: z.string(),
	phone: z.string(),
	car_description: z.string().nullable().optional(),
	booking_date: z.string(),
	status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
	created_at: z.string(),
	appointment_services: z.array(SupabaseAppointmentJoinSchema).optional().nullable(),
});

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

/**
 * Formats a Date object into a YYYY-MM-DD string in local business time,
 * avoiding UTC date boundary shifts caused by toISOString().
 */
function formatLocalDate(d: Date): string {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export async function getDashboardOverviewAction(): Promise<{
	success: boolean;
	data?: DashboardOverview;
	error?: string;
}> {
	try {
		const supabase = await createClient();

		const today = new Date();
		const todayStr = formatLocalDate(today);

		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);
		const nextWeekStr = formatLocalDate(nextWeek);

		const monthStart = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));

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

		// Check for query errors across all responses
		const queryError =
			todaysRes.error ||
			upcomingRes.error ||
			totalAppointmentsRes.error ||
			monthlyContactRes.error ||
			activeServicesRes.error ||
			knowledgeRes.error ||
			pendingRes.error;

		if (queryError) {
			console.error("[Dashboard] Database query error:", queryError.message);
			return { success: false, error: queryError.message };
		}

		const parseAndMapAppointments = (rows: unknown[] | null): AdminAppointment[] => {
			if (!rows || rows.length === 0) return [];
			const mapped: AdminAppointment[] = [];

			for (const raw of rows) {
				const parseResult = RawAppointmentRowSchema.safeParse(raw);
				if (!parseResult.success) {
					console.warn(
						"[Dashboard] Appointment row validation failed:",
						parseResult.error.flatten(),
					);
					continue;
				}

				const row = parseResult.data;
				const joinedServices = row.appointment_services || [];

				const services: AppointmentServiceItem[] = joinedServices
					.map((j) => j.services)
					.filter((s): s is z.infer<typeof SupabaseServiceRecordSchema> => s !== null)
					.map((s) => ({
						id: s.id,
						name: s.name ?? "",
						price_small: s.price_small ?? 0,
						price_medium: s.price_medium ?? 0,
						price_large: s.price_large ?? 0,
						price_suv: s.price_suv ?? 0,
						duration_hours: s.duration_hours ?? 0,
					}));

				mapped.push({
					id: row.id,
					first_name: row.first_name,
					last_name: row.last_name,
					email: row.email,
					phone: row.phone,
					car_description: row.car_description ?? null,
					booking_date: row.booking_date,
					status: row.status,
					created_at: row.created_at,
					services,
				});
			}

			return mapped;
		};

		const data: DashboardOverview = {
			todaysAppointments: parseAndMapAppointments(todaysRes.data),
			upcomingAppointments: parseAndMapAppointments(upcomingRes.data),
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
