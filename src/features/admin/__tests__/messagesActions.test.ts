import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	deleteMessage,
	getAdminMessages,
	markAllMessagesRead,
	updateMessageStatus,
} from "@/features/admin/actions/messages";

interface AdminMessage {
	id: string;
	name: string;
	email: string;
	phone: string;
	message: string;
	status: "unread" | "read" | "archived";
	read_at: string | null;
	created_at: string;
}

interface QueryError {
	code?: string;
	message: string;
}

interface QueryBuilder extends PromiseLike<{
	data: AdminMessage[] | null;
	count: number | null;
	error: QueryError | null;
}> {
	order: (column: string, opts?: { ascending?: boolean }) => QueryBuilder;
	eq: (column: string, value: string) => QueryBuilder;
	or: (filter: string) => QueryBuilder;
	range: (from: number, to: number) => QueryBuilder;
	single: () => Promise<{ data: AdminMessage | null; error: QueryError | null }>;
}

const VALID_ID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_ID_2 = "223e4567-e89b-12d3-a456-426614174000";
const VALID_ID_3 = "323e4567-e89b-12d3-a456-426614174000";
const VALID_ID_4 = "423e4567-e89b-12d3-a456-426614174000";

const makeMsg = (overrides: Partial<AdminMessage> & { id: string }): AdminMessage => ({
	name: "Max Mustermann",
	email: "max@example.com",
	phone: "+4915111111111",
	message: "Detailing inquiry",
	status: "unread",
	read_at: null,
	created_at: "2026-11-26T10:00:00.000Z",
	...overrides,
});

const {
	mockRevalidatePath,
	mockRequireAdmin,
	mockState,
	mockOrderCalls,
	mockOrFilters,
	mockUpdatePayloads,
	mockUpdateEqCalls,
	mockDeleteEqCalls,
} = vi.hoisted(() => ({
	mockRevalidatePath: vi.fn(),
	mockRequireAdmin: vi.fn(),
	mockState: { rows: [] as AdminMessage[], forcedListError: null as QueryError | null },
	mockOrderCalls: [] as Array<[string, boolean]>,
	mockOrFilters: [] as string[],
	mockUpdatePayloads: [] as Array<Record<string, unknown>>,
	mockUpdateEqCalls: [] as Array<[string, string]>,
	mockDeleteEqCalls: [] as Array<[string, string]>,
}));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const createMockSupabase = () => ({
	from: vi.fn(() => ({
		select: vi.fn((_cols?: string, opts?: { head?: boolean; count?: string }) => {
			const filters: Array<{ col: string; val: string }> = [];
			let orTerm: string | null = null;
			let pendingRange: { from: number; to: number } | null = null;
			const sorts: Array<{ column: keyof AdminMessage; ascending: boolean }> = [];

			const computeRows = (): AdminMessage[] => {
				let rows = [...mockState.rows];
				for (const f of filters)
					rows = rows.filter((r) => String(r[f.col as keyof AdminMessage]) === f.val);
				if (orTerm) {
					const needle = orTerm.toLowerCase();
					rows = rows.filter((r) =>
						[r.name, r.email, r.phone, r.message].some((v) => v.toLowerCase().includes(needle)),
					);
				}
				if (sorts.length > 0) {
					rows.sort((a, b) => {
						for (const s of sorts) {
							const cmp = String(a[s.column] ?? "").localeCompare(String(b[s.column] ?? ""));
							if (cmp !== 0) return s.ascending ? cmp : -cmp;
						}
						return 0;
					});
				}
				return rows;
			};

			const builder: QueryBuilder = {
				order(column, orderOpts) {
					const asc = orderOpts?.ascending ?? true;
					sorts.push({ column: column as keyof AdminMessage, ascending: asc });
					if (!opts?.head) mockOrderCalls.push([column, asc]);
					return builder;
				},
				eq(col, val) {
					filters.push({ col, val });
					return builder;
				},
				or(filter) {
					mockOrFilters.push(filter);
					const match = filter.match(/name\.ilike\.%([^,]*)%,email\.ilike\./);
					if (match?.[1]) orTerm = match[1].replace(/\\([%_])/g, "$1");
					return builder;
				},
				range(from, to) {
					pendingRange = { from, to };
					return builder;
				},
				single: async () => {
					const matched = computeRows();
					return { data: matched[0] ?? null, error: matched[0] ? null : { message: "Not found" } };
				},
				then(onfulfilled, onrejected) {
					if (!opts?.head && mockState.forcedListError) {
						return Promise.resolve({
							data: null,
							count: null,
							error: mockState.forcedListError,
						}).then(onfulfilled, onrejected);
					}
					const filtered = computeRows();
					const totalMatched = filtered.length;
					if (
						pendingRange &&
						!opts?.head &&
						pendingRange.from > 0 &&
						pendingRange.from >= totalMatched
					) {
						return Promise.resolve({
							data: null,
							count: null,
							error: { code: "PGRST103", message: "Requested range not satisfiable" },
						}).then(onfulfilled, onrejected);
					}
					const sliced = pendingRange
						? filtered.slice(pendingRange.from, pendingRange.to + 1)
						: filtered;
					const res = opts?.head
						? { data: null, count: totalMatched, error: null }
						: { data: sliced, count: totalMatched, error: null };
					return Promise.resolve(res).then(onfulfilled, onrejected);
				},
			};
			return builder;
		}),
		update: vi.fn((payload: Record<string, unknown>) => {
			mockUpdatePayloads.push(payload);
			const updatedRow = makeMsg({
				...(mockState.rows[0] ?? { id: VALID_ID }),
				status: (payload.status as AdminMessage["status"] | undefined) ?? "read",
				read_at: (payload.read_at as string | null | undefined) ?? null,
			});
			const upd = {
				eq(col: string, val: string) {
					mockUpdateEqCalls.push([col, val]);
					return upd;
				},
				select: () => ({
					single: async () => ({ data: updatedRow, error: null }),
					then: (onfulfilled: (v: { data: AdminMessage[]; error: null }) => unknown) =>
						Promise.resolve({ data: [updatedRow], error: null }).then(onfulfilled),
				}),
			};
			return upd;
		}),
		delete: vi.fn(() => ({
			eq: vi.fn(async (col: string, val: string) => {
				mockDeleteEqCalls.push([col, val]);
				return { error: null };
			}),
		})),
	})),
});

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: mockRequireAdmin }));
vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: vi.fn(() => createMockSupabase()),
}));

