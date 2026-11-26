import { beforeEach, describe, expect, it, vi } from "vitest";

import { blockDateRange } from "@/features/admin/actions/blockedDates";

import type * as BerlinDateModule from "@/lib/date/berlinDate";

interface BlockedDateRow {
	id: string;
	blocked_date: string;
	reason: string | null;
	created_at: string;
}

interface AppointmentConflictRow {
	booking_date: string;
	status?: string;
	id?: string;
	first_name?: string;
	last_name?: string;
}

interface AppointmentsQuery extends PromiseLike<{ data: AppointmentConflictRow[]; error: null }> {
	gte: (column: string, value: string) => AppointmentsQuery;
	lte: (column: string, value: string) => AppointmentsQuery;
	in: (column: string, values: string[]) => AppointmentsQuery;
	neq: (column: string, value: string) => AppointmentsQuery;
	eq: (column: string, value: string) => AppointmentsQuery;
	order: (column: string, opts?: { ascending?: boolean }) => AppointmentsQuery;
}

const {
	mockRevalidatePath,
	mockRequireAdmin,
	mockGetBerlinTodayIso,
	mockState,
	mockAppointmentNeqCalls,
	mockUpsertPayloads,
	mockUpsertOptions,
} = vi.hoisted(() => ({
	mockRevalidatePath: vi.fn(),
	mockRequireAdmin: vi.fn(),
	mockGetBerlinTodayIso: vi.fn(),
	mockState: {
		appointments: [] as AppointmentConflictRow[],
	},
	mockAppointmentNeqCalls: [] as Array<[string, string]>,
	mockUpsertPayloads: [] as Array<Array<{ blocked_date: string; reason: string | null }>>,
	mockUpsertOptions: [] as Array<Record<string, unknown> | undefined>,
}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/date/berlinDate", async (importOriginal) => {
	const actual = await importOriginal<typeof BerlinDateModule>();
	return {
		...actual,
		getBerlinTodayIso: mockGetBerlinTodayIso,
	};
});

const createMockSupabase = () => ({
	from: vi.fn((table: string) => {
		if (table === "appointments") {
			return {
				select: vi.fn(() => {
					let rows = [...mockState.appointments];
					const builder: AppointmentsQuery = {
						gte(column: string, value: string) {
							rows = rows.filter((r) =>
								column === "booking_date" ? r.booking_date >= value : true,
							);
							return builder;
						},
						lte(column: string, value: string) {
							rows = rows.filter((r) =>
								column === "booking_date" ? r.booking_date <= value : true,
							);
							return builder;
						},
						in(column: string, values: string[]) {
							rows = rows.filter((r) =>
								column === "booking_date" ? values.includes(r.booking_date) : true,
							);
							return builder;
						},
						neq(column: string, value: string) {
							mockAppointmentNeqCalls.push([column, value]);
							rows = rows.filter((r) => (column === "status" ? r.status !== value : true));
							return builder;
						},
						eq() {
							return builder;
						},
						order() {
							return builder;
						},
						then(onfulfilled, onrejected) {
							return Promise.resolve({ data: rows, error: null }).then(onfulfilled, onrejected);
						},
					};
					return builder;
				}),
			};
		}

		if (table === "blocked_dates") {
			return {
				upsert: vi.fn(
					(
						rows: Array<{ blocked_date: string; reason: string | null }>,
						options?: Record<string, unknown>,
					) => {
						mockUpsertPayloads.push(rows);
						mockUpsertOptions.push(options);
						const inserted: BlockedDateRow[] = rows.map((row, idx) => ({
							id: `blocked-uuid-${idx + 1}`,
							blocked_date: row.blocked_date,
							reason: row.reason ?? null,
							created_at: "2026-08-01T10:00:00.000Z",
						}));
						return {
							select: vi.fn(() => ({
								order: vi.fn(async () => ({ data: inserted, error: null })),
								then(
									onfulfilled?: (val: { data: BlockedDateRow[]; error: null }) => unknown,
									onrejected?: (reason: unknown) => unknown,
								) {
									return Promise.resolve({ data: inserted, error: null }).then(
										onfulfilled,
										onrejected,
									);
								},
							})),
							then(
								onfulfilled?: (val: { data: BlockedDateRow[]; error: null }) => unknown,
								onrejected?: (reason: unknown) => unknown,
							) {
								return Promise.resolve({ data: inserted, error: null }).then(
									onfulfilled,
									onrejected,
								);
							},
						};
					},
				),
			};
		}

		return {};
	}),
});

