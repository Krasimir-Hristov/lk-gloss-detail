import { beforeEach, describe, expect, it, vi } from "vitest";

import { editAppointment } from "@/features/admin/actions/appointmentMutations";

const { mockRequireAdmin, mockRevalidatePath, mockRpc } = vi.hoisted(() => ({
	mockRequireAdmin: vi.fn(),
	mockRevalidatePath: vi.fn(),
	mockRpc: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/auth/requireAdmin", () => ({ requireAdmin: mockRequireAdmin }));

const VALID_APPT_ID = "123e4567-e89b-12d3-a456-426614174000";
const SVC_1 = "223e4567-e89b-12d3-a456-426614174001";
const SVC_2 = "323e4567-e89b-12d3-a456-426614174002";

const VALID_INPUT = {
	id: VALID_APPT_ID,
	first_name: "Max",
	last_name: "Mustermann",
	email: "max@example.com",
	phone: "+491511234567",
	car_description: "BMW M3",
	booking_date: "2027-07-10",
	status: "confirmed" as const,
	service_ids: [SVC_1, SVC_2, SVC_1],
};

describe("editAppointment atomic RPC", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRequireAdmin.mockResolvedValue({
			authorized: true,
			user: { id: "admin-1" },
			supabase: { rpc: mockRpc },
		});
		mockRpc.mockResolvedValue({ error: null });
	});

	it("invokes update_appointment_with_services RPC with deduplicated service IDs and revalidates", async () => {
		const res = await editAppointment(VALID_INPUT);

		expect(res).toEqual({ success: true, data: null });
		expect(mockRpc).toHaveBeenCalledTimes(1);
		expect(mockRpc).toHaveBeenCalledWith("update_appointment_with_services", {
			p_id: VALID_APPT_ID,
			p_first_name: "Max",
			p_last_name: "Mustermann",
			p_email: "max@example.com",
			p_phone: "+491511234567",
			p_car_description: "BMW M3",
			p_booking_date: "2027-07-10",
			p_status: "confirmed",
			p_service_ids: [SVC_1, SVC_2],
		});
		expect(mockRevalidatePath).toHaveBeenCalled();
	});

	it("maps SQL conflict, missing appointment, and invalid service errors cleanly", async () => {
		mockRpc.mockResolvedValueOnce({ error: { code: "23505", message: "unique_violation" } });
		const conflict = await editAppointment(VALID_INPUT);
		expect(conflict).toEqual({
			success: false,
			error: "Another active appointment already exists on this date",
		});

		mockRpc.mockResolvedValueOnce({ error: { code: "P0002", message: "APPOINTMENT_NOT_FOUND" } });
		const notFound = await editAppointment(VALID_INPUT);
		expect(notFound).toEqual({ success: false, error: "Appointment not found" });

		mockRpc.mockResolvedValueOnce({ error: { code: "23503", message: "foreign_key_violation" } });
		const badService = await editAppointment(VALID_INPUT);
		expect(badService).toEqual({
			success: false,
			error: "One or more selected services no longer exist",
		});
	});
});
