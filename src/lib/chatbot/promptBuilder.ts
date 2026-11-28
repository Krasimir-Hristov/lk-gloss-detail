import { z } from "zod";

import { getLocalizedText } from "@/features/admin/types/servicesTypes";
import { getOpenRouterEmbeddings } from "@/lib/chatbot/embeddings";
import { createServiceClient } from "@/lib/supabase/service";

import type { PublicService } from "@/features/services/actions/getPublicServices";
import type { AppLocale } from "@/i18n/locales";

const DIRECT_KB_ROW_LIMIT = 25;

const DirectKnowledgeRowSchema = z.object({
	content: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const MatchedKnowledgeRowSchema = z.object({
	content: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional().nullable(),
	similarity: z.number().optional(),
});

interface MatchChatbotDocsRpcClient {
	rpc: (
		fn: "match_chatbot_docs",
		args: {
			query_embedding: number[];
			match_count: number;
			filter_language: string | null;
		},
	) => Promise<{ data: unknown; error: { message: string } | null }>;
}

const formatServicesCatalog = (services: PublicService[], locale: string): string => {
	if (services.length === 0) {
		return "Currently no active services are listed in the database.";
	}

	return services
		.map((s) => {
			const name = getLocalizedText(s.name, locale);
			const desc = getLocalizedText(s.short_description, locale);
			const descPart = desc ? ` — ${desc}` : "";
			return `- ${name}${descPart} | Prices: Small ${s.price_small}€, Medium ${s.price_medium}€, Large ${s.price_large}€, SUV ${s.price_suv}€ | Duration: ~${s.duration_hours}h`;
		})
		.join("\n");
};

export const loadKnowledgeChunks = async (searchQuery: string): Promise<string[]> => {
	const supabase = createServiceClient();
	const { data: directRows, error: directError } = await supabase
		.from("chatbot_knowledge")
		.select("content, metadata")
		.order("created_at", { ascending: false })
		.limit(DIRECT_KB_ROW_LIMIT + 1);

	if (directError) {
		console.error("[chatbot] Direct KB query failed:", directError.message);
		return [];
	}

	const rows = directRows ?? [];
	if (rows.length === 0) return [];

	if (rows.length <= DIRECT_KB_ROW_LIMIT) {
		const parsed = z.array(DirectKnowledgeRowSchema).safeParse(rows);
		if (!parsed.success) return [];
		return parsed.data.map((r) => {
			const title =
				r.metadata && typeof r.metadata.title === "string" ? `${r.metadata.title}: ` : "";
			return `${title}${r.content}`;
		});
	}

	const embeddings = getOpenRouterEmbeddings();
	const queryEmbedding = await embeddings.embedQuery(searchQuery);
	const rpcClient = supabase as unknown as MatchChatbotDocsRpcClient;

	const { data: matchedRows, error: rpcError } = await rpcClient.rpc("match_chatbot_docs", {
		query_embedding: queryEmbedding,
		match_count: 10,
		filter_language: null,
	});

	if (rpcError) {
		console.error("[chatbot] match_chatbot_docs RPC failed:", rpcError.message);
		return [];
	}

	const parsedMatches = z.array(MatchedKnowledgeRowSchema).safeParse(matchedRows ?? []);
	if (!parsedMatches.success) return [];
	return parsedMatches.data.map((m) => {
		const title = m.metadata && typeof m.metadata.title === "string" ? `${m.metadata.title}: ` : "";
		return `${title}${m.content}`;
	});
};

export interface ChatbotLinkLabels {
	services: string;
	booking: string;
	assessment: string;
	contact: string;
}

export const buildChatbotSystemPrompt = (
	locale: AppLocale,
	services: PublicService[],
	knowledgeChunks: string[],
	links: ChatbotLinkLabels,
): string => {
	const localeInstructions: Record<AppLocale, string> = {
		de: "Antworte IMMER ausschließlich auf Deutsch. Sei freundlich, professionell und prägnant.",
		en: "ALWAYS respond exclusively in English. Be friendly, professional, and concise.",
		el: "Πάντα να απαντάς αποκλειστικά στα Ελληνικά. Να είσαι φιλικός, επαγγελματίας και σύντομος.",
		sq: "Përgjigju GJITHMONË ekskluzivisht në shqip. Ji miqësor, profesional dhe i përmbledhur.",
		tr: "HER ZAMAN yalnızca Türkçe yanıt ver. Nazik, profesyonel ve özlü ol.",
	};

	const servicesSection = formatServicesCatalog(services, locale);
	const kbSection =
		knowledgeChunks.length > 0
			? knowledgeChunks.map((chunk, idx) => `[${idx + 1}] ${chunk}`).join("\n")
			: "No additional knowledge base entries found.";

	return `You are Lulezim Kodhimaj AI, the virtual assistant of LK Gloss & Detail, a mobile car detailing service in Germany (Neuhausen auf den Fildern).

${localeInstructions[locale]}

Note: Knowledge base entries below may be written in any language. Always understand their meaning and reply naturally in the active website language (${locale}).

LIVE ACTIVE SERVICES & PRICING (Authoritative Source of Truth):
${servicesSection}

KNOWLEDGE BASE (Policies, FAQs & Mobile Service Info):
${kbSection}

STRICT RULES:
1. Keep answers concise, honest, and helpful (typically 2-4 sentences).
2. NEVER invent services, packages, or prices. Use ONLY the live services and knowledge base above.
3. Use these exact localized Markdown links when guiding the user:
   - [${links.services}](/${locale}#services)
   - [${links.booking}](/${locale}/booking)
   - [${links.assessment}](/${locale}/assessment)
   - [${links.contact}](/${locale}#contact)
4. For B2B or fleet inquiries, direct the user to [${links.contact}](/${locale}#contact).`;
};
