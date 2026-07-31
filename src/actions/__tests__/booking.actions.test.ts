import { describe, expect, it, vi } from "vitest";

import { createBooking, getUnavailableDates } from "@/actions/booking";

// Mock Supabase service client
vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: vi.fn(() => ({
		rpc: vi.fn((fnName, params) => {
			if (params.p_booking_date === "2026-08-01") {
				return Promise.resolve({ data: null, error: { message: "DATE_TAKEN" } });
			}
			return Promise.resolve({ data: "appointment-uuid-123", error: null });
		}),
		from: vi.fn((table: string) => {
			if (table === "appointments") {
				return {
					select: vi.fn(() => ({
						gte: vi.fn(() =>
							Promise.resolve({
								data: [{ booking_date: "2026-08-10" }],
								error: null,
							}),
						),
					})),
				};
			}
			if (table === "blocked_dates") {
				return {
					select: vi.fn(() => ({
						gte: vi.fn(() =>
							Promise.resolve({
								data: [{ blocked_date: "2026-08-15" }],
								error: null,
							}),
						),
					})),
				};
			}
			return {
				select: vi.fn(() => ({
					gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
				})),
			};
		}),
	})),
}));

describe("Booking Server Actions Integration", () => {
	describe("getUnavailableDates()", () => {
		it("fetches and merges booked appointment dates and blocked dates", async () => {
			const dates = await getUnavailableDates();
			expect(dates).toContain("2026-08-10");
			expect(dates).toContain("2026-08-15");
		});
	});

	describe("createBooking()", () => {
		it("returns success and appointment ID for valid booking submission", async () => {
			const validBooking = {
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				phone: "+4915123456789",
				carDescription: "BMW M3",
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
				bookingDate: "2026-08-25",
			};

			const result = await createBooking(validBooking);
			expect(result).toEqual({
				success: true,
				appointmentId: "appointment-uuid-123",
			});
		});

		it("returns DATE_TAKEN error when RPC returns DATE_TAKEN", async () => {
			const takenBooking = {
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "+4915999999999",
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
				bookingDate: "2026-08-01",
			};

			const result = await createBooking(takenBooking);
			expect(result).toEqual({
				success: false,
				error: "DATE_TAKEN",
			});
		});

		it("returns INVALID_DATA error when payload fails schema validation", async () => {
			const invalidBooking = {
				firstName: "",
				lastName: "Doe",
				email: "invalid-email",
				phone: "123",
				selectedServiceIds: [],
				bookingDate: "not-a-date",
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await createBooking(invalidBooking as any);
			expect(result).toEqual({
				success: false,
				error: "INVALID_DATA",
			});
		});
	});
});
