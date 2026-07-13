import { z } from "zod";

export const ChatMessageSchema = z.object({
	id: z.string(),
	role: z.enum(["user", "assistant"]),
	content: z.string(),
	timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
	return {
		id: crypto.randomUUID(),
		role,
		content,
		timestamp: Date.now(),
	};
}
