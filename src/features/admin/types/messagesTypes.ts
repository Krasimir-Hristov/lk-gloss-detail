import type {
	AdminMessage,
	MessageStatus,
	MessagesFilter,
} from "@/features/admin/schemas/messagesSchema";

export type { AdminMessage, MessageStatus, MessagesFilter };

export interface MessageCounts {
	all: number;
	unread: number;
	read: number;
	archived: number;
}
