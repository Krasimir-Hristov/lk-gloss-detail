"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
	AdminMessageSchema,
	DeleteMessageSchema,
	MessagesFilterSchema,
	UpdateMessageStatusSchema,
	type DeleteMessageInput,
	type MessagesFilter,
	type UpdateMessageStatusInput,
} from "@/features/admin/schemas/messagesSchema";
import { routing } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import type { ActionResult } from "@/features/admin/actions/dashboard";
import type {
	AdminMessage,
	MessageCounts,
	MessagesPageMeta,
	MessageStatus,
} from "@/features/admin/types/messagesTypes";

const MESSAGE_SELECT = "id, name, email, phone, message, status, read_at, created_at";

const revalidateAdminMessagesPaths = (): void => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin`);
			revalidatePath(`/${loc}/admin/messages`);
		} catch {
			// Ignore if called outside Next.js request context (e.g. unit tests)
		}
	}
};

export const getAdminMessages = async (
	filter?: Partial<MessagesFilter>,
): Promise<
	ActionResult<{ messages: AdminMessage[]; counts: MessageCounts; pagination: MessagesPageMeta }>
> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsedFilter = MessagesFilterSchema.safeParse(filter ?? {});
		if (!parsedFilter.success) {
			return { success: false, error: "Invalid filter parameters" };
		}

		const { status, search, page, pageSize } = parsedFilter.data;
		const { supabase } = auth;
		const rangeFrom = (page - 1) * pageSize;
		const rangeTo = rangeFrom + pageSize - 1;

		let listQuery = supabase
			.from("contact_submissions")
			.select(MESSAGE_SELECT, { count: "exact" })
			.order("created_at", { ascending: false })
			.range(rangeFrom, rangeTo);

		if (status !== "all") {
			listQuery = listQuery.eq("status", status);
		}

		if (search && search.length > 0) {
			const safeSearch = search
				.replace(/[,()\\*%_"]/g, " ")
				.replace(/\s+/g, " ")
				.trim();
			if (safeSearch.length > 0) {
				listQuery = listQuery.or(
					`name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,message.ilike.%${safeSearch}%`,
				);
			}
		}

		const [listRes, allRes, unreadRes, readRes, archivedRes] = await Promise.all([
			listQuery,
			supabase.from("contact_submissions").select("*", { count: "exact", head: true }),
			supabase
				.from("contact_submissions")
				.select("*", { count: "exact", head: true })
				.eq("status", "unread"),
			supabase
				.from("contact_submissions")
				.select("*", { count: "exact", head: true })
				.eq("status", "read"),
			supabase
				.from("contact_submissions")
				.select("*", { count: "exact", head: true })
				.eq("status", "archived"),
		]);

		const queryError =
			listRes.error || allRes.error || unreadRes.error || readRes.error || archivedRes.error;

		if (queryError) {
			console.error("[getAdminMessages] DB error:", queryError.message);
			return { success: false, error: "Failed to fetch messages" };
		}

		const parsedRows = z.array(AdminMessageSchema).safeParse(listRes.data ?? []);
		if (!parsedRows.success) {
			console.error("[getAdminMessages] Row validation error:", parsedRows.error.flatten());
			return { success: false, error: "Invalid message records in database" };
		}

		const counts: MessageCounts = {
			all: allRes.count ?? 0,
			unread: unreadRes.count ?? 0,
			read: readRes.count ?? 0,
			archived: archivedRes.count ?? 0,
		};

		const totalFiltered = listRes.count ?? parsedRows.data.length;
		const pagination: MessagesPageMeta = {
			page,
			pageSize,
			totalFiltered,
			totalPages: Math.max(1, Math.ceil(totalFiltered / pageSize)),
		};

		return {
			success: true,
			data: {
				messages: parsedRows.data,
				counts,
				pagination,
			},
		};
	} catch (err: unknown) {
		console.error("[getAdminMessages] Unexpected error:", err);
		return { success: false, error: "Failed to fetch messages" };
	}
};

export const updateMessageStatus = async (
	input: UpdateMessageStatusInput,
): Promise<ActionResult<AdminMessage>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = UpdateMessageStatusSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Invalid message status payload" };
		}

		const { id, status } = parsed.data;
		const { supabase } = auth;

		let updatePayload: { status: MessageStatus; read_at?: string | null } = { status };

		if (status === "unread") {
			updatePayload = { status, read_at: null };
		} else if (status === "read") {
			const { data: existing, error: fetchError } = await supabase
				.from("contact_submissions")
				.select("read_at")
				.eq("id", id)
				.single();

			if (fetchError) {
				console.error("[updateMessageStatus] Fetch existing error:", fetchError.message);
				return { success: false, error: "Message not found" };
			}

			const existingReadAt =
				existing && typeof existing.read_at === "string" ? existing.read_at : null;
			updatePayload = {
				status,
				read_at: existingReadAt ?? new Date().toISOString(),
			};
		}

		const { data, error } = await supabase
			.from("contact_submissions")
			.update(updatePayload)
			.eq("id", id)
			.select(MESSAGE_SELECT)
			.single();

		if (error || !data) {
			console.error("[updateMessageStatus] Update error:", error?.message ?? "No data returned");
			return { success: false, error: "Failed to update message status" };
		}

		const parsedMessage = AdminMessageSchema.safeParse(data);
		if (!parsedMessage.success) {
			console.error("[updateMessageStatus] Validation error:", parsedMessage.error.flatten());
			return { success: false, error: "Updated message failed validation" };
		}

		revalidateAdminMessagesPaths();
		return { success: true, data: parsedMessage.data };
	} catch (err: unknown) {
		console.error("[updateMessageStatus] Unexpected error:", err);
		return { success: false, error: "Failed to update message status" };
	}
};

export const markAllMessagesRead = async (): Promise<ActionResult<{ updatedCount: number }>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const { supabase } = auth;
		const nowIso = new Date().toISOString();

		const { data, error } = await supabase
			.from("contact_submissions")
			.update({ status: "read", read_at: nowIso })
			.eq("status", "unread")
			.select("id");

		if (error) {
			console.error("[markAllMessagesRead] Update error:", error.message);
			return { success: false, error: "Failed to mark messages as read" };
		}

		revalidateAdminMessagesPaths();
		return {
			success: true,
			data: { updatedCount: data?.length ?? 0 },
		};
	} catch (err: unknown) {
		console.error("[markAllMessagesRead] Unexpected error:", err);
		return { success: false, error: "Failed to mark messages as read" };
	}
};

export const deleteMessage = async (input: DeleteMessageInput): Promise<ActionResult<void>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) {
			return { success: false, error: auth.error };
		}

		const parsed = DeleteMessageSchema.safeParse(input);
		if (!parsed.success) {
			return { success: false, error: "Invalid message ID" };
		}

		const { supabase } = auth;
		const { error } = await supabase.from("contact_submissions").delete().eq("id", parsed.data.id);

		if (error) {
			console.error("[deleteMessage] Delete error:", error.message);
			return { success: false, error: "Failed to delete message" };
		}

		revalidateAdminMessagesPaths();
		return { success: true, data: undefined };
	} catch (err: unknown) {
		console.error("[deleteMessage] Unexpected error:", err);
		return { success: false, error: "Failed to delete message" };
	}
};
