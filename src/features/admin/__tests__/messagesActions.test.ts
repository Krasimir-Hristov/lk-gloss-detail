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

interface QueryBuilder extends PromiseLike<{
	data: AdminMessage[] | null;
	count?: number;
	error: null;
}> {
	order: (column: string, opts?: { ascending?: boolean }) => QueryBuilder;
	eq: (column: string, value: string) => QueryBuilder;
	or: (filter: string) => QueryBuilder;
	ilike: (column: string, pattern: string) => QueryBuilder;
	limit: (count: number) => QueryBuilder;
	single: () => Promise<{ data: AdminMessage | null; error: { message: string } | null }>;
}

interface UpdateBuilder extends PromiseLike<{ data: AdminMessage | null; error: null }> {
	eq: (column: string, value: string) => UpdateBuilder;
	select: (cols?: string) => {
		single: () => Promise<{ data: AdminMessage; error: null }>;
		maybeSingle: () => Promise<{ data: AdminMessage | null; error: null }>;
		then: PromiseLike<{ data: AdminMessage[]; error: null }>["then"];
	};
}

const VALID_ID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_ID_2 = "223e4567-e89b-12d3-a456-426614174000";

const {
	mockRevalidatePath,
	mockRequireAdmin,
	mockState,
	mockUpdatePayloads,
	mockUpdateEqCalls,
	mockDeleteEqCalls,
} = vi.hoisted(() => ({
	mockRevalidatePath: vi.fn(),
	mockRequireAdmin: vi.fn(),
	mockState: { rows: [] as AdminMessage[] },
	mockUpdatePayloads: [] as Array<Record<string, unknown>>,
	mockUpdateEqCalls: [] as Array<[string, string]>,
	mockDeleteEqCalls: [] as Array<[string, string]>,
}));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

const createMockSupabase = () => ({
	from: vi.fn((_table: string) => ({
		select: vi.fn((_cols?: string, opts?: { head?: boolean; count?: string }) => {
			let rows = [...mockState.rows];
			const builder: QueryBuilder = {
				order: () => builder,
				eq(column: string, value: string) {
					rows = rows.filter((row) => String(row[column as keyof AdminMessage]) === value);
					return builder;
				},
				or(filter: string) {
					const match = filter.match(/%([^%]+)%/);
					if (match?.[1]) {
						const term = match[1].toLowerCase();
						rows = rows.filter(
							(r) =>
								r.name.toLowerCase().includes(term) ||
								r.email.toLowerCase().includes(term) ||
								r.message.toLowerCase().includes(term),
						);
					}
					return builder;
				},
				ilike(column: string, pattern: string) {
					const term = pattern.replace(/%/g, "").toLowerCase();
					rows = rows.filter((r) =>
						String(r[column as keyof AdminMessage])
							.toLowerCase()
							.includes(term),
					);
					return builder;
				},
				limit(count: number) {
					rows = rows.slice(0, count);
					return builder;
				},
				single: async () => ({
					data: rows[0] ?? null,
					error: rows[0] ? null : { message: "Not found" },
				}),
				then(onfulfilled, onrejected) {
					const result = opts?.head
						? { data: null, count: rows.length, error: null }
						: { data: rows, count: rows.length, error: null };
					return Promise.resolve(result).then(onfulfilled, onrejected);
				},
			};
			return builder;
		}),
		update: vi.fn((payload: Record<string, unknown>) => {
			mockUpdatePayloads.push(payload);
			const updatedRow: AdminMessage = {
				...(mockState.rows[0] ?? {
					id: VALID_ID,
					name: "Max",
					email: "max@example.com",
					phone: "+491234567",
					message: "Hello",
					status: "unread",
					read_at: null,
					created_at: "2026-11-26T10:00:00Z",
				}),
				status: (payload.status as AdminMessage["status"] | undefined) ?? "read",
				read_at: (payload.read_at as string | null | undefined) ?? null,
			};
			const updateBuilder: UpdateBuilder = {
				eq(column: string, value: string) {
					mockUpdateEqCalls.push([column, value]);
					return updateBuilder;
				},
				select: () => ({
					single: async () => ({ data: updatedRow, error: null }),
					maybeSingle: async () => ({ data: updatedRow, error: null }),
					then(onfulfilled, onrejected) {
						return Promise.resolve({ data: [updatedRow], error: null }).then(
							onfulfilled,
							onrejected,
						);
					},
				}),
				then(onfulfilled, onrejected) {
					return Promise.resolve({ data: updatedRow, error: null }).then(onfulfilled, onrejected);
				},
			};
			return updateBuilder;
		}),
		delete: vi.fn(() => ({
			eq: vi.fn(async (column: string, value: string) => {
				mockDeleteEqCalls.push([column, value]);
				return { error: null };
			}),
		})),
	})),
});

vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: mockRequireAdmin }));
vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: vi.fn(() => createMockSupabase()),
}));

const extractMessages = (data: unknown): AdminMessage[] => {
	if (Array.isArray(data)) return data as AdminMessage[];
	if (typeof data === "object" && data !== null && "messages" in data) {
		const container = data as { messages?: unknown };
		if (Array.isArray(container.messages)) return container.messages as AdminMessage[];
	}
	return [];
};

