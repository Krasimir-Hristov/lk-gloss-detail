"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const CreateBookingSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email(),
	phone: z.string().min(6),
	carDescription: z.string().optional(),
	selectedServiceIds: z.array(z.string().uuid()).min(1),
	bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type BookingResult =
	| { success: true; appointmentId: string }
	| { success: false; error: "DATE_TAKEN" | "INVALID_DATA" | "INTERNAL_ERROR" };

export const createBooking = async (
	data: z.infer<typeof CreateBookingSchema>,
): Promise<BookingResult> => {
	const parsed = CreateBookingSchema.safeParse(data);
	if (!parsed.success) {
		console.error("[booking/create] Validation error:", parsed.error.issues);
		return { success: false, error: "INVALID_DATA" };
	}

	const { firstName, lastName, email, phone, carDescription, selectedServiceIds, bookingDate } =
		parsed.data;

	const supabase = await createClient();

	// Pre-check date availability
	const [
		{ data: existingAppointments, error: existingError },
		{ data: blockedDates, error: blockedError },
	] = await Promise.all([
		supabase.from("appointments").select("id").eq("booking_date", bookingDate),
		supabase.from("blocked_dates").select("id").eq("blocked_date", bookingDate),
	]);

	if (existingError) {
		console.error("[booking/create] Existing appointments query error:", existingError.message);
		return { success: false, error: "INTERNAL_ERROR" };
	}
	if (blockedError) {
		console.error("[booking/create] Blocked dates query error:", blockedError.message);
		return { success: false, error: "INTERNAL_ERROR" };
	}

	if ((existingAppointments ?? []).length > 0 || (blockedDates ?? []).length > 0) {
		return { success: false, error: "DATE_TAKEN" };
	}

	// Insert appointment
	const { data: appointment, error: appointmentError } = await supabase
		.from("appointments")
		.insert({
			first_name: firstName,
			last_name: lastName,
			email,
			phone,
			car_description: carDescription,
			booking_date: bookingDate,
			status: "confirmed",
		})
		.select("id")
		.single();

	if (appointmentError) {
		if (appointmentError.code === "23505") {
			return { success: false, error: "DATE_TAKEN" };
		}
		console.error("[booking/create] Appointment insert error:", appointmentError.message);
		return { success: false, error: "INTERNAL_ERROR" };
	}

	// Insert junction records
	const junctionRecords = selectedServiceIds.map((serviceId) => ({
		appointment_id: appointment.id,
		service_id: serviceId,
	}));

	const { error: junctionError } = await supabase
		.from("appointment_services")
		.insert(junctionRecords);

	if (junctionError) {
		// Cleanup orphaned appointment
		await supabase.from("appointments").delete().eq("id", appointment.id);
		console.error("[booking/create] Junction insert error:", junctionError.message);
		return { success: false, error: "INTERNAL_ERROR" };
	}

	return { success: true, appointmentId: appointment.id };
};
