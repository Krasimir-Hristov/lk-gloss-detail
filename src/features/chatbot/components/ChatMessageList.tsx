"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { ChatMessageBubble } from "@/features/chatbot/components/ChatMessageBubble";
import { ChatTypingIndicator } from "@/features/chatbot/components/ChatTypingIndicator";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";

export const ChatMessageList = () => {
	const t = useTranslations("Chatbot");
	const messages = useChatbot((s) => s.messages);
	const isLoading = useChatbot((s) => s.isLoading);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	const displayMessages = messages.map((msg) => {
		if (msg.isGreeting) {
			return { ...msg, content: t("greeting") };
		}
		return msg;
	});

	return (
		<div className="flex-1 overflow-y-auto px-4 py-4">
			<div className="flex flex-col gap-4" role="log" aria-live="polite">
				{displayMessages.map((msg) => (
					<ChatMessageBubble key={msg.id} message={msg} />
				))}
				{isLoading ? <ChatTypingIndicator /> : null}
				<div ref={bottomRef} />
			</div>
		</div>
	);
};
