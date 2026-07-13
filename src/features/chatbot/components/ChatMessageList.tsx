"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import { useChatbot } from "../hooks/useChatbot";

export const ChatMessageList = () => {
	const t = useTranslations("Chatbot");
	const { messages, isLoading } = useChatbot();
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	// Show greeting if no messages yet
	const displayMessages =
		messages.length > 0
			? messages.map((msg) => {
					// Replace empty assistant content with greeting
					if (msg.role === "assistant" && msg.content === "") {
						return { ...msg, content: t("greeting") };
					}
					return msg;
				})
			: [];

	return (
		<div className="flex-1 overflow-y-auto px-4 py-4">
			<div className="flex flex-col gap-4">
				{displayMessages.map((msg) => (
					<ChatMessageBubble key={msg.id} message={msg} />
				))}
				{isLoading ? <ChatTypingIndicator /> : null}
				<div ref={bottomRef} />
			</div>
		</div>
	);
};
