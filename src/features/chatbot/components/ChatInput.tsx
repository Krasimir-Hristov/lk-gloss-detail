"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useRef, type KeyboardEvent } from "react";

type ChatInputProps = {
	onSendAction: (content: string) => void;
	isLoading: boolean;
};

export const ChatInput = ({ onSendAction, isLoading }: ChatInputProps) => {
	const t = useTranslations("Chatbot");
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSend = () => {
		const trimmed = value.trim();
		if (!trimmed || isLoading) return;
		onSendAction(trimmed);
		setValue("");
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="flex items-center gap-2 border-t border-white/10 p-3">
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={t("placeholder")}
				disabled={isLoading}
				className="min-w-0 flex-1 rounded-xl border border-[#353534] bg-[#1c1b1b] px-4 py-2.5 text-sm text-[#e5e2e1] placeholder-[#958da2] transition-all outline-none focus:border-[#7b2dff] focus:shadow-[0_0_8px_rgba(123,45,255,0.3)] disabled:opacity-50"
			/>
			<button
				type="button"
				onClick={handleSend}
				disabled={isLoading || !value.trim()}
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7b2dff] text-white transition-all hover:bg-[#7b2dff]/80 disabled:opacity-40"
				aria-label={t("send")}
			>
				<Send className="h-4 w-4" />
			</button>
		</div>
	);
};
