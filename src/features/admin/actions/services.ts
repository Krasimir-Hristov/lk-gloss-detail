"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { ServiceInputSchema, type ServiceInput } from "@/features/admin/schemas/services.schema";
import { isAdminUser } from "@/features/admin/utils/auth";
import { routing } from "@/i18n/routing";
import { translateServiceText } from "@/lib/ai/translation";
import { createClient } from "@/lib/supabase/server";

import type { AdminServiceItem } from "@/features/admin/types/services.types";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const revalidateServicePaths = () => {
	for (const loc of routing.locales) {
		try {
			revalidatePath(`/${loc}/admin/services`);
			revalidatePath(`/${loc}/services`);
			revalidatePath(`/${loc}`);
			revalidatePath(`/${loc}/assessment`);
		} catch {
			// Ignore if outside request context
		}
	}
};

export const getAdminServices = async (): Promise<ActionResult<AdminServiceItem[]>> => {
	try {
		const supabase = await createClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { data, error } = await supabase
			.from("services")
			.select("*")
			.order("sort_order", { ascending: true });

		if (error) {
			console.error("[getAdminServices] DB error:", error.message);
			return { success: false, error: "Failed to fetch services" };
		}

		return { success: true, data: data as AdminServiceItem[] };
	} catch (err: unknown) {
		console.error("[getAdminServices] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const createService = async (input: ServiceInput): Promise<ActionResult<void>> => {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const validated = ServiceInputSchema.safeParse(input);
		if (!validated.success) {
			return { success: false, error: "Invalid input data" };
		}

		// Run AI Auto-Translation for Multilingual JSONB
		const nameObj = await translateServiceText(validated.data.name);
		const descObj = validated.data.short_description
			? await translateServiceText(validated.data.short_description)
			: { de: "", en: "", el: "" };

		const payload = {
			...validated.data,
			name: nameObj,
			short_description: descObj,
		};

		const { error } = await supabase.from("services").insert(payload);

		if (error) {
			console.error("[createService] DB error:", error.message);
			return { success: false, error: "Failed to create service" };
		}

		revalidateServicePaths();
		return { success: true, data: undefined };
	} catch (err: unknown) {
		console.error("[createService] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const updateService = async (
	id: string,
	input: ServiceInput,
): Promise<ActionResult<void>> => {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const validated = ServiceInputSchema.safeParse(input);
		if (!validated.success) {
			return { success: false, error: "Invalid input data" };
		}

		// Run AI Auto-Translation for Multilingual JSONB
		const nameObj = await translateServiceText(validated.data.name);
		const descObj = validated.data.short_description
			? await translateServiceText(validated.data.short_description)
			: { de: "", en: "", el: "" };

		const payload = {
			...validated.data,
			name: nameObj,
			short_description: descObj,
		};

		const { error } = await supabase.from("services").update(payload).eq("id", id);

		if (error) {
			console.error("[updateService] DB error:", error.message);
			return { success: false, error: "Failed to update service" };
		}

		revalidateServicePaths();
		return { success: true, data: undefined };
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
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const { error } = await supabase.from("services").update({ active }).eq("id", id);

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
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		// First fetch the service to check if it has an image
		const { data: service, error: fetchError } = await supabase
			.from("services")
			.select("image_url")
			.eq("id", id)
			.single();

		if (fetchError) {
			console.error("[deleteService] Fetch error:", fetchError.message);
			return { success: false, error: "Failed to fetch service before deletion" };
		}

		// Delete the service from the DB
		const { error: deleteError } = await supabase.from("services").delete().eq("id", id);

		if (deleteError) {
			console.error("[deleteService] DB delete error:", deleteError.message);
			return { success: false, error: "Failed to delete service" };
		}

		// If an image URL exists, attempt to extract the storage path and delete the file
		if (service.image_url) {
			try {
				const urlParts = service.image_url.split("/gallery/");
				if (urlParts.length === 2) {
					const filePath = urlParts[1];
					await supabase.storage.from("gallery").remove([filePath]);
				}
			} catch (cleanupErr) {
				console.error("[deleteService] Failed to clean up storage image:", cleanupErr);
				// We don't fail the action if only image cleanup fails
			}
		}

		revalidateServicePaths();
		return { success: true, data: undefined };
	} catch (err: unknown) {
		console.error("[deleteService] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};

export const uploadServiceImage = async (formData: FormData): Promise<ActionResult<string>> => {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !(await isAdminUser(supabase, user.id))) {
			return { success: false, error: "Unauthorized access" };
		}

		const file = formData.get("file") as File | null;
		if (!file) {
			return { success: false, error: "No file provided" };
		}

		const fileExt = file.name.split(".").pop();
		const fileName = `services/${uuidv4()}.${fileExt}`;

		const { error: uploadError } = await supabase.storage
			.from("gallery")
			.upload(fileName, file, { contentType: file.type, upsert: true });

		if (uploadError) {
			console.error("[uploadServiceImage] Upload error:", uploadError.message);
			return { success: false, error: "Failed to upload image" };
		}

		const {
			data: { publicUrl },
		} = supabase.storage.from("gallery").getPublicUrl(fileName);

		return { success: true, data: publicUrl };
	} catch (err: unknown) {
		console.error("[uploadServiceImage] Uncaught error:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
};
