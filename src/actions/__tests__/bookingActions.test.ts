import { beforeEach, describe, expect, it, vi } from "vitest";

import { createBooking, getUnavailableDates } from "@/actions/booking";
import { addDaysBerlinIso, getBerlinTodayIso } from "@/lib/date/berlinDate";

interface QueryResult<T> {
	data: T[];
	error: null;
}

interface ChainableFilter<T> extends PromiseLike<QueryResult<T>> {
	gte: (column: string, value: string) => ChainableFilter<T>;
	neq: (column: string, value: string) => ChainableFilter<T>;
}

const { mockRevalidatePath, mockRpc, mockAppointmentsGte, mockAppointmentsNeq, mockState } =
	vi.hoisted(() => ({
		mockRevalidatePath: vi.fn(),
		mockRpc: vi.fn(),
		mockAppointmentsGte: vi.fn(),
		mockAppointmentsNeq: vi.fn(),
		mockState: {
			appointments: [] as Array<{ booking_date: string; status: string }>,
			blockedDates: [] as Array<{ blocked_date: string }>,
		},
	}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
}));

const createFilterBuilder = <T extends Record<string, string>>(
	initialRows: T[],
	onGte?: (col: string, val: string) => void,
	onNeq?: (col: string, val: string) => void,
): ChainableFilter<T> => {
	let rows = [...initialRows];
	const builder: ChainableFilter<T> = {
		gte(column: string, value: string) {
			onGte?.(column, value);
			rows = rows.filter((row) => (row[column] ?? "") >= value);
			return builder;
		},
		neq(column: string, value: string) {
			onNeq?.(column, value);
			rows = rows.filter((row) => row[column] !== value);
			return builder;
		},
		then(onfulfilled, onrejected) {
			return Promise.resolve({ data: rows, error: null }).then(onfulfilled, onrejected);
		},
	};
	return builder;
};

vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: vi.fn(() => ({
		rpc: mockRpc,
		from: vi.fn((table: string) => {
			if (table === "appointments") {
				return {
					select: vi.fn(() =>
						createFilterBuilder(mockState.appointments, mockAppointmentsGte, mockAppointmentsNeq),
					),
				};
			}
			if (table === "blocked_dates") {
				return {
					select: vi.fn(() => createFilterBuilder(mockState.blockedDates)),
				};
			}
			return {
				select: vi.fn(() => createFilterBuilder([] as Array<Record<string, string>>)),
			};
		}),
	})),
}));

describe("Booking Server Actions Integration", () => {
	const todayIso = getBerlinTodayIso();
	const activeDate = addDaysBerlinIso(todayIso, 5);
	const cancelledDate = addDaysBerlinIso(todayIso, 6);
	const pendingDate = addDaysBerlinIso(todayIso, 7);
	const blockedDate = addDaysBerlinIso(todayIso, 10);
	const takenDate = addDaysBerlinIso(todayIso, 12);
	const dbFailDate = addDaysBerlinIso(todayIso, 13);
	const validFutureDate = addDaysBerlinIso(todayIso, 15);

	beforeEach(() => {
		vi.clearAllMocks();
		mockState.appointments = [
			{ booking_date: activeDate, status: "confirmed" },
			{ booking_date: cancelledDate, status: "cancelled" },
			{ booking_date: pendingDate, status: "pending" },
		];
		mockState.blockedDates = [{ blocked_date: blockedDate }];

		mockRpc.mockImplementation((_fnName: string, params: { p_booking_date: string }) => {
			if (params.p_booking_date === blockedDate) {
				return Promise.resolve({ data: null, error: { message: "DATE_BLOCKED" } });
			}
			if (params.p_booking_date === takenDate) {
				return Promise.resolve({ data: null, error: { message: "DATE_TAKEN" } });
			}
			if (params.p_booking_date === dbFailDate) {
				return Promise.resolve({ data: null, error: { message: "DB_FAILURE" } });
			}
			return Promise.resolve({ data: "appointment-uuid-123", error: null });
		});
	});

	describe("getUnavailableDates()", () => {
		it("excludes cancelled appointments via .neq('status', 'cancelled') and uses Berlin today", async () => {
			const dates = await getUnavailableDates();

			expect(mockAppointmentsGte).toHaveBeenCalledWith("booking_date", todayIso);
			expect(mockAppointmentsNeq).toHaveBeenCalledWith("status", "cancelled");
			expect(dates).toContain(activeDate);
			expect(dates).toContain(pendingDate);
			expect(dates).toContain(blockedDate);
			expect(dates).not.toContain(cancelledDate);
		});

		it("deduplicates overlapping dates across appointments and blocked_dates", async () => {
			mockState.appointments = [{ booking_date: blockedDate, status: "confirmed" }];
			mockState.blockedDates = [{ blocked_date: blockedDate }];

			const dates = await getUnavailableDates();
			expect(dates.filter((d) => d === blockedDate)).toHaveLength(1);
		});
	});

	describe("createBooking()", () => {
		it("returns success, appointment ID, and revalidates paths for valid booking submission", async () => {
			const result = await createBooking({
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				phone: "+4915123456789",
				carDescription: "BMW M3",
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
				bookingDate: validFutureDate,
			});

			expect(result).toEqual({
				success: true,
				appointmentId: "appointment-uuid-123",
			});
			const revalidated = mockRevalidatePath.mock.calls.map(([p]) => String(p));
			expect(revalidated.some((p) => p.endsWith("/admin"))).toBe(true);
			expect(revalidated.some((p) => p.endsWith("/admin/appointments"))).toBe(true);
			expect(revalidated.some((p) => p.endsWith("/booking"))).toBe(true);
		});

		it("returns DATE_BLOCKED error when RPC rejects a manually blocked date", async () => {
			const result = await createBooking({
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "+4915999999999",
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
				bookingDate: blockedDate,
			});

			expect(result).toEqual({
				success: false,
				error: "DATE_BLOCKED",
			});
			expect(mockRevalidatePath).not.toHaveBeenCalled();
		});

		it("returns DATE_TAKEN error when RPC returns DATE_TAKEN", async () => {
			const result = await createBooking({
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "+4915999999999",
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
				bookingDate: takenDate,
			});

			expect(result).toEqual({
				success: false,
				error: "DATE_TAKEN",
			});
		});

		it("returns INTERNAL_ERROR error when RPC fails with generic database error", async () => {
			const result = await createBooking({
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "+4915999999999",
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
				bookingDate: dbFailDate,
			});

			expect(result).toEqual({
				success: false,
				error: "INTERNAL_ERROR",
			});
		});

		it("returns INVALID_DATA error when payload fails schema validation", async () => {
			const invalidBooking = {
				firstName: "",
				lastName: "Doe",
				email: "invalid-email",
				phone: "123",
				selectedServiceIds: [] as string[],
				bookingDate: "not-a-date",
			} as unknown as Parameters<typeof createBooking>[0];

			const result = await createBooking(invalidBooking);
			expect(result).toEqual({
				success: false,
				error: "INVALID_DATA",
			});
			expect(mockRpc).not.toHaveBeenCalled();
		});
	});
});
