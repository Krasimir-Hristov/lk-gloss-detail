import { describe, expect, it } from "vitest";

import {
	BookingClientInfoSchema,
	BookingDateSchema,
	BookingFormSchema,
	BookingServicesSchema,
} from "@/features/booking/schemas/booking.schema";

describe("Booking Schemas", () => {
	describe("BookingClientInfoSchema", () => {
		it("accepts valid client info with accepted GDPR", () => {
			const validData = {
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				phone: "+4915123456789",
				carDescription: "Audi A4 Black",
				gdprAccepted: true,
			};
			const result = BookingClientInfoSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("rejects when GDPR is not accepted (false)", () => {
			const invalidData = {
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				phone: "+4915123456789",
				gdprAccepted: false,
			};
			const result = BookingClientInfoSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("rejects invalid email and short phone numbers", () => {
			const invalidData = {
				firstName: "",
				lastName: "Doe",
				email: "invalid-email",
				phone: "123",
				gdprAccepted: true,
			};
			const result = BookingClientInfoSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});

	describe("BookingServicesSchema", () => {
		it("validates array of valid UUID service IDs", () => {
			const validData = {
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
			};
			expect(BookingServicesSchema.safeParse(validData).success).toBe(true);
		});

		it("fails if empty array of services", () => {
			const invalidData = {
				selectedServiceIds: [],
			};
			expect(BookingServicesSchema.safeParse(invalidData).success).toBe(false);
		});
	});

	describe("BookingDateSchema", () => {
		it("validates YYYY-MM-DD date strings", () => {
			expect(BookingDateSchema.safeParse({ bookingDate: "2026-08-15" }).success).toBe(true);
		});

		it("rejects invalid date formats", () => {
			expect(BookingDateSchema.safeParse({ bookingDate: "15-08-2026" }).success).toBe(false);
			expect(BookingDateSchema.safeParse({ bookingDate: "2026/08/15" }).success).toBe(false);
		});
	});

	describe("BookingFormSchema", () => {
		it("validates full merged booking form data", () => {
			const fullForm = {
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@example.com",
				phone: "+491700000000",
				carDescription: "BMW M3",
				gdprAccepted: true,
				selectedServiceIds: ["123e4567-e89b-12d3-a456-426614174000"],
				bookingDate: "2026-09-01",
			};
			expect(BookingFormSchema.safeParse(fullForm).success).toBe(true);
		});
	});
});
