"use server";

import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import {
	createService as createServiceMutation,
	deleteService as deleteServiceMutation,
	toggleServiceActive as toggleServiceActiveMutation,
	updateService as updateServiceMutation,
} from "@/features/admin/actions/serviceMutations";
import { AdminServiceRowSchema } from "@/lib/admin/serviceHelpers";
import { requireAdmin } from "@/lib/auth/requireAdmin";

import type { ServiceFormInput } from "@/features/admin/schemas/servicesSchema";
import type { AdminServiceItem } from "@/features/admin/types/servicesTypes";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TO_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export const getAdminServices = async (): Promise<ActionResult<AdminServiceItem[]>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) return { success: false, error: auth.error };

		const { data, error } = await auth.supabase
			.from("services")
			.select("*")
			.order("sort_order", { ascending: true });

		if (error) {
			console.error("[getAdminServices] DB error:", error.message);
			return { success: false, error: "Failed to fetch services" };
		}

		const parsed = z.array(AdminServiceRowSchema).safeParse(data ?? []);
		if (!parsed.success) {
			console.error("[getAdminServices] Row validation error:", parsed.error.flatten());
			return { success: false, error: "Invalid service records in database" };
		}

		return { success: true, data: parsed.data };
	} catch (err: unknown) {
		console.error("[getAdminServices] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const createService = async (
	input: ServiceFormInput,
): Promise<ActionResult<AdminServiceItem>> => createServiceMutation(input);

export const updateService = async (
	id: string,
	input: ServiceFormInput,
): Promise<ActionResult<AdminServiceItem>> => updateServiceMutation(id, input);

export const toggleServiceActive = async (
	id: string,
	active: boolean,
): Promise<ActionResult<void>> => toggleServiceActiveMutation(id, active);

export const deleteService = async (id: string): Promise<ActionResult<void>> =>
	deleteServiceMutation(id);

export const uploadServiceImage = async (formData: FormData): Promise<ActionResult<string>> => {
	try {
		const auth = await requireAdmin();
		if (!auth.authorized) return { success: false, error: auth.error };

		const file = formData.get("file");
		if (
			!file ||
			typeof file !== "object" ||
			!("type" in file) ||
			!("size" in file) ||
			typeof file.type !== "string" ||
			typeof file.size !== "number"
		) {
			return { success: false, error: "No file provided" };
		}

		const safeExt = ALLOWED_IMAGE_MIME_TO_EXT[file.type];
		if (!safeExt) {
			return { success: false, error: "Only JPEG, PNG, and WebP images are allowed" };
		}
		if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
			return { success: false, error: "Image size must be between 1 byte and 5MB" };
		}

		const fileName = `services/${uuidv4()}.${safeExt}`;
		const { error: uploadError } = await auth.supabase.storage
			.from("gallery")
			.upload(fileName, file as Blob, { contentType: file.type, upsert: true });

		if (uploadError) {
			console.error("[uploadServiceImage] Upload error:", uploadError.message);
			return { success: false, error: "Failed to upload image" };
		}

		const {
			data: { publicUrl },
		} = auth.supabase.storage.from("gallery").getPublicUrl(fileName);

		return { success: true, data: publicUrl };
	} catch (err: unknown) {
		console.error("[uploadServiceImage] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
