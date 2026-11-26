"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import {
	ServiceInputSchema,
	ToggleServiceActiveSchema,
	type ServiceFormInput,
} from "@/features/admin/schemas/servicesSchema";
import { routing } from "@/i18n/routing";
import {
	AdminServiceRowSchema,
	extractGalleryStoragePath,
	hasCompleteTranslations,
	mergeOverrides,
	normalizeTriple,
	type LocalizedTriple,
} from "@/lib/admin/serviceHelpers";
import { translateServicePair } from "@/lib/ai/translation";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import type { ActionResult } from "@/features/admin/actions/services";
import type { AdminServiceItem } from "@/features/admin/types/servicesTypes";

const UuidSchema = z.string().uuid();

const revalidateServicePaths = (): void => {
	try {
		revalidateTag("services", "max");
	} catch {
		// Ignore if outside request context
	}
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}`);
			revalidatePath(`/${loc}/services`);
			revalidatePath(`/${loc}/booking`);
			revalidatePath(`/${loc}/assessment`);
			revalidatePath(`/${loc}/admin`);
			revalidatePath(`/${loc}/admin/services`);
		} catch {
			// Ignore if outside request context
		}
	}
};

export const createService = async (
	input: ServiceFormInput,
): Promise<ActionResult<AdminServiceItem>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) return { success: false, error: auth.error };

		const validated = ServiceInputSchema.safeParse(input);
		if (!validated.success) return { success: false, error: "Invalid input data" };

		const { locale, translations, name, short_description, ...rest } = validated.data;
		const cleanName = name.trim();
		const cleanDesc = (short_description ?? "").trim();

		const needsTranslation =
			!hasCompleteTranslations(translations?.name) ||
			(cleanDesc.length > 0 && !hasCompleteTranslations(translations?.short_description));

		const translated = needsTranslation
			? await translateServicePair({
					name: cleanName,
					shortDescription: cleanDesc,
					sourceLocale: locale,
				})
			: {
					name: { de: cleanName, en: cleanName, el: cleanName },
					short_description: { de: cleanDesc, en: cleanDesc, el: cleanDesc },
				};

		const nameObj = mergeOverrides(translated.name, translations?.name);
		nameObj[locale] = cleanName;
		const descObj = cleanDesc
			? mergeOverrides(translated.short_description, translations?.short_description)
			: { de: "", en: "", el: "" };
		if (cleanDesc) descObj[locale] = cleanDesc;

		const { data, error } = await auth.supabase
			.from("services")
			.insert({ ...rest, name: nameObj, short_description: descObj })
			.select("*")
			.single();

		if (error || !data) {
			console.error("[createService] DB error:", error?.message ?? "No data returned");
			return { success: false, error: "Failed to create service" };
		}

		const parsedService = AdminServiceRowSchema.safeParse(data);
		if (!parsedService.success) {
			console.error("[createService] Row validation error:", parsedService.error.flatten());
			return { success: false, error: "Created service failed validation" };
		}

		revalidateServicePaths();
		return { success: true, data: parsedService.data };
	} catch (err: unknown) {
		console.error("[createService] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const updateService = async (
	id: string,
	input: ServiceFormInput,
): Promise<ActionResult<AdminServiceItem>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) return { success: false, error: auth.error };

		const parsedId = UuidSchema.safeParse(id);
		if (!parsedId.success) return { success: false, error: "Invalid service ID" };

		const validated = ServiceInputSchema.safeParse(input);
		if (!validated.success) return { success: false, error: "Invalid input data" };

		const { data: existing, error: fetchError } = await auth.supabase
			.from("services")
			.select("id, name, short_description")
			.eq("id", parsedId.data)
			.single();

		if (fetchError || !existing) {
			console.error("[updateService] Fetch existing error:", fetchError?.message);
			return { success: false, error: "Service not found" };
		}

		const { locale, translations, name, short_description, ...rest } = validated.data;
		const cleanName = name.trim();
		const cleanDesc = (short_description ?? "").trim();
		const existingName = normalizeTriple(existing.name as Record<string, string> | string | null);
		const existingDesc = normalizeTriple(
			existing.short_description as Record<string, string> | string | null,
		);

		const nameChanged = cleanName !== existingName[locale].trim();
		const descChanged = cleanDesc !== existingDesc[locale].trim();

		let nameObj: LocalizedTriple = mergeOverrides(existingName, translations?.name);
		let descObj: LocalizedTriple = mergeOverrides(existingDesc, translations?.short_description);

		const needsLlm = nameChanged || (descChanged && cleanDesc.length > 0);
		if (needsLlm) {
			const translated = await translateServicePair({
				name: cleanName,
				shortDescription: cleanDesc,
				sourceLocale: locale,
			});

			if (nameChanged) {
				nameObj = mergeOverrides(translated.name, translations?.name, existingName);
				nameObj[locale] = cleanName;
			}
			if (descChanged && cleanDesc) {
				descObj = mergeOverrides(
					translated.short_description,
					translations?.short_description,
					existingDesc,
				);
				descObj[locale] = cleanDesc;
			}
		}

		if (descChanged && !cleanDesc) {
			descObj = { de: "", en: "", el: "" };
		}

		const { data, error } = await auth.supabase
			.from("services")
			.update({ ...rest, name: nameObj, short_description: descObj })
			.eq("id", parsedId.data)
			.select("*")
			.single();

		if (error || !data) {
			console.error("[updateService] DB error:", error?.message ?? "No data returned");
			return { success: false, error: "Failed to update service" };
		}

		const parsedService = AdminServiceRowSchema.safeParse(data);
		if (!parsedService.success) {
			console.error("[updateService] Row validation error:", parsedService.error.flatten());
			return { success: false, error: "Updated service failed validation" };
		}

		revalidateServicePaths();
		return { success: true, data: parsedService.data };
	} catch (err: unknown) {
		console.error("[updateService] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const toggleServiceActive = async (
	id: string,
	active: boolean,
): Promise<ActionResult<void>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) return { success: false, error: auth.error };

		const parsed = ToggleServiceActiveSchema.safeParse({ id, active });
		if (!parsed.success) return { success: false, error: "Invalid toggle payload" };

		const { error } = await auth.supabase
			.from("services")
			.update({ active: parsed.data.active })
			.eq("id", parsed.data.id);

		if (error) {
			console.error("[toggleServiceActive] DB error:", error.message);
			return { success: false, error: "Failed to toggle service status" };
		}

		revalidateServicePaths();
		return { success: true, data: undefined };
	} catch (err: unknown) {
		console.error("[toggleServiceActive] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const deleteService = async (id: string): Promise<ActionResult<void>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) return { success: false, error: auth.error };

		const parsedId = UuidSchema.safeParse(id);
		if (!parsedId.success) return { success: false, error: "Invalid service ID" };

		const { data: service, error: fetchError } = await auth.supabase
			.from("services")
			.select("image_url")
			.eq("id", parsedId.data)
			.single();

		if (fetchError) {
			console.error("[deleteService] Fetch error:", fetchError.message);
			return { success: false, error: "Failed to fetch service before deletion" };
		}

		const { error: deleteError } = await auth.supabase
			.from("services")
			.delete()
			.eq("id", parsedId.data);

		if (deleteError) {
			console.error("[deleteService] DB delete error:", deleteError.message);
			return { success: false, error: "Failed to delete service" };
		}

		if (typeof service?.image_url === "string" && service.image_url.length > 0) {
			const filePath = extractGalleryStoragePath(service.image_url);
			if (filePath) {
				try {
					await auth.supabase.storage.from("gallery").remove([filePath]);
				} catch (cleanupErr: unknown) {
					console.error("[deleteService] Failed to clean up storage image:", cleanupErr);
				}
			}
		}

		revalidateServicePaths();
		return { success: true, data: undefined };
	} catch (err: unknown) {
		console.error("[deleteService] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
