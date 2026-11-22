export class PayloadTooLargeError extends Error {
	public readonly maxBytes: number;

	constructor(maxBytes: number) {
		super(`Request body exceeds ${maxBytes} byte limit`);
		this.name = "PayloadTooLargeError";
		this.maxBytes = maxBytes;
	}
}

export class InvalidJsonError extends Error {
	constructor(message = "Invalid JSON payload") {
		super(message);
		this.name = "InvalidJsonError";
	}
}

const concatChunks = (chunks: Uint8Array[], totalBytes: number): Uint8Array => {
	const merged = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return merged;
};

/**
 * Reads and parses a JSON request body while strictly enforcing `maxBytes`
 * on actually received stream bytes (never trusting Content-Length alone).
 */
export const readBoundedJson = async (request: Request, maxBytes: number): Promise<unknown> => {
	const contentLengthHeader = request.headers.get("content-length");
	if (contentLengthHeader !== null) {
		const declaredLength = Number(contentLengthHeader);
		if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
			throw new PayloadTooLargeError(maxBytes);
		}
	}

	if (!request.body) {
		throw new InvalidJsonError();
	}

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let totalBytes = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (!value) continue;

			totalBytes += value.byteLength;
			if (totalBytes > maxBytes) {
				await reader.cancel().catch(() => {});
				throw new PayloadTooLargeError(maxBytes);
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	try {
		const merged = concatChunks(chunks, totalBytes);
		const text = new TextDecoder("utf-8", { fatal: true }).decode(merged);
		return JSON.parse(text) as unknown;
	} catch {
		throw new InvalidJsonError();
	}
};
