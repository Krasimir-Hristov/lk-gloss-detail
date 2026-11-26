import { z } from "zod";

export const DEFAULT_MESSAGES_PAGE_SIZE = 50;

export const MessageStatusSchema = z.enum(["unread", "read", "archived"]);

export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const AdminMessageSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string(),
	phone: z.string(),
	message: z.string(),
	status: MessageStatusSchema,
	read_at: z.string().nullable(),
	created_at: z.string(),
});

export type AdminMessage = z.infer<typeof AdminMessageSchema>;

export const UpdateMessageStatusSchema = z.object({
	id: z.string().uuid(),
	status: MessageStatusSchema,
});

export type UpdateMessageStatusInput = z.infer<typeof UpdateMessageStatusSchema>;

export const DeleteMessageSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteMessageInput = z.infer<typeof DeleteMessageSchema>;

export const MessagesFilterSchema = z.object({
	status: z.union([MessageStatusSchema, z.literal("all")]).default("all"),
	search: z.string().trim().max(200).optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(DEFAULT_MESSAGES_PAGE_SIZE),
});

export type MessagesFilter = z.infer<typeof MessagesFilterSchema>;
