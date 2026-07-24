"use client";

import { Bot, User } from "lucide-react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";

import type { ChatMessage } from "@/features/chatbot/schemas/chatbot";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type ChatMessageBubbleProps = {
	message: ChatMessage;
};

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	children?: ReactNode;
}

interface BlockProps extends HTMLAttributes<HTMLElement> {
	children?: ReactNode;
}

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

			<div className={`flex max-w-[80%] flex-col ${isAssistant ? "items-start" : "items-end"}`}>
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
					{isAssistant ? (
						<ReactMarkdown
							components={{
								a: ({ href, children }: LinkProps) => {
									if (!href) return <span>{children}</span>;
									return (
										<a
											href={href}
											onClick={(e) => {
												if (href.includes("#")) {
													e.preventDefault();
													const hash = href.slice(href.indexOf("#"));
													const element = document.querySelector(hash);
													if (element) {
														element.scrollIntoView({ behavior: "smooth" });
													}
													const cleanUrl = window.location.pathname + hash;
													window.history.replaceState(null, "", cleanUrl);
												}
											}}
											className="font-semibold text-[#d1bcff] underline underline-offset-2 transition-colors hover:text-white"
										>
											{children}
										</a>
									);
								},
								p: ({ children }: BlockProps) => <p className="mb-2 last:mb-0">{children}</p>,
								ul: ({ children }: BlockProps) => (
									<ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>
								),
								ol: ({ children }: BlockProps) => (
									<ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>
								),
								li: ({ children }: BlockProps) => <li className="mb-0.5">{children}</li>,
							}}
						>
							{message.content}
						</ReactMarkdown>
					) : (
						message.content
					)}
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
