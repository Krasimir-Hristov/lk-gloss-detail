import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as validatePhotoPost } from "@/app/api/assessment/validate-photo/route";

const { mockValidateInvoke } = vi.hoisted(() => ({
	mockValidateInvoke: vi.fn(),
}));

vi.mock("@/lib/ai/assessmentValidationGraph", () => ({
	assessmentValidationGraph: {
		invoke: mockValidateInvoke,
	},
}));

describe("POST /api/assessment/validate-photo Bounded Body Security", () => {
	beforeEach(() => {
		mockValidateInvoke.mockReset();
	});

	it("rejects request bodies exceeding byte limit with HTTP 413 (declared and streamed)", async () => {
		const oversizedBody = JSON.stringify({
			imageBase64: `data:image/jpeg;base64,${"A".repeat(4_600_100)}`,
			expectedAngle: "front",
			locale: "de",
		});

		const declaredRequest = new NextRequest("http://localhost:3000/api/assessment/validate-photo", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: oversizedBody,
		});
		const declaredResponse = await validatePhotoPost(declaredRequest);
		expect(declaredResponse.status).toBe(413);
		expect(mockValidateInvoke).not.toHaveBeenCalled();

		const encoded = new TextEncoder().encode(oversizedBody);
		const midpoint = Math.floor(encoded.byteLength / 2);
		const chunkedStream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(encoded.subarray(0, midpoint));
				controller.enqueue(encoded.subarray(midpoint));
				controller.close();
			},
		});

		const streamedInit: NonNullable<ConstructorParameters<typeof NextRequest>[1]> & {
			duplex: "half";
		} = {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: chunkedStream,
			duplex: "half",
		};
		const streamedRequest = new NextRequest(
			"http://localhost:3000/api/assessment/validate-photo",
			streamedInit,
		);
		expect(streamedRequest.headers.get("content-length")).toBeNull();

		const streamedResponse = await validatePhotoPost(streamedRequest);
		expect(streamedResponse.status).toBe(413);
		expect(mockValidateInvoke).not.toHaveBeenCalled();
	});
});
