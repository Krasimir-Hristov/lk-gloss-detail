import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	deleteKnowledgeEntryAction,
	getKnowledgeEntriesAction,
	saveKnowledgeEntryAction,
	testSemanticSearchAction,
} from "@/features/admin/actions/knowledge";

import type {
	ChatbotKnowledgeListItem,
	VectorSearchResult,
} from "@/features/admin/types/knowledge";

interface KnowledgeSelectChain extends PromiseLike<{
	data: ChatbotKnowledgeListItem[];
	error: null;
}> {
	order: (col: string, opts?: { ascending?: boolean }) => KnowledgeSelectChain;
	contains: (col: string, value: Record<string, unknown>) => KnowledgeSelectChain;
	eq: (col: string, value: string) => KnowledgeSelectChain;
}

const ENTRY_ID = "123e4567-e89b-12d3-a456-426614174000";
const MOCK_EMBEDDING = [0.12, -0.34, 0.56];

const {
	mockRevalidatePath,
	mockRequireAdmin,
	mockEmbedQuery,
	mockEmbedDocuments,
	mockLlmInvoke,
	mockSelectColumns,
	mockContainsCalls,
	mockInsertPayloads,
	mockUpdatePayloads,
	mockUpdateEqCalls,
	mockDeleteEqCalls,
	mockRpcCalls,
	mockState,
} = vi.hoisted(() => ({
	mockRevalidatePath: vi.fn(),
	mockRequireAdmin: vi.fn(),
	mockEmbedQuery: vi.fn(),
	mockEmbedDocuments: vi.fn(),
	mockLlmInvoke: vi.fn(),
	mockSelectColumns: [] as string[],
	mockContainsCalls: [] as Array<[string, Record<string, unknown>]>,
	mockInsertPayloads: [] as Array<Record<string, unknown>>,
	mockUpdatePayloads: [] as Array<Record<string, unknown>>,
	mockUpdateEqCalls: [] as Array<[string, string]>,
	mockDeleteEqCalls: [] as Array<[string, string]>,
	mockRpcCalls: [] as Array<[string, Record<string, unknown>]>,
	mockState: {
		entries: [] as ChatbotKnowledgeListItem[],
		searchResults: [] as VectorSearchResult[],
	},
}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/chatbot/embeddings", () => ({
	getOpenRouterEmbeddings: vi.fn(() => ({
		embedQuery: mockEmbedQuery,
		embedDocuments: mockEmbedDocuments,
	})),
}));

vi.mock("@langchain/openai", () => {
	class MockChatOpenAI {
		invoke = mockLlmInvoke;
		withStructuredOutput() {
			return { invoke: mockLlmInvoke };
		}
	}
	return { ChatOpenAI: MockChatOpenAI };
});

