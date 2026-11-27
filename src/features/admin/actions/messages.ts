"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
	AdminMessageSchema,
	DeleteMessageSchema,
	MessagesFilterSchema,
	sanitizeMessageSearch,
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
		const safeSearch = search ? sanitizeMessageSearch(search) : "";
		const orFilter =
			safeSearch.length > 0
				? `name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,message.ilike.%${safeSearch}%`
				: null;

		const fetchMessagePage = (targetPage: number) => {
			const from = (targetPage - 1) * pageSize;
			const to = from + pageSize - 1;
			let query = supabase.from("contact_submissions").select(MESSAGE_SELECT, { count: "exact" });
			if (status !== "all") query = query.eq("status", status);
			if (orFilter) query = query.or(orFilter);
			return query
				.order("created_at", { ascending: false })
				.order("id", { ascending: false })
				.range(from, to);
		};

		const countQuery = () =>
			supabase.from("contact_submissions").select("*", { count: "exact", head: true });

		const [listRes, allRes, ...statusCounts] = await Promise.all([
			fetchMessagePage(page),
			countQuery(),
			...(["unread", "read", "archived"] as const).map((s) => countQuery().eq("status", s)),
		]);

		const [unreadRes, readRes, archivedRes] = statusCounts;
		const countsError = allRes.error || unreadRes.error || readRes.error || archivedRes.error;
		if (countsError) {
			console.error("[getAdminMessages] Counts DB error:", countsError.message);
			return { success: false, error: "Failed to fetch messages" };
		}

		let rawRows = listRes.data;
		let effectivePage = page;
		let totalFiltered = listRes.count ?? rawRows?.length ?? 0;

		if (listRes.error) {
			if (listRes.error.code === "PGRST103" && page > 1) {
				let filteredCountQuery = countQuery();
				if (status !== "all") filteredCountQuery = filteredCountQuery.eq("status", status);
				if (orFilter) filteredCountQuery = filteredCountQuery.or(orFilter);
				const countRes = await filteredCountQuery;
				if (countRes.error) {
					console.error("[getAdminMessages] Count fallback DB error:", countRes.error.message);
					return { success: false, error: "Failed to fetch messages" };
				}

				totalFiltered = countRes.count ?? 0;
				effectivePage = Math.max(1, Math.ceil(totalFiltered / pageSize));
				if (totalFiltered === 0) {
					rawRows = [];
				} else {
					const retryRes = await fetchMessagePage(effectivePage);
					if (retryRes.error) {
						console.error("[getAdminMessages] Clamped retry DB error:", retryRes.error.message);
						return { success: false, error: "Failed to fetch messages" };
					}
					rawRows = retryRes.data;
					totalFiltered = retryRes.count ?? totalFiltered;
				}
			} else {
				console.error("[getAdminMessages] DB error:", listRes.error.message);
				return { success: false, error: "Failed to fetch messages" };
			}
		}

		const parsedRows = z.array(AdminMessageSchema).safeParse(rawRows ?? []);
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

		const pagination: MessagesPageMeta = {
			page: effectivePage,
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
