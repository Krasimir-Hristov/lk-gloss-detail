"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";

const dotTransition = {
	duration: 0.6,
	repeat: Infinity,
	repeatDelay: 0.2,
	ease: "easeInOut" as const,
};

export const ChatTypingIndicator = () => {
	const t = useTranslations("Chatbot");

	return (
		<div className="flex items-start gap-3">
			{/* Avatar */}
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7b2dff]/20">
				<Bot className="h-4 w-4 text-[#d1bcff]" />
			</div>

			<div className="flex flex-col items-start">
				{/* Name label */}
				<span className="mb-1 text-xs font-medium text-[#ccc3d9]">{t("botName")}</span>

				{/* Typing bubble */}
				<div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-[#353534] bg-[#201f1f] px-4 py-3">
					{[0, 1, 2].map((i) => (
						<motion.span
							key={i}
							animate={{ y: [0, -6, 0] }}
							transition={{ ...dotTransition, delay: i * 0.15 }}
							className="inline-block h-2 w-2 rounded-full bg-[#7b2dff]"
						/>
					))}
				</div>
			</div>
		</div>
	);
};
