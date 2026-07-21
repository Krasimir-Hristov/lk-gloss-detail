"use server";

import { revalidatePath } from "next/cache";

import { BlockDateSchema, type BlockDateInput } from "@/features/admin/schemas/appointments.schema";
import { isAdminUser } from "@/features/admin/utils/auth";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "@/features/admin/actions/appointments";
import type { BlockedDateItem } from "@/features/admin/types/appointments.types";

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
 * Fetches all blocked dates for admin view.
 */
export const getBlockedDates = async (): Promise<ActionResult<BlockedDateItem[]>> => {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { data, error } = await supabase
			.from("blocked_dates")
			.select("id, blocked_date, reason, created_at")
			.order("blocked_date", { ascending: true });

		if (error) {
			console.error("[getBlockedDates] Supabase error:", error.message);
			return { success: false, error: "Failed to fetch blocked dates" };
		}

		const items: BlockedDateItem[] = (data || []).map((row) => ({
			id: row.id,
			blocked_date: row.blocked_date,
			reason: row.reason,
			created_at: row.created_at,
		}));

		return { success: true, data: items };
	} catch (err) {
		console.error("[getBlockedDates] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Manually blocks a date in the database.
 */
export const blockDate = async (input: BlockDateInput): Promise<ActionResult<BlockedDateItem>> => {
	try {
		const parsed = BlockDateSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Invalid date or inputs" };
		}

		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { data, error } = await supabase
			.from("blocked_dates")
			.insert({
				blocked_date: parsed.data.blocked_date,
				reason: parsed.data.reason || null,
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

		revalidateAdminAppointments();
		return {
			success: true,
			data: {
				id: data.id,
				blocked_date: data.blocked_date,
				reason: data.reason,
				created_at: data.created_at,
			},
		};
	} catch (err) {
		console.error("[blockDate] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

/**
 * Unblocks a date in the database.
 */
export const unblockDate = async (id: string): Promise<ActionResult<null>> => {
	try {
		if (!id) {
			return { success: false, error: "Missing ID" };
		}

		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

		if (error) {
			console.error("[unblockDate] Supabase error:", error.message);
			return { success: false, error: "Failed to unblock date" };
		}

		revalidateAdminAppointments();
		return { success: true, data: null };
	} catch (err) {
		console.error("[unblockDate] Unexpected error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
