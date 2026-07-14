"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useEffect, useCallback } from "react";
import { z } from "zod";

import { ChatInput } from "@/features/chatbot/components/ChatInput";
import { ChatMessageList } from "@/features/chatbot/components/ChatMessageList";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";
import { createMessage } from "@/features/chatbot/schemas/chatbot";

const SSEChunkSchema = z.object({
	content: z.string().optional(),
	error: z.string().optional(),
});

export const ChatbotDrawer = () => {
	const t = useTranslations("Chatbot");
	const locale = useLocale();
	const { isOpen, closeDrawer, addMessage, appendToLastMessage, isLoading, setLoading, messages } =
		useChatbot();
	const abortRef = useRef<AbortController | null>(null);

	const cancelRequest = useCallback(() => {
		if (abortRef.current) {
			abortRef.current.abort();
			abortRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			cancelRequest();
		};
	}, [cancelRequest]);

	const handleSend = async (content: string) => {
		addMessage(createMessage("user", content));
		setLoading(true);

		// Build conversation history (last 6 messages, excluding the current one)
		const history = messages
			.filter((m) => !m.isGreeting)
			.slice(-6)
			.map((m) => ({
				role: m.role,
				content: m.content,
			}));

		// Cancel any in-flight request before starting a new one
		cancelRequest();

		const controller = new AbortController();
		abortRef.current = controller;

		try {
			const response = await fetch("/api/chatbot/message", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: content,
					locale,
					history,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({ error: "Request failed" }));
				throw new Error(err.error ?? `HTTP ${response.status}`);
			}

			// Add an empty assistant message that we'll stream into
			addMessage(createMessage("assistant", ""));

			const reader = response.body?.getReader();
			if (!reader) throw new Error("No response body");

			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed || !trimmed.startsWith("data: ")) continue;

					const dataStr = trimmed.slice(6);
					if (dataStr === "[DONE]") continue;

					try {
						const raw = JSON.parse(dataStr);
						const parsed = SSEChunkSchema.parse(raw);
						if (parsed.content) {
							appendToLastMessage(parsed.content);
						}
						if (parsed.error) {
							console.error("[chatbot] Stream error:", parsed.error);
						}
					} catch {
						// Skip unparseable or invalid lines
					}
				}
			}
		} catch (err) {
			if ((err as Error).name === "AbortError") return;
			console.error("[chatbot] Send failed:", err);
			addMessage(createMessage("assistant", t("errorFallback")));
		} finally {
			setLoading(false);
			// Only clear the ref if it still belongs to this request
			if (abortRef.current === controller) {
				abortRef.current = null;
			}
		}
	};

	return (
		<AnimatePresence>
			{isOpen ? (
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 20, scale: 0.95 }}
					transition={{ duration: 0.25, ease: "easeOut" }}
					className="fixed right-6 bottom-24 z-50 flex w-95 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(123,45,255,0.15)]"
					style={{
						background: "rgba(26, 26, 26, 0.85)",
						backdropFilter: "blur(20px)",
						WebkitBackdropFilter: "blur(20px)",
						height: "520px",
						maxHeight: "calc(100vh - 140px)",
					}}
				>
					{/* Header */}
					<div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
						{/* Avatar */}
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#7B2DFF] to-[#C026FF]">
							<Bot className="h-6 w-6 text-white" />
						</div>

						{/* Name + status */}
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-bold text-[#d1bcff]">{t("botName")}</p>
							<p className="text-xs text-[#958da2]">{t("online")}</p>
						</div>

						{/* Close button */}
						<button
							type="button"
							onClick={closeDrawer}
							className="flex h-8 w-8 items-center justify-center rounded-lg text-[#ccc3d9] transition-colors hover:bg-white/10 hover:text-white"
							aria-label={t("close")}
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Messages */}
					<ChatMessageList />

					{/* Input */}
					<ChatInput onSendAction={handleSend} isLoading={isLoading} />
				</motion.div>
			) : null}
		</AnimatePresence>
	);
};
