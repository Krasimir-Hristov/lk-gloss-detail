/**
 * Utility to compress and normalize images on the client side before sending to API.
 * Downscales images to maxDimension (default 1920px) preserving aspect ratio
 * and re-encodes as JPEG with quality (default 0.8).
 */
export async function compressImage(
	file: File,
	maxDimension = 1920,
	quality = 0.8,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onerror = () => reject(new Error("Failed to read image file"));

		reader.onload = (event) => {
			const dataUrl = event.target?.result as string;
			if (!dataUrl) {
				reject(new Error("Empty file content"));
				return;
			}

			const img = new Image();

			img.onerror = () => reject(new Error("Failed to decode image"));

			img.onload = () => {
				let { width, height } = img;

				if (width > maxDimension || height > maxDimension) {
					if (width > height) {
						height = Math.round((height * maxDimension) / width);
						width = maxDimension;
					} else {
						width = Math.round((width * maxDimension) / height);
						height = maxDimension;
					}
				}

				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to initialize canvas context"));
					return;
				}

				ctx.drawImage(img, 0, 0, width, height);

				// Export as JPEG Base64 data URL
				const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
				resolve(compressedBase64);
			};

			img.src = dataUrl;
		};

		reader.readAsDataURL(file);
	});
}
