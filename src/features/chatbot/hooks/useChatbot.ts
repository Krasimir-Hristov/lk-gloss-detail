import { create } from "zustand";

import { createMessage, type ChatMessage } from "../schemas/chatbot";

interface ChatbotState {
	isOpen: boolean;
	messages: ChatMessage[];
	isLoading: boolean;
	toggleOpen: () => void;
	closeDrawer: () => void;
	addMessage: (msg: ChatMessage) => void;
	setLoading: (loading: boolean) => void;
	clearMessages: () => void;
}

export const useChatbot = create<ChatbotState>((set) => ({
	isOpen: false,
	messages: [],
	isLoading: false,

	toggleOpen: () =>
		set((state) => ({
			isOpen: !state.isOpen,
			// Initialize with greeting if opening for the first time
			messages:
				state.messages.length === 0 && !state.isOpen
					? [createMessage("assistant", "")]
					: state.messages,
		})),

	closeDrawer: () => set({ isOpen: false }),

	addMessage: (msg) =>
		set((state) => ({
			messages: [...state.messages, msg],
		})),

	setLoading: (loading) => set({ isLoading: loading }),

	clearMessages: () => set({ messages: [] }),
}));