const createMockSupabase = () => ({
	rpc: vi.fn(async (fnName: string, params: Record<string, unknown>) => {
		mockRpcCalls.push([fnName, params]);
		return { data: mockState.searchResults, error: null };
	}),
	from: vi.fn((_table: string) => ({
		select: vi.fn((columns: string) => {
			mockSelectColumns.push(columns);
			let rows = [...mockState.entries];
			const chain: KnowledgeSelectChain = {
				order() {
					return chain;
				},
				contains(col: string, value: Record<string, unknown>) {
					mockContainsCalls.push([col, value]);
					const cat = value.category;
					if (typeof cat === "string") {
						rows = rows.filter((row) => row.metadata.category === cat);
					}
					return chain;
				},
				eq() {
					return chain;
				},
				then(onfulfilled, onrejected) {
					return Promise.resolve({ data: rows, error: null }).then(onfulfilled, onrejected);
				},
			};
			return chain;
		}),
		insert: vi.fn((payload: Record<string, unknown>) => {
			mockInsertPayloads.push(payload);
			const created: ChatbotKnowledgeListItem = {
				id: ENTRY_ID,
				content: String(payload.content ?? ""),
				metadata: (payload.metadata as ChatbotKnowledgeListItem["metadata"]) ?? {
					category: "general",
				},
				language: String(payload.language ?? "any"),
				created_at: "2026-11-26T10:00:00.000Z",
			};
			return {
				select: () => ({ single: async () => ({ data: created, error: null }) }),
				then: (
					onfulfilled?: (val: { data: ChatbotKnowledgeListItem; error: null }) => unknown,
					onrejected?: (r: unknown) => unknown,
				) => Promise.resolve({ data: created, error: null }).then(onfulfilled, onrejected),
			};
		}),
		update: vi.fn((payload: Record<string, unknown>) => {
			mockUpdatePayloads.push(payload);
			return {
				eq: vi.fn((col: string, val: string) => {
					mockUpdateEqCalls.push([col, val]);
					const updated: ChatbotKnowledgeListItem = {
						id: val,
						content: String(payload.content ?? ""),
						metadata: (payload.metadata as ChatbotKnowledgeListItem["metadata"]) ?? {
							category: "general",
						},
						language: String(payload.language ?? "any"),
						created_at: "2026-11-26T10:00:00.000Z",
					};
					return {
						select: () => ({ single: async () => ({ data: updated, error: null }) }),
						then: (
							onfulfilled?: (val: { data: ChatbotKnowledgeListItem; error: null }) => unknown,
							onrejected?: (r: unknown) => unknown,
						) => Promise.resolve({ data: updated, error: null }).then(onfulfilled, onrejected),
					};
				}),
			};
		}),
		delete: vi.fn(() => ({
			eq: vi.fn(async (col: string, val: string) => {
				mockDeleteEqCalls.push([col, val]);
				return { error: null };
			}),
		})),
	})),
});

vi.mock("@/lib/auth/requireAdmin", () => ({
	requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: vi.fn(() => createMockSupabase()),
}));

