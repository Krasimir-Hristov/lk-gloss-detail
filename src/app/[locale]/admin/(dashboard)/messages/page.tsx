import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

import { getAdminMessages } from "@/features/admin/actions/messages";
import { MessagesManager } from "@/features/admin/components/messages/MessagesManager";
import {
	DEFAULT_MESSAGES_PAGE_SIZE,
	MessageStatusSchema,
	type MessageStatus,
} from "@/features/admin/schemas/messagesSchema";
import { getCachedAdminSession } from "@/lib/auth/requireAdmin";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface MessagesPageProps {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ status?: string }>;
}

export const generateMetadata = async ({ params }: MessagesPageProps): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Metadata" });
	const tMessages = await getTranslations({ locale, namespace: "Admin.messages" });
	return {
		title: t("template").replace("%s", tMessages("title")),
	};
};

const AdminMessagesPage: React.FC<MessagesPageProps> = async ({ params, searchParams }) => {
	const [{ locale }, resolvedSearch] = await Promise.all([params, searchParams]);
	const session = await getCachedAdminSession();

	if (!session) {
		redirect(`/${locale}/admin/login`);
	}

	const parsedStatus = MessageStatusSchema.safeParse(resolvedSearch.status);
	const initialStatus: MessageStatus | "all" = parsedStatus.success ? parsedStatus.data : "all";

	const res = await getAdminMessages({
		status: initialStatus,
		page: 1,
		pageSize: DEFAULT_MESSAGES_PAGE_SIZE,
	});

	const initialMessages = res.success ? res.data.messages : [];
	const initialCounts = res.success ? res.data.counts : { all: 0, unread: 0, read: 0, archived: 0 };
	const initialPagination = res.success
		? res.data.pagination
		: { page: 1, pageSize: DEFAULT_MESSAGES_PAGE_SIZE, totalFiltered: 0, totalPages: 1 };
	const initialError = res.success ? null : (res.error ?? "Failed to load messages");

	return (
		<MessagesManager
			initialMessages={initialMessages}
			initialCounts={initialCounts}
			initialPagination={initialPagination}
			initialStatus={initialStatus}
			initialError={initialError}
		/>
	);
};

export default AdminMessagesPage;
