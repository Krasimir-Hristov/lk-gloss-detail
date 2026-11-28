import { beforeEach, describe, expect, it, vi } from "vitest";

import { createService, updateService } from "@/features/admin/actions/services";

import type { ServiceInput } from "@/features/admin/schemas/servicesSchema";
import type { AdminServiceItem } from "@/features/admin/types/servicesTypes";

const SERVICE_ID = "123e4567-e89b-12d3-a456-426614174000";

const {
	mockRevalidatePath,
	mockRevalidateTag,
	mockRequireAdmin,
	mockTranslateServicePair,
	mockState,
	mockInsertPayloads,
	mockUpdatePayloads,
	mockUpdateEqCalls,
} = vi.hoisted(() => ({
	mockRevalidatePath: vi.fn(),
	mockRevalidateTag: vi.fn(),
	mockRequireAdmin: vi.fn(),
	mockTranslateServicePair: vi.fn(),
	mockState: {
		existingService: null as AdminServiceItem | null,
	},
	mockInsertPayloads: [] as Array<Record<string, unknown>>,
	mockUpdatePayloads: [] as Array<Record<string, unknown>>,
	mockUpdateEqCalls: [] as Array<[string, string]>,
}));

vi.mock("next/cache", () => ({
	revalidatePath: mockRevalidatePath,
	revalidateTag: mockRevalidateTag,
}));

vi.mock("@/lib/ai/translation", () => ({
	translateServicePair: mockTranslateServicePair,
	translateServiceText: vi.fn(),
}));

const wrapWriteResult = (record: AdminServiceItem) => {
	const result = { data: record, error: null as null };
	return {
		select: () => ({ single: async () => result, maybeSingle: async () => result }),
		then: (
			onfulfilled?: (val: { data: AdminServiceItem; error: null }) => unknown,
			onrejected?: (reason: unknown) => unknown,
		) => Promise.resolve(result).then(onfulfilled, onrejected),
	};
};

const createMockSupabase = () => ({
	from: vi.fn((_table: string) => ({
		select: vi.fn(() => ({
			eq: vi.fn(() => ({
				single: async () => ({
					data: mockState.existingService,
					error: mockState.existingService ? null : { message: "Not found" },
				}),
				maybeSingle: async () => ({
					data: mockState.existingService,
					error: null,
				}),
			})),
		})),
		insert: vi.fn((payload: Record<string, unknown>) => {
			mockInsertPayloads.push(payload);
			return wrapWriteResult({
				...(mockState.existingService as AdminServiceItem),
				...payload,
				id: SERVICE_ID,
			});
		}),
		update: vi.fn((payload: Record<string, unknown>) => {
			mockUpdatePayloads.push(payload);
			return {
				eq: vi.fn((column: string, value: string) => {
					mockUpdateEqCalls.push([column, value]);
					return wrapWriteResult({
						...(mockState.existingService as AdminServiceItem),
						...payload,
					});
				}),
			};
		}),
	})),
});

vi.mock("@/lib/auth/requireAdmin", () => ({
	requireAdmin: mockRequireAdmin,
}));

const BASE_INPUT: ServiceInput = {
	name: "Außenwäsche",
	short_description: "Gründliche Handwäsche",
	category: "exterior",
	icon: "Sparkles",
	image_url: null,
	price_small: 50,
	price_medium: 65,
	price_large: 80,
	price_suv: 95,
	duration_hours: 1.5,
	active: true,
	sort_order: 1,
	locale: "de",
};

const EXISTING_NAME = {
	de: "Außenwäsche",
	en: "Exterior Wash",
	el: "Εξωτερικό Πλύσιμο",
	sq: "Larje e Jashtme",
	tr: "Dış Yıkama",
};

const EXISTING_DESC = {
	de: "Gründliche Handwäsche",
	en: "Thorough hand wash",
	el: "Ενδελεχές πλύσιμο στο χέρι",
	sq: "Larje e plotë me dorë",
	tr: "Detaylı el yıkama",
};

const PRO_NAME = {
	de: "Außenwäsche Pro",
	en: "Exterior Wash Pro",
	el: "Εξωτερικό Πλύσιμο Pro",
	sq: "Larje e Jashtme Pro",
	tr: "Dış Yıkama Pro",
};

