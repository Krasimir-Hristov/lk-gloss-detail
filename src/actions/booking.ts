"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { getBerlinTodayIso } from "@/lib/date/berlinDate";
import { createServiceClient } from "@/lib/supabase/service";

const CreateBookingSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.email(),
	phone: z.string().min(6),
	carDescription: z.string().optional(),
	selectedServiceIds: z.array(z.uuid()).min(1),
	bookingDate: z.iso.date(),
});

interface CreateBookingRpcArgs {
	p_first_name: string;
	p_last_name: string;
	p_email: string;
	p_phone: string;
	p_car_description: string | null;
	p_booking_date: string;
	p_service_ids: string[];
}

interface BookingRpcClient {
	rpc: (
		fn: "create_booking",
		args: CreateBookingRpcArgs,
	) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;
}

type BookingResult =
	| { success: true; appointmentId: string }
	| { success: false; error: "DATE_TAKEN" | "DATE_BLOCKED" | "INVALID_DATA" | "INTERNAL_ERROR" };

const revalidateBookingPaths = (): void => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin`);
			revalidatePath(`/${loc}/admin/appointments`);
			revalidatePath(`/${loc}/booking`);
		} catch {
			// Ignore if called outside Next.js request context (e.g. unit tests)
		}
	}
};

export const createBooking = async (
	data: z.infer<typeof CreateBookingSchema>,
): Promise<BookingResult> => {
	try {
		const parsed = CreateBookingSchema.safeParse(data);
		if (!parsed.success) {
			console.error(
				"[booking/create] Validation error:",
				parsed.error.issues.map(({ code, path }) => ({ code, path })),
			);
			return { success: false, error: "INVALID_DATA" };
		}

		const { firstName, lastName, email, phone, carDescription, selectedServiceIds, bookingDate } =
			parsed.data;

		const supabase = createServiceClient();
		const rpcClient = supabase as unknown as BookingRpcClient;

		const { data: appointmentId, error } = await rpcClient.rpc("create_booking", {
			p_first_name: firstName,
			p_last_name: lastName,
			p_email: email,
			p_phone: phone,
			p_car_description: carDescription ?? null,
			p_booking_date: bookingDate,
			p_service_ids: selectedServiceIds,
		});

		if (error) {
			if (error.message.includes("DATE_BLOCKED")) {
				return { success: false, error: "DATE_BLOCKED" };
			}
			if (error.message.includes("DATE_TAKEN") || error.code === "23505") {
				return { success: false, error: "DATE_TAKEN" };
			}
			console.error("[booking/create] RPC error:", error.message);
			return { success: false, error: "INTERNAL_ERROR" };
		}

		if (typeof appointmentId !== "string" || appointmentId.length === 0) {
			console.error("[booking/create] RPC returned invalid appointment ID");
			return { success: false, error: "INTERNAL_ERROR" };
		}

		revalidateBookingPaths();
		return { success: true, appointmentId };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("[booking/create] Unexpected error:", msg);
		return { success: false, error: "INTERNAL_ERROR" };
	}
};

export const getUnavailableDates = async (): Promise<string[]> => {
	try {
		const supabase = createServiceClient();
		const today = getBerlinTodayIso();

		const [
			{ data: appointments, error: appointmentsError },
			{ data: blockedDates, error: blockedDatesError },
		] = await Promise.all([
			supabase
				.from("appointments")
				.select("booking_date")
				.gte("booking_date", today)
				.neq("status", "cancelled"),
			supabase.from("blocked_dates").select("blocked_date").gte("blocked_date", today),
		]);

		if (appointmentsError) {
			console.error(
				"[booking/unavailable-dates] Appointments query error:",
				appointmentsError.message,
			);
			throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`);
		}
		if (blockedDatesError) {
			console.error(
				"[booking/unavailable-dates] Blocked dates query error:",
				blockedDatesError.message,
			);
			throw new Error(`Failed to fetch blocked dates: ${blockedDatesError.message}`);
		}

		const appointmentDates = ((appointments ?? []) as { booking_date: string }[]).map(
			(a) => a.booking_date,
		);
		const blocked = ((blockedDates ?? []) as { blocked_date: string }[]).map((b) => b.blocked_date);

		return Array.from(new Set([...appointmentDates, ...blocked]));
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("[booking/unavailable-dates] Error fetching unavailable dates:", msg);
		throw err instanceof Error ? err : new Error(msg);
	}
};
