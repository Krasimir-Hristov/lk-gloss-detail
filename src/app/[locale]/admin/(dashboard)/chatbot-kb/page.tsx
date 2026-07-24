import { getTranslations } from "next-intl/server";

import { KnowledgeList } from "@/features/admin/components/knowledge/KnowledgeList";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Chatbot Knowledge Base | Admin Dashboard",
};

export default async function ChatbotKbPage() {
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
}
