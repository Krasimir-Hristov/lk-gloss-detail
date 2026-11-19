"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ReactNode } from "react";

type RevealSectionProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
};

export const RevealSection = ({ children, className, delay = 0 }: RevealSectionProps) => {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.12 }}
			transition={{
				duration: 0.65,
				delay,
				ease: [0.16, 1, 0.3, 1],
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
};
