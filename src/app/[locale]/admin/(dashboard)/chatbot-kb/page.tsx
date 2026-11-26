import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

import { getKnowledgeEntriesAction } from "@/features/admin/actions/knowledge";
import { KnowledgeList } from "@/features/admin/components/knowledge/KnowledgeList";
import { getCachedAdminSession } from "@/lib/auth/requireAdmin";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ChatbotKbPageProps {
	params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: ChatbotKbPageProps): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Metadata" });
	const tKb = await getTranslations({ locale, namespace: "Admin.chatbotKb" });

	return {
		title: t("template").replace("%s", tKb("pageTitle")),
	};
};

const ChatbotKbPage: React.FC<ChatbotKbPageProps> = async ({ params }) => {
	const { locale } = await params;
	const session = await getCachedAdminSession();

	if (!session) {
		redirect(`/${locale}/admin/login`);
	}

	const [t, res] = await Promise.all([
		getTranslations("Admin.chatbotKb"),
		getKnowledgeEntriesAction(),
	]);

	const initialEntries = res.success && res.data ? res.data : [];
	const initialError = res.success ? null : (res.error ?? t("loadError"));

	return (
		<div className="space-y-6">
			<div>
				<h1 className="Montserrat text-3xl font-extrabold tracking-tight text-white">
					{t("pageTitle")}
				</h1>
				<p className="mt-1 text-sm text-neutral-400">{t("pageSubtitle")}</p>
			</div>

			<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm sm:p-6">
				<KnowledgeList initialEntries={initialEntries} initialError={initialError} />
			</div>
		</div>
	);
};

export default ChatbotKbPage;
