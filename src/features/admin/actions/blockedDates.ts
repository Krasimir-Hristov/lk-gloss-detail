"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
	BlockDateRangeSchema,
	BlockDateSchema,
	type BlockDateInput,
	type BlockDateRangeInput,
} from "@/features/admin/schemas/appointmentsSchema";
import { routing } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { addDaysBerlinIso, getBerlinTodayIso } from "@/lib/date/berlinDate";

import type { ActionResult } from "@/features/admin/actions/appointments";
import type { BlockedDateItem } from "@/features/admin/types/appointmentsTypes";

export interface BlockedDateConflict {
	id: string;
	booking_date: string;
	first_name: string;
	last_name: string;
	status: string;
}

export interface BlockDateRangeResult {
	added: BlockedDateItem[];
	conflicts: BlockedDateConflict[];
}

const BlockedDateRowSchema = z.object({
	id: z.string(),
	blocked_date: z.string(),
	reason: z.string().nullable(),
	created_at: z.string(),
});

const ConflictAppointmentRowSchema = z.object({
	id: z.string(),
	booking_date: z.string(),
	first_name: z.string(),
	last_name: z.string(),
	status: z.string(),
});

const UuidSchema = z.string().uuid();

const revalidateBlockedDatePaths = (): void => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin`);
			revalidatePath(`/${loc}/admin/appointments`);
			revalidatePath(`/${loc}/booking`);
		} catch {
			// Ignore if outside request context
		}
	}
};

/**
 * Fetches all blocked dates for admin view.
 */
export const getBlockedDates = async (): Promise<ActionResult<BlockedDateItem[]>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const { data, error } = await auth.supabase
			.from("blocked_dates")
			.select("id, blocked_date, reason, created_at")
			.order("blocked_date", { ascending: true });

		if (error) {
			console.error("[getBlockedDates] Supabase error:", error.message);
			return { success: false, error: "Failed to fetch blocked dates" };
		}

		const parsed = z.array(BlockedDateRowSchema).safeParse(data ?? []);
		if (!parsed.success) {
			console.error("[getBlockedDates] Row validation error:", parsed.error.flatten());
			return { success: false, error: "Invalid blocked dates data" };
		}

		return { success: true, data: parsed.data };
	} catch (err: unknown) {
		console.error("[getBlockedDates] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Manually blocks a single date in the database.
 */
export const blockDate = async (input: BlockDateInput): Promise<ActionResult<BlockedDateItem>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = BlockDateSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Invalid date or inputs" };
		}

		const { data, error } = await auth.supabase
			.from("blocked_dates")
			.insert({
				blocked_date: parsed.data.blocked_date,
				reason: parsed.data.reason?.trim() || null,
			})
			.select("id, blocked_date, reason, created_at")
			.single();

		if (error) {
			console.error("[blockDate] Supabase error:", error.message);
			if (error.code === "23505") {
				return { success: false, error: "This date is already blocked" };
			}
			return { success: false, error: "Failed to block date" };
		}

		const parsedRow = BlockedDateRowSchema.safeParse(data);
		if (!parsedRow.success) {
			return { success: false, error: "Invalid blocked date record" };
		}

		revalidateBlockedDatePaths();
		return { success: true, data: parsedRow.data };
	} catch (err: unknown) {
		console.error("[blockDate] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Blocks an inclusive date range (up to 60 days) with past-date rejection
 * and active-appointment conflict detection.
 */
export const blockDateRange = async (
	input: BlockDateRangeInput,
): Promise<ActionResult<BlockDateRangeResult>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = BlockDateRangeSchema.safeParse(input);
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.issues[0]?.message ?? "Invalid date range",
			};
		}

		const { start_date, end_date, reason, allow_conflict } = parsed.data;
		const todayIso = getBerlinTodayIso();

		if (start_date < todayIso) {
			return { success: false, error: "Cannot block dates in the past" };
		}

		const { supabase } = auth;

		const { data: conflictRows, error: conflictError } = await supabase
			.from("appointments")
			.select("id, booking_date, first_name, last_name, status")
			.gte("booking_date", start_date)
			.lte("booking_date", end_date)
			.neq("status", "cancelled")
			.order("booking_date", { ascending: true });

		if (conflictError) {
			console.error("[blockDateRange] Conflict check error:", conflictError.message);
			return { success: false, error: "Failed to check existing appointments" };
		}

		const parsedConflicts = z.array(ConflictAppointmentRowSchema).safeParse(conflictRows ?? []);
		if (!parsedConflicts.success) {
			console.error("[blockDateRange] Conflict validation error:", parsedConflicts.error.flatten());
			return { success: false, error: "Invalid appointment conflict records" };
		}

		const conflicts = parsedConflicts.data;
		if (conflicts.length > 0 && !allow_conflict) {
			return {
				success: true,
				data: {
					added: [],
					conflicts,
				},
			};
		}

		const datesToBlock: string[] = [];
		let cursor = start_date;
		while (cursor <= end_date) {
			datesToBlock.push(cursor);
			cursor = addDaysBerlinIso(cursor, 1);
		}

		const trimmedReason = reason?.trim() || null;
		const upsertRows = datesToBlock.map((blocked_date) => ({
			blocked_date,
			reason: trimmedReason,
		}));

		const { data: upsertedRows, error: upsertError } = await supabase
			.from("blocked_dates")
			.upsert(upsertRows, { onConflict: "blocked_date" })
			.select("id, blocked_date, reason, created_at")
			.order("blocked_date", { ascending: true });

		if (upsertError) {
			console.error("[blockDateRange] Upsert error:", upsertError.message);
			return { success: false, error: "Failed to block date range" };
		}

		const parsedAdded = z.array(BlockedDateRowSchema).safeParse(upsertedRows ?? []);
		if (!parsedAdded.success) {
			console.error(
				"[blockDateRange] Upserted rows validation error:",
				parsedAdded.error.flatten(),
			);
			return { success: false, error: "Invalid blocked dates returned" };
		}

		revalidateBlockedDatePaths();
		return {
			success: true,
			data: {
				added: parsedAdded.data,
				conflicts,
			},
		};
	} catch (err: unknown) {
		console.error("[blockDateRange] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Unblocks a date in the database.
 */
export const unblockDate = async (id: string): Promise<ActionResult<null>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsedId = UuidSchema.safeParse(id);
		if (!parsedId.success) {
			return { success: false, error: "Invalid blocked date ID" };
		}

		const { error } = await auth.supabase.from("blocked_dates").delete().eq("id", parsedId.data);

		if (error) {
			console.error("[unblockDate] Supabase error:", error.message);
			return { success: false, error: "Failed to unblock date" };
		}

		revalidateBlockedDatePaths();
		return { success: true, data: null };
	} catch (err: unknown) {
		console.error("[unblockDate] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
