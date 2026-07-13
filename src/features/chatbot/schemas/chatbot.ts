import { z } from "zod";

export const ChatMessageSchema = z.object({
	id: z.string(),
	role: z.enum(["user", "assistant"]),
	content: z.string(),
	timestamp: z.number(),
	isGreeting: z.boolean().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export function createMessage(
	role: ChatMessage["role"],
	content: string,
	opts?: { isGreeting?: boolean },
): ChatMessage {
	return ChatMessageSchema.parse({
		id: crypto.randomUUID(),
		role,
		content,
		timestamp: Date.now(),
		...(opts?.isGreeting !== undefined ? { isGreeting: opts.isGreeting } : {}),
	});
}
