"use server";

import { revalidatePath } from "next/cache";

import {
	EditAppointmentSchema,
	UpdateStatusSchema,
	type EditAppointmentInput,
	type UpdateStatusInput,
} from "@/features/admin/schemas/appointments.schema";
import { isAdminUser } from "@/features/admin/utils/auth";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

import type {
	AdminAppointment,
	AppointmentServiceItem,
	AppointmentStatus,
} from "@/features/admin/types/appointments.types";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const validStatuses: readonly AppointmentStatus[] = [
	"pending",
	"confirmed",
	"completed",
	"cancelled",
];

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

const revalidateAdminAppointments = () => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin/appointments`);
		} catch {
			// Ignore if outside request context
		}
	}
};

/**
 * Fetches all appointments with joined services for the admin dashboard.
 */
export const getAdminAppointments = async (): Promise<ActionResult<AdminAppointment[]>> => {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { data, error } = await supabase
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

		// Format joined structure
		const appointments: AdminAppointment[] = (data || []).map((row) => {
			const servicesList: AppointmentServiceItem[] = [];

			const rawJoins = row.appointment_services as unknown as
				| SupabaseAppointmentServiceJoin[]
				| null;

			if (Array.isArray(rawJoins)) {
				for (const item of rawJoins) {
					const rawService = item.services;
					if (rawService) {
						servicesList.push({
							id: rawService.id,
							name: rawService.name || "",
							price_small: Number(rawService.price_small) || 0,
							price_medium: Number(rawService.price_medium) || 0,
							price_large: Number(rawService.price_large) || 0,
							price_suv: Number(rawService.price_suv) || 0,
							duration_hours: Number(rawService.duration_hours) || 0,
						});
					}
				}
			}

			const statusVal = row.status as AppointmentStatus;
			const safeStatus: AppointmentStatus = validStatuses.includes(statusVal)
				? statusVal
				: "confirmed";

			return {
				id: row.id,
				first_name: row.first_name,
				last_name: row.last_name,
				email: row.email,
				phone: row.phone,
				car_description: row.car_description,
				booking_date: row.booking_date,
				status: safeStatus,
				created_at: row.created_at,
				services: servicesList,
			};
		});

		return { success: true, data: appointments };
	} catch (err) {
		console.error("[getAdminAppointments] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Updates the status of an appointment.
 */
export const updateAppointmentStatus = async (
	input: UpdateStatusInput,
): Promise<ActionResult<null>> => {
	try {
		const parsed = UpdateStatusSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Invalid parameters" };
		}

		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { error } = await supabase
			.from("appointments")
			.update({ status: parsed.data.status })
			.eq("id", parsed.data.id);

		if (error) {
			console.error("[updateAppointmentStatus] Supabase error:", error.message);
			return { success: false, error: "Failed to update appointment status" };
		}

		revalidateAdminAppointments();
		return { success: true, data: null };
	} catch (err) {
		console.error("[updateAppointmentStatus] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Deletes an appointment by ID.
 */
export const deleteAppointment = async (id: string): Promise<ActionResult<null>> => {
	try {
		if (!id) {
			return { success: false, error: "Missing appointment ID" };
		}

		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { error } = await supabase.from("appointments").delete().eq("id", id);

		if (error) {
			console.error("[deleteAppointment] Supabase error:", error.message);
			return { success: false, error: "Failed to delete appointment" };
		}

		revalidateAdminAppointments();
		return { success: true, data: null };
	} catch (err) {
		console.error("[deleteAppointment] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Updates full appointment details.
 */
export const editAppointment = async (input: EditAppointmentInput): Promise<ActionResult<null>> => {
	try {
		const parsed = EditAppointmentSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Validation failed" };
		}

		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const {
			id,
			first_name,
			last_name,
			email,
			phone,
			car_description,
			booking_date,
			status,
			service_ids,
		} = parsed.data;

		// 1. Update main appointment record
		const { error: apptError } = await supabase
			.from("appointments")
			.update({
				first_name,
				last_name,
				email,
				phone,
				car_description: car_description || null,
				booking_date,
				status,
			})
			.eq("id", id);

		if (apptError) {
			console.error("[editAppointment] Error updating appointment:", apptError.message);
			return { success: false, error: "Failed to update appointment details" };
		}

		// 2. Re-assign services in appointment_services
		const { error: deleteError } = await supabase
			.from("appointment_services")
			.delete()
			.eq("appointment_id", id);

		if (deleteError) {
			console.error("[editAppointment] Error clearing appointment services:", deleteError.message);
			return { success: false, error: "Failed to update services" };
		}

		const newServiceRows = service_ids.map((serviceId) => ({
			appointment_id: id,
			service_id: serviceId,
		}));

		const { error: insertError } = await supabase
			.from("appointment_services")
			.insert(newServiceRows);

		if (insertError) {
			console.error("[editAppointment] Error inserting appointment services:", insertError.message);
			return { success: false, error: "Failed to re-assign services" };
		}

		revalidateAdminAppointments();
		return { success: true, data: null };
	} catch (err) {
		console.error("[editAppointment] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Fetches all available services for editing dropdowns.
 */
export const getAvailableServices = async (): Promise<ActionResult<AppointmentServiceItem[]>> => {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { data, error } = await supabase
			.from("services")
			.select("id, name, price_small, price_medium, price_large, price_suv, duration_hours")
			.eq("active", true)
			.order("name");

		if (error) {
			console.error("[getAvailableServices] Supabase error:", error.message);
			return { success: false, error: "Failed to fetch services" };
		}

		const services: AppointmentServiceItem[] = (data || []).map((s) => ({
			id: s.id,
			name: s.name || "",
			price_small: Number(s.price_small) || 0,
			price_medium: Number(s.price_medium) || 0,
			price_large: Number(s.price_large) || 0,
			price_suv: Number(s.price_suv) || 0,
			duration_hours: Number(s.duration_hours) || 0,
		}));

		return { success: true, data: services };
	} catch (err) {
		console.error("[getAvailableServices] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
