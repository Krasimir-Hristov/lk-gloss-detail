import { z } from "zod";

export const CompressOptionsSchema = z.object({
	maxDimension: z.number().positive().finite().default(1920),
	quality: z.number().min(0).max(1).default(0.8),
	maxSizeBytes: z
		.number()
		.positive()
		.finite()
		.default(3 * 1024 * 1024), // 3MB limit
});

export type CompressOptions = z.infer<typeof CompressOptionsSchema>;

/**
 * Utility to compress and normalize images on the client side before sending to API.
 * Downscales images to maxDimension (default 1920px) preserving aspect ratio,
 * re-encodes as JPEG with quality, and iteratively compresses if exceeding maxSizeBytes.
 * Rejects with stable error codes: "FILE_INVALID", "FILE_READ_FAILED", "IMAGE_DECODE_FAILED", "CANVAS_CONTEXT_FAILED", "FILE_TOO_LARGE".
 */
export async function compressImage(
	file: File,
	maxDimension = 1920,
	quality = 0.8,
	maxSizeBytes = 3 * 1024 * 1024,
): Promise<string> {
	if (typeof window === "undefined" || !(file instanceof File)) {
		throw new Error("FILE_INVALID");
	}

	const parsedOptions = CompressOptionsSchema.safeParse({ maxDimension, quality, maxSizeBytes });
	if (!parsedOptions.success) {
		throw new Error("FILE_INVALID");
	}

	const options = parsedOptions.data;

	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onerror = () => reject(new Error("FILE_READ_FAILED"));

		reader.onload = (event) => {
			const dataUrl = event.target?.result as string;
			if (!dataUrl) {
				reject(new Error("FILE_READ_FAILED"));
				return;
			}

			const img = new Image();

			img.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));

			img.onload = () => {
				let { width, height } = img;
				const currentMaxDim = options.maxDimension;

				if (width > currentMaxDim || height > currentMaxDim) {
					if (width > height) {
						height = Math.round((height * currentMaxDim) / width);
						width = currentMaxDim;
					} else {
						width = Math.round((width * currentMaxDim) / height);
						height = currentMaxDim;
					}
				}

				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("CANVAS_CONTEXT_FAILED"));
					return;
				}

				let currentQuality = options.quality;
				let compressedBase64 = "";

				// Iterative compression loop if file size exceeds limit
				for (let attempt = 0; attempt < 5; attempt++) {
					canvas.width = width;
					canvas.height = height;

					ctx.clearRect(0, 0, width, height);
					ctx.drawImage(img, 0, 0, width, height);

					compressedBase64 = canvas.toDataURL("image/jpeg", currentQuality);

					if (compressedBase64.length <= options.maxSizeBytes) {
						resolve(compressedBase64);
						return;
					}

					// Reduce quality and dimensions for next attempt
					currentQuality *= 0.75;
					width = Math.round(width * 0.85);
					height = Math.round(height * 0.85);
				}

				// Final check
				if (compressedBase64 && compressedBase64.length <= options.maxSizeBytes) {
					resolve(compressedBase64);
				} else {
					reject(new Error("FILE_TOO_LARGE"));
				}
			};

			img.src = dataUrl;
		};

		reader.readAsDataURL(file);
	});
}
