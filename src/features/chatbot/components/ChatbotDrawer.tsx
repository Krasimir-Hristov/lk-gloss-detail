"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
import { useChatbot } from "../hooks/useChatbot";
import { createMessage } from "../schemas/chatbot";

export const ChatbotDrawer = () => {
	const t = useTranslations("Chatbot");
	const { isOpen, closeDrawer, addMessage, isLoading, setLoading } = useChatbot();

	const handleSend = (content: string) => {
		addMessage(createMessage("user", content));
		// Placeholder: in Phase 8.2 this will call the API
		setLoading(true);
		setTimeout(() => {
			addMessage(createMessage("assistant", t("greeting")));
			setLoading(false);
		}, 1500);
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
