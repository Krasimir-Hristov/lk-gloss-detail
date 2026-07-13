"use client";

import { Bot, User } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ChatMessage } from "../schemas/chatbot";

type ChatMessageBubbleProps = {
	message: ChatMessage;
};

export const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
	const t = useTranslations("Chatbot");
	const isAssistant = message.role === "assistant";

	return (
		<div className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
			{/* Avatar for assistant (left side) */}
			{isAssistant ? (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7b2dff]/20">
					<Bot className="h-4 w-4 text-[#d1bcff]" />
				</div>
			) : null}

			<div className={`flex max-w-[75%] flex-col ${isAssistant ? "items-start" : "items-end"}`}>
				{/* Name label */}
				<span className="mb-1 text-xs font-medium text-[#ccc3d9]">
					{isAssistant ? t("botName") : t("userLabel")}
				</span>

				{/* Bubble */}
				<div
					className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
						isAssistant
							? "rounded-tl-sm border border-[#353534] bg-[#201f1f] text-[#e5e2e1]"
							: "rounded-tr-sm border border-[#7b2dff]/30 bg-[#7b2dff]/20 text-[#e5e2e1]"
					}`}
				>
					{message.content}
				</div>
			</div>

			{/* Avatar for user (right side) */}
			{!isAssistant ? (
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#b303f2]/20">
					<User className="h-4 w-4 text-[#ebb2ff]" />
				</div>
			) : null}
		</div>
	);
};
