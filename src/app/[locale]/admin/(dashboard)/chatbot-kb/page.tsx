import { getTranslations } from "next-intl/server";
import React from "react";

import { KnowledgeList } from "@/features/admin/components/knowledge/KnowledgeList";

import type { Metadata } from "next";

interface ChatbotKbPageProps {
	params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ChatbotKbPageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Admin.chatbotKb" });

	return {
		title: `${t("pageTitle")} | Admin Dashboard`,
	};
}

const ChatbotKbPage: React.FC<ChatbotKbPageProps> = async () => {
	const t = await getTranslations("Admin.chatbotKb");

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-white">{t("pageTitle")}</h1>
				<p className="mt-1 text-sm text-neutral-400">{t("pageSubtitle")}</p>
			</div>

			<div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-sm">
				<KnowledgeList />
			</div>
		</div>
	);
};

export default ChatbotKbPage;
