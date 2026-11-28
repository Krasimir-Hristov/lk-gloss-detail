"use server";

import { z } from "zod";

import {
	deleteAppointment as deleteAppointmentMutation,
	editAppointment as editAppointmentMutation,
	updateAppointmentStatus as updateAppointmentStatusMutation,
} from "@/features/admin/actions/appointmentMutations";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import type {
	EditAppointmentInput,
	UpdateStatusInput,
} from "@/features/admin/schemas/appointmentsSchema";
import type {
	AdminAppointment,
	AppointmentServiceItem,
} from "@/features/admin/types/appointmentsTypes";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const SupabaseServiceRecordSchema = z.object({
	id: z.string(),
	name: z.union([z.record(z.string(), z.string()), z.string()]).nullable(),
	price_small: z.number().nullable(),
	price_medium: z.number().nullable(),
	price_large: z.number().nullable(),
	price_suv: z.number().nullable(),
	duration_hours: z.number().nullable(),
});

const SupabaseAppointmentServiceJoinSchema = z.object({
	services: SupabaseServiceRecordSchema.nullable(),
});

const RawAdminAppointmentRowSchema = z.object({
	id: z.string(),
	first_name: z.string(),
	last_name: z.string(),
	email: z.string(),
	phone: z.string(),
	car_description: z.string().nullable().optional(),
	booking_date: z.string(),
	status: z.enum(["pending", "confirmed", "completed", "cancelled"]).catch("confirmed"),
	created_at: z.string(),
	appointment_services: z.array(SupabaseAppointmentServiceJoinSchema).optional().nullable(),
});

/**
 * Fetches all appointments with joined services for the admin dashboard.
 */
export const getAdminAppointments = async (): Promise<ActionResult<AdminAppointment[]>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const { data, error } = await auth.supabase
			.from("appointments")
			.select(
				`
				id,
				first_name,
				last_name,
				email,
				phone,
				car_description,
				booking_date,
				status,
				created_at,
				appointment_services (
					services (
						id,
						name,
						price_small,
						price_medium,
						price_large,
						price_suv,
						duration_hours
					)
				)
			`,
			)
			.order("booking_date", { ascending: false });

		if (error) {
			console.error("[getAdminAppointments] Supabase query error:", error.message);
			return { success: false, error: "Failed to fetch appointments" };
		}

		const appointments: AdminAppointment[] = [];
		for (const rawRow of data ?? []) {
			const parsed = RawAdminAppointmentRowSchema.safeParse(rawRow);
			if (!parsed.success) {
				console.warn("[getAdminAppointments] Skipping invalid row:", parsed.error.flatten());
				continue;
			}

			const row = parsed.data;
			const servicesList: AppointmentServiceItem[] = (row.appointment_services ?? [])
				.map((item) => item.services)
				.filter((s): s is z.infer<typeof SupabaseServiceRecordSchema> => s !== null)
				.map((s) => ({
					id: s.id,
					name: s.name ?? "",
					price_small: Number(s.price_small) || 0,
					price_medium: Number(s.price_medium) || 0,
					price_large: Number(s.price_large) || 0,
					price_suv: Number(s.price_suv) || 0,
					duration_hours: Number(s.duration_hours) || 0,
				}));

			appointments.push({
				id: row.id,
				first_name: row.first_name,
				last_name: row.last_name,
				email: row.email,
				phone: row.phone,
				car_description: row.car_description ?? null,
				booking_date: row.booking_date,
				status: row.status,
				created_at: row.created_at,
				services: servicesList,
			});
		}

		return { success: true, data: appointments };
	} catch (err: unknown) {
		console.error("[getAdminAppointments] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Fetches all active services for appointment editing dropdowns.
 */
export const getAvailableServices = async (): Promise<ActionResult<AppointmentServiceItem[]>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const { data, error } = await auth.supabase
			.from("services")
			.select("id, name, price_small, price_medium, price_large, price_suv, duration_hours")
			.eq("active", true)
			.order("sort_order", { ascending: true });

		if (error) {
			console.error("[getAvailableServices] Supabase error:", error.message);
			return { success: false, error: "Failed to fetch services" };
		}

		const parsedRows = z.array(SupabaseServiceRecordSchema).safeParse(data ?? []);
		if (!parsedRows.success) {
			console.error("[getAvailableServices] Validation error:", parsedRows.error.flatten());
			return { success: false, error: "Invalid services data" };
		}

		const services: AppointmentServiceItem[] = parsedRows.data.map((s) => ({
			id: s.id,
			name: s.name ?? "",
			price_small: Number(s.price_small) || 0,
			price_medium: Number(s.price_medium) || 0,
			price_large: Number(s.price_large) || 0,
			price_suv: Number(s.price_suv) || 0,
			duration_hours: Number(s.duration_hours) || 0,
		}));

		return { success: true, data: services };
	} catch (err: unknown) {
		console.error("[getAvailableServices] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const updateAppointmentStatus = async (
	input: UpdateStatusInput,
): Promise<ActionResult<null>> => updateAppointmentStatusMutation(input);

export const deleteAppointment = async (id: string): Promise<ActionResult<null>> =>
	deleteAppointmentMutation(id);

export const editAppointment = async (input: EditAppointmentInput): Promise<ActionResult<null>> =>
	editAppointmentMutation(input);
