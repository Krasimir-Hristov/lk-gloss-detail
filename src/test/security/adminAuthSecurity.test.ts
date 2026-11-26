import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	deleteAppointment,
	editAppointment,
	getAdminAppointments,
	getAvailableServices,
	updateAppointmentStatus,
} from "@/features/admin/actions/appointments";
import {
	blockDate,
	blockDateRange,
	getBlockedDates,
	unblockDate,
} from "@/features/admin/actions/blockedDates";
import {
	getAdminSidebarCountsAction,
	getDashboardOverviewAction,
} from "@/features/admin/actions/dashboard";
import {
	deleteKnowledgeEntryAction,
	getKnowledgeEntriesAction,
	saveKnowledgeEntryAction,
	testSemanticSearchAction,
} from "@/features/admin/actions/knowledge";
import {
	createService,
	deleteService,
	getAdminServices,
	toggleServiceActive,
	updateService,
	uploadServiceImage,
} from "@/features/admin/actions/services";

import type { ServiceInput } from "@/features/admin/schemas/servicesSchema";

const {
	mockRequireAdmin,
	mockGetCachedAdminSession,
	mockStorageUpload,
	mockStorageFrom,
	mockSupabaseFrom,
	mockSupabaseRpc,
} = vi.hoisted(() => {
	const storageUpload = vi.fn();
	const storageGetPublicUrl = vi.fn(() => ({
		data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/gallery/test.jpg" },
	}));
	return {
		mockRequireAdmin: vi.fn(),
		mockGetCachedAdminSession: vi.fn(),
		mockStorageUpload: storageUpload,
		mockStorageFrom: vi.fn(() => ({ upload: storageUpload, getPublicUrl: storageGetPublicUrl })),
		mockSupabaseFrom: vi.fn(),
		mockSupabaseRpc: vi.fn(),
	};
});

vi.mock("@/lib/auth/requireAdmin", () => ({
	requireAdmin: mockRequireAdmin,
	getCachedAdminSession: mockGetCachedAdminSession,
}));

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(async () => ({
		auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
		from: mockSupabaseFrom,
		rpc: mockSupabaseRpc,
		storage: { from: mockStorageFrom },
	})),
}));

vi.mock("@/lib/supabase/service", () => ({
	createServiceClient: vi.fn(() => ({ from: mockSupabaseFrom, rpc: mockSupabaseRpc })),
}));

vi.mock("@/features/admin/utils/auth", () => ({ isAdminUser: vi.fn(async () => false) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const VALID_SERVICE_INPUT: ServiceInput = {
	name: "Ceramic Coating",
	short_description: "Long-term hydrophobic paint protection",
	category: "exterior",
	icon: "Sparkles",
	image_url: null,
	price_small: 350,
	price_medium: 420,
	price_large: 490,
	price_suv: 550,
	duration_hours: 6,
	active: true,
	sort_order: 1,
	locale: "de",
};

const VALID_EDIT_APPT = {
	id: VALID_UUID,
	first_name: "Max",
	last_name: "Mustermann",
	email: "max@example.com",
	phone: "+4912345678",
	booking_date: "2027-06-15",
	status: "confirmed" as const,
	service_ids: [VALID_UUID],
};

const VALID_KNOWLEDGE_INPUT = {
	title: "Opening Hours",
	content: "We are open Monday to Saturday from 09:00 to 18:00.",
	category: "company_policy" as const,
	keywords: ["hours", "opening"],
};

describe("Phase C Admin Auth & Upload Security", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRequireAdmin.mockResolvedValue({ authorized: false, error: "Unauthorized" });
		mockGetCachedAdminSession.mockResolvedValue(null);
	});

	describe("Auth Guard Regression (Fail-Closed)", () => {
		it("rejects unauthorized callers across all admin server actions", async () => {
			const { deleteMessage, getAdminMessages, markAllMessagesRead, updateMessageStatus } =
				await import("@/features/admin/actions/messages");

			const formData = new FormData();
			formData.append(
				"file",
				new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "car.jpg", { type: "image/jpeg" }),
			);

			const results = await Promise.all([
				getDashboardOverviewAction(),
				getAdminSidebarCountsAction(),
				getAdminMessages({ status: "all" }),
				updateMessageStatus({ id: VALID_UUID, status: "read" }),
				markAllMessagesRead(),
				deleteMessage({ id: VALID_UUID }),
				getAdminAppointments(),
				getAvailableServices(),
				updateAppointmentStatus({ id: VALID_UUID, status: "confirmed" }),
				deleteAppointment(VALID_UUID),
				editAppointment(VALID_EDIT_APPT),
				getBlockedDates(),
				blockDate({ blocked_date: "2027-06-15", reason: "Holiday" }),
				blockDateRange({ start_date: "2027-06-15", end_date: "2027-06-17", reason: "Vacation" }),
				unblockDate(VALID_UUID),
				getAdminServices(),
				createService(VALID_SERVICE_INPUT),
				updateService(VALID_UUID, VALID_SERVICE_INPUT),
				toggleServiceActive(VALID_UUID, true),
				deleteService(VALID_UUID),
				uploadServiceImage(formData),
				getKnowledgeEntriesAction(),
				saveKnowledgeEntryAction(VALID_KNOWLEDGE_INPUT),
				deleteKnowledgeEntryAction(VALID_UUID),
				testSemanticSearchAction("ceramic coating"),
			]);

			for (const result of results) {
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error).toMatch(/unauthoriz/i);
				}
			}

			expect(mockRequireAdmin).toHaveBeenCalledTimes(results.length);
			expect(mockSupabaseFrom).not.toHaveBeenCalled();
			expect(mockSupabaseRpc).not.toHaveBeenCalled();
			expect(mockStorageFrom).not.toHaveBeenCalled();
			expect(mockStorageUpload).not.toHaveBeenCalled();
		});
	});

	describe("Upload Security (uploadServiceImage)", () => {
		beforeEach(() => {
			mockRequireAdmin.mockResolvedValue({
				authorized: true,
				user: { id: VALID_UUID },
				supabase: { from: mockSupabaseFrom, storage: { from: mockStorageFrom } },
			});
		});

		it.each([
			{
				label: "SVG payload (XSS risk)",
				file: new File(['<svg onload="alert(1)"/>'], "xss.svg", { type: "image/svg+xml" }),
				expectedError: /jpeg|png|webp/i,
			},
			{
				label: "HTML payload",
				file: new File(["<h1>injected</h1>"], "page.html", { type: "text/html" }),
				expectedError: /jpeg|png|webp/i,
			},
			{
				label: "PDF payload",
				file: new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" }),
				expectedError: /jpeg|png|webp/i,
			},
			{
				label: "oversized JPEG (> 5MB)",
				file: new File([new Uint8Array(5 * 1024 * 1024 + 1)], "huge.jpg", { type: "image/jpeg" }),
				expectedError: /5mb|size/i,
			},
		])("rejects $label before touching storage", async ({ file, expectedError }) => {
			const formData = new FormData();
			formData.append("file", file);

			const result = await uploadServiceImage(formData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toMatch(expectedError);
			}
			expect(mockStorageFrom).not.toHaveBeenCalled();
			expect(mockStorageUpload).not.toHaveBeenCalled();
		});
	});
});