describe("Admin Messages Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdatePayloads.length = 0;
		mockUpdateEqCalls.length = 0;
		mockDeleteEqCalls.length = 0;
		mockState.rows = [
			{
				id: VALID_ID,
				name: "Max Mustermann",
				email: "max@example.com",
				phone: "+4915111111111",
				message: "Ceramic coating quote",
				status: "unread",
				read_at: null,
				created_at: "2026-11-26T10:00:00.000Z",
			},
			{
				id: VALID_ID_2,
				name: "Erika Musterfrau",
				email: "erika@example.com",
				phone: "+4915222222222",
				message: "Interior cleaning question",
				status: "read",
				read_at: "2026-11-26T09:00:00.000Z",
				created_at: "2026-11-26T08:00:00.000Z",
			},
		];
		mockRequireAdmin.mockResolvedValue({
			authorized: true,
			user: { id: "admin-1" },
			supabase: createMockSupabase(),
		});
	});

	it("denies all message actions when requireAdmin rejects authorization", async () => {
		mockRequireAdmin.mockResolvedValue({ authorized: false, error: "Unauthorized" });

		const listRes = await getAdminMessages();
		const statusRes = await updateMessageStatus({ id: VALID_ID, status: "read" });
		const markAllRes = await markAllMessagesRead();
		const deleteRes = await deleteMessage({ id: VALID_ID });

		expect(listRes.success).toBe(false);
		expect(statusRes.success).toBe(false);
		expect(markAllRes.success).toBe(false);
		expect(deleteRes.success).toBe(false);
		expect(mockUpdatePayloads).toHaveLength(0);
		expect(mockDeleteEqCalls).toHaveLength(0);
	});

	describe("getAdminMessages()", () => {
		it("returns messages and supports status filtering", async () => {
			const allRes = await getAdminMessages({ status: "all" });
			expect(allRes.success).toBe(true);
			if (allRes.success) expect(extractMessages(allRes.data)).toHaveLength(2);

			const unreadRes = await getAdminMessages({ status: "unread" });
			expect(unreadRes.success).toBe(true);
			if (unreadRes.success) {
				const unread = extractMessages(unreadRes.data);
				expect(unread).toHaveLength(1);
				expect(unread[0]?.id).toBe(VALID_ID);
			}
		});

		it("rejects invalid filter inputs via Zod validation", async () => {
			const res = await getAdminMessages({ search: "x".repeat(201) });
			expect(res.success).toBe(false);
		});
	});

	describe("updateMessageStatus()", () => {
		it("rejects invalid UUID or unsupported status via Zod", async () => {
			const badId = await updateMessageStatus({ id: "not-a-uuid", status: "read" });
			const badStatus = await updateMessageStatus({
				id: VALID_ID,
				status: "deleted" as unknown as "read",
			});
			expect(badId.success).toBe(false);
			expect(badStatus.success).toBe(false);
			expect(mockUpdatePayloads).toHaveLength(0);
		});

		it("sets read_at timestamp when marking as read and revalidates admin paths", async () => {
			const res = await updateMessageStatus({ id: VALID_ID, status: "read" });
			expect(res.success).toBe(true);
			expect(mockUpdatePayloads).toHaveLength(1);
			expect(mockUpdatePayloads[0]?.status).toBe("read");
			expect(typeof mockUpdatePayloads[0]?.read_at).toBe("string");
			expect(mockUpdateEqCalls).toContainEqual(["id", VALID_ID]);
			expect(mockRevalidatePath).toHaveBeenCalled();
		});

		it("updates status to archived or unread cleanly", async () => {
			const archiveRes = await updateMessageStatus({ id: VALID_ID, status: "archived" });
			expect(archiveRes.success).toBe(true);
			expect(mockUpdatePayloads[0]?.status).toBe("archived");

			const unreadRes = await updateMessageStatus({ id: VALID_ID_2, status: "unread" });
			expect(unreadRes.success).toBe(true);
			expect(mockUpdatePayloads[1]?.status).toBe("unread");
		});
	});

	describe("markAllMessagesRead()", () => {
		it("marks all unread messages as read with read_at and revalidates paths", async () => {
			const res = await markAllMessagesRead();
			expect(res.success).toBe(true);
			expect(mockUpdatePayloads).toHaveLength(1);
			expect(mockUpdatePayloads[0]?.status).toBe("read");
			expect(typeof mockUpdatePayloads[0]?.read_at).toBe("string");
			expect(mockUpdateEqCalls).toContainEqual(["status", "unread"]);
			expect(mockRevalidatePath).toHaveBeenCalled();
		});
	});

	describe("deleteMessage()", () => {
		it("rejects invalid UUID and deletes valid message with path revalidation", async () => {
			const invalidRes = await deleteMessage({ id: "invalid-id" });
			expect(invalidRes.success).toBe(false);
			expect(mockDeleteEqCalls).toHaveLength(0);

			const validRes = await deleteMessage({ id: VALID_ID });
			expect(validRes.success).toBe(true);
			expect(mockDeleteEqCalls).toContainEqual(["id", VALID_ID]);
			expect(mockRevalidatePath).toHaveBeenCalled();
		});
	});
});
