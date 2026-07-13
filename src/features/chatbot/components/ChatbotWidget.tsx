"use client";

import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

import { ChatbotDrawer } from "./ChatbotDrawer";
import { useChatbot } from "../hooks/useChatbot";

export const ChatbotWidget = () => {
	const { isOpen, toggleOpen } = useChatbot();

	return (
		<>
			{/* Floating button */}
			<motion.button
				type="button"
				onClick={toggleOpen}
				className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-r from-[#7B2DFF] to-[#C026FF] text-white shadow-[0_0_15px_rgba(192,38,255,0.4)] transition-shadow hover:shadow-[0_0_25px_rgba(192,38,255,0.6)]"
				animate={{
					boxShadow: isOpen
						? "0 0 15px rgba(192,38,255,0.4)"
						: [
								"0 0 15px rgba(192,38,255,0.4)",
								"0 0 30px rgba(192,38,255,0.6)",
								"0 0 15px rgba(192,38,255,0.4)",
							],
				}}
				transition={{
					boxShadow: {
						duration: 2,
						repeat: Infinity,
						ease: "easeInOut",
					},
				}}
				aria-label={isOpen ? "Close chat" : "Open chat"}
			>
				{isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
			</motion.button>

			{/* Drawer */}
			<ChatbotDrawer />
		</>
	);
};
