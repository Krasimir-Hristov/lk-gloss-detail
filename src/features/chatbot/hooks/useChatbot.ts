import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
	ChatMessageSchema,
	createMessage,
	type ChatMessage,
} from "@/features/chatbot/schemas/chatbot";

interface ChatbotState {
	isOpen: boolean;
	messages: ChatMessage[];
	isLoading: boolean;
	toggleOpen: () => void;
	closeDrawer: () => void;
	addMessage: (msg: ChatMessage) => void;
	appendToLastMessage: (content: string) => void;
	setLoading: (loading: boolean) => void;
	clearMessages: () => void;
}

export const useChatbot = create<ChatbotState>()(
	persist(
		(set) => ({
			isOpen: false,
			messages: [],
			isLoading: false,

			toggleOpen: () =>
				set((state) => ({
					isOpen: !state.isOpen,
					messages:
						state.messages.length === 0 && !state.isOpen
							? [createMessage("assistant", "", { isGreeting: true })]
							: state.messages,
				})),

			closeDrawer: () => set({ isOpen: false }),

			addMessage: (msg) =>
				set((state) => ({
					messages: [...state.messages, ChatMessageSchema.parse(msg)],
				})),

			appendToLastMessage: (content: string) =>
				set((state) => {
					const messages = [...state.messages];
					const last = messages[messages.length - 1];
					if (!last) return state;
					const updated = { ...last, content: last.content + content };
					messages[messages.length - 1] = ChatMessageSchema.parse(updated);
					return { messages };
				}),

			setLoading: (loading) => set({ isLoading: loading }),

			clearMessages: () => set({ messages: [] }),
		}),
		{
			name: "lk_chatbot_history_v1",
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({
				messages: state.messages,
				isOpen: state.isOpen,
			}),
		},
	),
);