describe("Admin Knowledge Single-Language Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSelectColumns.length = 0;
		mockContainsCalls.length = 0;
		mockInsertPayloads.length = 0;
		mockUpdatePayloads.length = 0;
		mockUpdateEqCalls.length = 0;
		mockDeleteEqCalls.length = 0;
		mockRpcCalls.length = 0;

		mockEmbedQuery.mockResolvedValue(MOCK_EMBEDDING);
		mockState.entries = [
			{
				id: ENTRY_ID,
				content: "We are open Monday through Saturday from 08:00 to 18:00.",
				metadata: { category: "company_policy", title: "Opening Hours", keywords: ["hours"] },
				language: "any",
				created_at: "2026-11-26T10:00:00.000Z",
			},
		];
		mockState.searchResults = [
			{
				id: ENTRY_ID,
				content: "We are open Monday through Saturday from 08:00 to 18:00.",
				metadata: { category: "company_policy", title: "Opening Hours" },
				language: "any",
				similarity: 0.91,
			},
		];

		mockRequireAdmin.mockResolvedValue({
			authorized: true,
			user: { id: "admin-1" },
			supabase: createMockSupabase(),
		});
	});

	it("denies all knowledge actions when requireAdmin rejects authorization", async () => {
		mockRequireAdmin.mockResolvedValue({ authorized: false, error: "Unauthorized" });

		const listRes = await getKnowledgeEntriesAction();
		const saveRes = await saveKnowledgeEntryAction({
			title: "Opening Hours",
			content: "We are open Monday through Saturday from 08:00 to 18:00.",
			category: "company_policy",
			keywords: ["hours"],
		});
		const delRes = await deleteKnowledgeEntryAction(ENTRY_ID);
		const searchRes = await testSemanticSearchAction("hours");

		expect(listRes.success).toBe(false);
		expect(saveRes.success).toBe(false);
		expect(delRes.success).toBe(false);
		expect(searchRes.success).toBe(false);
		expect(mockEmbedQuery).not.toHaveBeenCalled();
		expect(mockLlmInvoke).not.toHaveBeenCalled();
	});

	it("excludes embedding column in getKnowledgeEntriesAction and supports category filtering", async () => {
		const res = await getKnowledgeEntriesAction("company_policy");

		expect(res.success).toBe(true);
		expect(mockSelectColumns.length).toBeGreaterThan(0);
		for (const cols of mockSelectColumns) {
			expect(cols).not.toBe("*");
			expect(cols.toLowerCase()).not.toContain("embedding");
		}
		expect(mockContainsCalls).toContainEqual(["metadata", { category: "company_policy" }]);
		if (res.success && res.data) {
			expect(res.data).toHaveLength(1);
			expect("embedding" in res.data[0]).toBe(false);
		}
	});

	it("saves a single language: 'any' entry with 1 embedQuery and 0 LLM translation calls", async () => {
		const createRes = await saveKnowledgeEntryAction({
			title: "Mobile Detailing Radius",
			content: "We offer mobile car detailing within 25km of Munich.",
			category: "mobile_service",
			keywords: ["mobile", "munich"],
		});

		expect(createRes.success).toBe(true);
		expect(mockEmbedQuery).toHaveBeenCalledTimes(1);
		expect(mockEmbedDocuments).not.toHaveBeenCalled();
		expect(mockLlmInvoke).not.toHaveBeenCalled();
		expect(mockInsertPayloads).toHaveLength(1);
		expect(mockInsertPayloads[0]).toMatchObject({
			language: "any",
			embedding: MOCK_EMBEDDING,
			metadata: {
				category: "mobile_service",
				title: "Mobile Detailing Radius",
				keywords: ["mobile", "munich"],
			},
		});

		vi.clearAllMocks();
		mockRequireAdmin.mockResolvedValue({
			authorized: true,
			user: { id: "admin-1" },
			supabase: createMockSupabase(),
		});
		mockEmbedQuery.mockResolvedValue(MOCK_EMBEDDING);

		const updateRes = await saveKnowledgeEntryAction({
			id: ENTRY_ID,
			title: "Updated Hours",
			content: "Updated opening hours for Saturday appointments.",
			category: "company_policy",
			keywords: ["saturday"],
		});

		expect(updateRes.success).toBe(true);
		expect(mockEmbedQuery).toHaveBeenCalledTimes(1);
		expect(mockLlmInvoke).not.toHaveBeenCalled();
		expect(mockUpdatePayloads).toHaveLength(1);
		expect(mockUpdatePayloads[0]?.language).toBe("any");
		expect(mockUpdateEqCalls).toContainEqual(["id", ENTRY_ID]);
	});

	it("deletes knowledge entry by valid UUID", async () => {
		const invalidRes = await deleteKnowledgeEntryAction("not-a-uuid");
		expect(invalidRes.success).toBe(false);
		expect(mockDeleteEqCalls).toHaveLength(0);

		const validRes = await deleteKnowledgeEntryAction(ENTRY_ID);
		expect(validRes.success).toBe(true);
		expect(mockDeleteEqCalls).toContainEqual(["id", ENTRY_ID]);
	});

	it("invokes match_chatbot_docs RPC with filter_language: null in testSemanticSearchAction", async () => {
		const res = await testSemanticSearchAction("Wann haben Sie geöffnet?");

		expect(res.success).toBe(true);
		expect(mockEmbedQuery).toHaveBeenCalledTimes(1);
		expect(mockEmbedQuery).toHaveBeenCalledWith("Wann haben Sie geöffnet?");
		expect(mockRpcCalls).toEqual([
			[
				"match_chatbot_docs",
				{ query_embedding: MOCK_EMBEDDING, match_count: 10, filter_language: null },
			],
		]);
		if (res.success) {
			expect(res.data).toHaveLength(1);
		}
	});
});
