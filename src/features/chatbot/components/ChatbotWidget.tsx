"use client";

import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ChatbotDrawer } from "@/features/chatbot/components/ChatbotDrawer";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";

export const ChatbotWidget = () => {
	const t = useTranslations("Chatbot");
	const { isOpen, toggleOpen } = useChatbot();
	const [hasHydrated, setHasHydrated] = useState(() => useChatbot.persist.hasHydrated());

	useEffect(() => {
		const unsubFinish = useChatbot.persist.onFinishHydration(() => {
			setHasHydrated(true);
		});

		if (!useChatbot.persist.hasHydrated()) {
			useChatbot.persist.rehydrate();
		}

		return () => {
			unsubFinish();
		};
	}, []);

	const handleToggle = () => {
		if (!hasHydrated) return;
		toggleOpen();
	};

	return (
		<>
			{/* Floating button */}
			<motion.button
				type="button"
				onClick={handleToggle}
				disabled={!hasHydrated}
				className="fixed right-3.5 bottom-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-linear-to-r from-[#7B2DFF] to-[#C026FF] text-white shadow-[0_0_15px_rgba(192,38,255,0.4)] transition-shadow hover:shadow-[0_0_25px_rgba(192,38,255,0.6)] disabled:cursor-not-allowed disabled:opacity-80 sm:right-6 sm:bottom-6 sm:h-14 sm:w-14"
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
				aria-label={isOpen ? t("closeChat") : t("openChat")}
			>
				{isOpen ? (
					<X className="h-5 w-5 sm:h-6 sm:w-6" />
				) : (
					<MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
				)}
			</motion.button>

			{/* Drawer */}
			<ChatbotDrawer />
		</>
	);
};