describe("Admin Services Translation Diff-Check", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockInsertPayloads.length = 0;
		mockUpdatePayloads.length = 0;
		mockUpdateEqCalls.length = 0;

		mockState.existingService = {
			id: SERVICE_ID,
			name: { ...EXISTING_NAME },
			short_description: { ...EXISTING_DESC },
			category: "exterior",
			icon: "Sparkles",
			image_url: null,
			price_small: 50,
			price_medium: 65,
			price_large: 80,
			price_suv: 95,
			duration_hours: 1.5,
			active: true,
			sort_order: 1,
			created_at: "2026-11-26T10:00:00.000Z",
		};

		mockTranslateServicePair.mockResolvedValue({
			name: { ...PRO_NAME },
			short_description: { ...EXISTING_DESC },
		});

		mockRequireAdmin.mockResolvedValue({
			authorized: true,
			user: { id: "admin-1" },
			supabase: createMockSupabase(),
		});
	});

	it("rejects unauthorized callers without invoking LLM translation", async () => {
		mockRequireAdmin.mockResolvedValue({ authorized: false, error: "Unauthorized" });

		const createRes = await createService(BASE_INPUT);
		const updateRes = await updateService(SERVICE_ID, BASE_INPUT);

		expect(createRes.success).toBe(false);
		expect(updateRes.success).toBe(false);
		expect(mockTranslateServicePair).not.toHaveBeenCalled();
	});

	it("makes 0 LLM calls on price-only edit when active locale text is unchanged", async () => {
		const res = await updateService(SERVICE_ID, {
			...BASE_INPUT,
			price_small: 75,
			sort_order: 3,
		});

		expect(res.success).toBe(true);
		expect(mockTranslateServicePair).not.toHaveBeenCalled();
		expect(mockUpdatePayloads).toHaveLength(1);
		expect(mockUpdatePayloads[0]?.price_small).toBe(75);
		expect(mockUpdatePayloads[0]?.name).toEqual(EXISTING_NAME);
		expect(mockUpdatePayloads[0]?.short_description).toEqual(EXISTING_DESC);
		expect(mockUpdateEqCalls).toContainEqual(["id", SERVICE_ID]);
		expect(mockRevalidateTag).toHaveBeenCalledWith("services", "max");
		expect(mockRevalidatePath).toHaveBeenCalled();
	});

	it("makes 0 LLM calls when only manual translation overrides are updated", async () => {
		const res = await updateService(SERVICE_ID, {
			...BASE_INPUT,
			translations: {
				name: { en: "Premium Exterior Wash" },
			},
		});

		expect(res.success).toBe(true);
		expect(mockTranslateServicePair).not.toHaveBeenCalled();
		expect(mockUpdatePayloads[0]?.name).toEqual({
			...EXISTING_NAME,
			en: "Premium Exterior Wash",
		});
		expect(mockRevalidateTag).toHaveBeenCalledWith("services", "max");
	});

	it("makes exactly 1 combined translateServicePair call when active locale text changes", async () => {
		const res = await updateService(SERVICE_ID, {
			...BASE_INPUT,
			name: PRO_NAME.de,
		});

		expect(res.success).toBe(true);
		expect(mockTranslateServicePair).toHaveBeenCalledTimes(1);
		expect(mockUpdatePayloads).toHaveLength(1);
		expect(mockUpdatePayloads[0]?.name).toEqual(PRO_NAME);
		expect(mockRevalidateTag).toHaveBeenCalledWith("services", "max");
		expect(mockRevalidatePath).toHaveBeenCalled();
	});

	it("supports editing from sq (no-op diff) and tr (re-translate) locales across all 5 locales", async () => {
		const sqPriceRes = await updateService(SERVICE_ID, {
			...BASE_INPUT,
			locale: "sq",
			name: EXISTING_NAME.sq,
			short_description: EXISTING_DESC.sq,
			price_small: 60,
		});

		expect(sqPriceRes.success).toBe(true);
		expect(mockTranslateServicePair).not.toHaveBeenCalled();
		expect(mockUpdatePayloads[0]?.name).toEqual(EXISTING_NAME);

		const trEditRes = await updateService(SERVICE_ID, {
			...BASE_INPUT,
			locale: "tr",
			name: PRO_NAME.tr,
			short_description: EXISTING_DESC.tr,
		});

		expect(trEditRes.success).toBe(true);
		expect(mockTranslateServicePair).toHaveBeenCalledTimes(1);
		expect(mockTranslateServicePair).toHaveBeenCalledWith(
			expect.objectContaining({
				name: PRO_NAME.tr,
				sourceLocale: "tr",
			}),
		);
		expect(mockUpdatePayloads[1]?.name).toEqual(PRO_NAME);
	});

	it("calls translateServicePair once on createService and invalidates services cache tag", async () => {
		const res = await createService({
			...BASE_INPUT,
			name: PRO_NAME.de,
		});

		expect(res.success).toBe(true);
		expect(mockTranslateServicePair).toHaveBeenCalledTimes(1);
		expect(mockInsertPayloads).toHaveLength(1);
		expect(mockRevalidateTag).toHaveBeenCalledWith("services", "max");
		expect(mockRevalidatePath).toHaveBeenCalled();
	});

	it("preserves missing sq/tr keys without persisting German fallback on price-only edits", async () => {
		const legacyName = { de: EXISTING_NAME.de, en: EXISTING_NAME.en, el: EXISTING_NAME.el };
		const legacyDesc = { de: EXISTING_DESC.de, en: EXISTING_DESC.en, el: EXISTING_DESC.el };
		mockState.existingService = {
			...(mockState.existingService as AdminServiceItem),
			name: legacyName,
			short_description: legacyDesc,
		};

		const deRes = await updateService(SERVICE_ID, { ...BASE_INPUT, price_small: 70 });
		const sqRes = await updateService(SERVICE_ID, { ...BASE_INPUT, locale: "sq", price_small: 72 });

		expect(deRes.success).toBe(true);
		expect(sqRes.success).toBe(true);
		expect(mockTranslateServicePair).not.toHaveBeenCalled();
		expect(mockUpdatePayloads[0]?.name).toEqual(legacyName);
		expect(mockUpdatePayloads[0]?.short_description).toEqual(legacyDesc);
		expect(mockUpdatePayloads[1]?.name).toEqual(legacyName);
	});
});
