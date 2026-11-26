"use server";

import { z } from "zod";

import { AdminMessageSchema } from "@/features/admin/schemas/messagesSchema";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { addDaysBerlinIso, getBerlinTodayIso } from "@/lib/date/berlinDate";

import type {
	AdminAppointment,
	AppointmentServiceItem,
} from "@/features/admin/types/appointmentsTypes";
import type { AdminSidebarCounts, DashboardOverview } from "@/features/admin/types/dashboardTypes";
import type { AdminMessage } from "@/features/admin/types/messagesTypes";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

// ── Zod Validation Schemas for Supabase Rows ─────────────────────────────

const SupabaseServiceRecordSchema = z.object({
	id: z.string(),
	name: z.union([z.string(), z.record(z.string(), z.string())]).nullable(),
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

const APPOINTMENT_SELECT =
	"id, first_name, last_name, email, phone, car_description, booking_date, status, created_at, appointment_services(services(id, name, price_small, price_medium, price_large, price_suv, duration_hours))";

const parseAndMapAppointments = (rows: unknown[] | null): AdminAppointment[] => {
	if (!rows || rows.length === 0) return [];
	const mapped: AdminAppointment[] = [];

	for (const raw of rows) {
		const parseResult = RawAppointmentRowSchema.safeParse(raw);
		if (!parseResult.success) {
			console.warn("[Dashboard] Appointment row validation failed:", parseResult.error.flatten());
			continue;
		}

		const row = parseResult.data;
		const joinedServices = row.appointment_services ?? [];

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

const parseMessages = (rows: unknown[] | null): AdminMessage[] => {
	if (!rows || rows.length === 0) return [];
	const parsed: AdminMessage[] = [];

	for (const raw of rows) {
		const res = AdminMessageSchema.safeParse(raw);
		if (res.success) {
			parsed.push(res.data);
		} else {
			console.warn("[Dashboard] Message row validation failed:", res.error.flatten());
		}
	}

	return parsed;
};

export const getDashboardOverviewAction = async (): Promise<ActionResult<DashboardOverview>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const { supabase } = auth;
		const todayIso = getBerlinTodayIso();
		const nextWeekIso = addDaysBerlinIso(todayIso, 7);

		const [todaysRes, upcomingRes, pendingRes, unreadCountRes, recentUnreadRes] = await Promise.all(
			[
				supabase
					.from("appointments")
					.select(APPOINTMENT_SELECT)
					.eq("booking_date", todayIso)
					.neq("status", "cancelled")
					.order("created_at", { ascending: true }),

				supabase
					.from("appointments")
					.select(APPOINTMENT_SELECT)
					.gt("booking_date", todayIso)
					.lte("booking_date", nextWeekIso)
					.neq("status", "cancelled")
					.order("booking_date", { ascending: true }),

				supabase
					.from("appointments")
					.select("*", { count: "exact", head: true })
					.eq("status", "pending"),

				supabase
					.from("contact_submissions")
					.select("*", { count: "exact", head: true })
					.eq("status", "unread"),

				supabase
					.from("contact_submissions")
					.select("id, name, email, phone, message, status, read_at, created_at")
					.eq("status", "unread")
					.order("created_at", { ascending: false })
					.limit(5),
			],
		);

		const queryError =
			todaysRes.error ||
			upcomingRes.error ||
			pendingRes.error ||
			unreadCountRes.error ||
			recentUnreadRes.error;

		if (queryError) {
			console.error("[Dashboard] Database query error:", queryError.message);
			return { success: false, error: "Failed to load dashboard data." };
		}

		const todaysAppointments = parseAndMapAppointments(todaysRes.data);
		const upcomingAppointments = parseAndMapAppointments(upcomingRes.data);
		const recentUnreadMessages = parseMessages(recentUnreadRes.data);

		return {
			success: true,
			data: {
				todaysAppointments,
				upcomingAppointments,
				recentUnreadMessages,
				metrics: {
					pendingCount: pendingRes.count ?? 0,
					unreadMessagesCount: unreadCountRes.count ?? 0,
					todayCount: todaysAppointments.length,
					upcomingCount: upcomingAppointments.length,
				},
			},
		};
	} catch (error: unknown) {
		console.error("[Dashboard] Failed to fetch overview:", error);
		return { success: false, error: "Failed to load dashboard data." };
	}
};

export const getAdminSidebarCountsAction = async (): Promise<ActionResult<AdminSidebarCounts>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const { supabase } = auth;

		const [pendingRes, unreadRes] = await Promise.all([
			supabase
				.from("appointments")
				.select("*", { count: "exact", head: true })
				.eq("status", "pending"),
			supabase
				.from("contact_submissions")
				.select("*", { count: "exact", head: true })
				.eq("status", "unread"),
		]);

		if (pendingRes.error || unreadRes.error) {
			const msg = pendingRes.error?.message ?? unreadRes.error?.message ?? "Unknown error";
			console.error("[Dashboard/SidebarCounts] DB error:", msg);
			return { success: false, error: "Failed to fetch sidebar counts." };
		}

		return {
			success: true,
			data: {
				pendingAppointments: pendingRes.count ?? 0,
				unreadMessages: unreadRes.count ?? 0,
			},
		};
	} catch (error: unknown) {
		console.error("[Dashboard/SidebarCounts] Unexpected error:", error);
		return { success: false, error: "Failed to fetch sidebar counts." };
	}
};