describe("Admin Messages Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOrderCalls.length = 0;
		mockOrFilters.length = 0;
		mockUpdatePayloads.length = 0;
		mockUpdateEqCalls.length = 0;
		mockDeleteEqCalls.length = 0;
		mockState.forcedListError = null;
		mockState.rows = [
			makeMsg({ id: VALID_ID, email: "john_doe@example.com", created_at: "2026-11-26T10:00:00Z" }),
			makeMsg({
				id: VALID_ID_2,
				name: "Erika",
				status: "read",
				read_at: "2026-11-26T09:00:00Z",
				created_at: "2026-11-26T08:00:00Z",
			}),
		];
		mockRequireAdmin.mockResolvedValue({
			authorized: true,
			user: { id: "admin-1" },
			supabase: createMockSupabase(),
		});
	});

	it("denies all message actions when requireAdmin rejects authorization", async () => {
		mockRequireAdmin.mockResolvedValue({ authorized: false, error: "Unauthorized" });
		const results = await Promise.all([
			getAdminMessages(),
			updateMessageStatus({ id: VALID_ID, status: "read" }),
			markAllMessagesRead(),
			deleteMessage({ id: VALID_ID }),
		]);
		expect(results.map((r) => r.success)).toEqual([false, false, false, false]);
		expect(mockUpdatePayloads).toHaveLength(0);
		expect(mockDeleteEqCalls).toHaveLength(0);
	});

	describe("getAdminMessages()", () => {
		it("applies secondary unique id sort and paginates filtered second pages cleanly", async () => {
			mockState.rows = [
				makeMsg({ id: VALID_ID, created_at: "2026-11-26T10:00:00Z" }),
				makeMsg({ id: VALID_ID_3, created_at: "2026-11-26T10:00:00Z" }),
				makeMsg({ id: VALID_ID_4, created_at: "2026-11-26T09:00:00Z" }),
				makeMsg({ id: VALID_ID_2, status: "read", created_at: "2026-11-26T11:00:00Z" }),
			];
			const page2Res = await getAdminMessages({ status: "unread", page: 2, pageSize: 2 });
			expect(page2Res.success).toBe(true);
			if (page2Res.success) {
				expect(page2Res.data.messages.map((m) => m.id)).toEqual([VALID_ID_4]);
				expect(page2Res.data.pagination).toEqual({
					page: 2,
					pageSize: 2,
					totalFiltered: 3,
					totalPages: 2,
				});
				expect(page2Res.data.counts).toEqual({ all: 4, unread: 3, read: 1, archived: 0 });
			}
			expect(mockOrderCalls.slice(0, 2)).toEqual([
				["created_at", false],
				["id", false],
			]);
		});

		it("recovers from PGRST103 out-of-range page and preserves non-PGRST103 errors", async () => {
			const clamped = await getAdminMessages({ status: "all", page: 2, pageSize: 2 });
			expect(clamped.success).toBe(true);
			if (clamped.success) {
				expect(clamped.data.pagination.page).toBe(1);
				expect(clamped.data.messages).toHaveLength(2);
			}
			mockState.forcedListError = { code: "42P01", message: "Relation missing" };
			expect((await getAdminMessages({ status: "all", page: 2, pageSize: 2 })).success).toBe(false);
		});

		it("preserves literal underscores in email search while stripping PostgREST grammar chars", async () => {
			const res = await getAdminMessages({ search: "john_doe@example.com,()" });
			expect(res.success).toBe(true);
			if (res.success) expect(res.data.messages.map((m) => m.id)).toEqual([VALID_ID]);
			expect(mockOrFilters[0]).toContain("john\\_doe@example.com");
			expect((await getAdminMessages({ search: "x".repeat(201) })).success).toBe(false);
		});
	});

	it("validates and executes status updates, mark-all-read, and deletions", async () => {
		expect((await updateMessageStatus({ id: "bad", status: "read" })).success).toBe(false);
		expect((await updateMessageStatus({ id: VALID_ID, status: "read" })).success).toBe(true);
		expect(mockUpdatePayloads[0]?.status).toBe("read");
		expect(typeof mockUpdatePayloads[0]?.read_at).toBe("string");
		expect(mockUpdateEqCalls).toContainEqual(["id", VALID_ID]);

		expect((await markAllMessagesRead()).success).toBe(true);
		expect(mockUpdateEqCalls).toContainEqual(["status", "unread"]);

		expect((await deleteMessage({ id: "invalid" })).success).toBe(false);
		expect((await deleteMessage({ id: VALID_ID })).success).toBe(true);
		expect(mockDeleteEqCalls).toContainEqual(["id", VALID_ID]);
		expect(mockRevalidatePath).toHaveBeenCalled();
	});
});