vi.mock("@/lib/auth/requireAdmin", () => ({
	requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: vi.fn(() => createMockSupabase()),
}));

describe("Admin Blocked Dates Range (blockDateRange)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAppointmentNeqCalls.length = 0;
		mockUpsertPayloads.length = 0;
		mockUpsertOptions.length = 0;
		mockGetBerlinTodayIso.mockReturnValue("2026-08-10");
		mockState.appointments = [];

		mockRequireAdmin.mockResolvedValue({
			authorized: true,
			user: { id: "admin-1" },
			supabase: createMockSupabase(),
		});
	});

	it("rejects unauthorized callers without querying or upserting", async () => {
		mockRequireAdmin.mockResolvedValue({ authorized: false, error: "Unauthorized" });

		const res = await blockDateRange({
			start_date: "2026-08-10",
			end_date: "2026-08-12",
			reason: "Holiday",
		});

		expect(res.success).toBe(false);
		expect(mockUpsertPayloads).toHaveLength(0);
	});

	it("rejects past dates relative to Europe/Berlin today", async () => {
		mockGetBerlinTodayIso.mockReturnValue("2026-08-10");

		const res = await blockDateRange({
			start_date: "2026-08-09",
			end_date: "2026-08-11",
			reason: "Past range",
		});

		expect(res.success).toBe(false);
		expect(mockUpsertPayloads).toHaveLength(0);
	});

	it("rejects ranges exceeding 60 days inclusive and inverted ranges", async () => {
		const overLimitRes = await blockDateRange({
			start_date: "2026-08-10",
			end_date: "2026-10-10",
			reason: "Too long",
		});
		const invertedRes = await blockDateRange({
			start_date: "2026-08-15",
			end_date: "2026-08-10",
		});

		expect(overLimitRes.success).toBe(false);
		expect(invertedRes.success).toBe(false);
		expect(mockUpsertPayloads).toHaveLength(0);
	});

	it("expands a valid date range, upserts into blocked_dates, and revalidates paths", async () => {
		const res = await blockDateRange({
			start_date: "2026-08-10",
			end_date: "2026-08-12",
			reason: "Summer closure",
		});

		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.conflicts).toEqual([]);
			expect(res.data.added).toHaveLength(3);
			expect(res.data.added.map((d) => d.blocked_date)).toEqual([
				"2026-08-10",
				"2026-08-11",
				"2026-08-12",
			]);
		}
		expect(mockUpsertPayloads).toHaveLength(1);
		expect(mockUpsertPayloads[0]).toEqual([
			{ blocked_date: "2026-08-10", reason: "Summer closure" },
			{ blocked_date: "2026-08-11", reason: "Summer closure" },
			{ blocked_date: "2026-08-12", reason: "Summer closure" },
		]);
		expect(mockRevalidatePath).toHaveBeenCalled();
	});

	it("detects active appointment conflicts (ignoring cancelled) and aborts upsert when allow_conflict is false", async () => {
		mockState.appointments = [
			{
				id: "appt-1",
				booking_date: "2026-08-10",
				first_name: "Max",
				last_name: "Mustermann",
				status: "cancelled",
			},
			{
				id: "appt-2",
				booking_date: "2026-08-11",
				first_name: "Erika",
				last_name: "Musterfrau",
				status: "confirmed",
			},
		];

		const res = await blockDateRange({
			start_date: "2026-08-10",
			end_date: "2026-08-12",
			reason: "Maintenance",
		});

		expect(mockAppointmentNeqCalls).toContainEqual(["status", "cancelled"]);
		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.added).toEqual([]);
			expect(res.data.conflicts).toHaveLength(1);
			expect(JSON.stringify(res.data.conflicts)).toContain("2026-08-11");
			expect(JSON.stringify(res.data.conflicts)).not.toContain("2026-08-10");
		}
		expect(mockUpsertPayloads).toHaveLength(0);
	});

	it("upserts all dates and returns conflicts when allow_conflict is true", async () => {
		mockState.appointments = [
			{
				id: "appt-3",
				booking_date: "2026-08-11",
				first_name: "Hans",
				last_name: "Schmidt",
				status: "pending",
			},
		];

		const res = await blockDateRange({
			start_date: "2026-08-10",
			end_date: "2026-08-12",
			reason: "Urgent closure",
			allow_conflict: true,
		});

		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.data.added).toHaveLength(3);
			expect(JSON.stringify(res.data.conflicts)).toContain("2026-08-11");
		}
		expect(mockUpsertPayloads).toHaveLength(1);
		expect(mockRevalidatePath).toHaveBeenCalled();
	});
});
