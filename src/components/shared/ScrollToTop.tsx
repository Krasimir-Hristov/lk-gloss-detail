"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const THRESHOLD = 400;

const ScrollToTop = () => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > THRESHOLD);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const scrollUp = useCallback(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	return (
		<AnimatePresence>
			{visible ? (
				<motion.button
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					transition={{ duration: 0.2 }}
					onClick={scrollUp}
					className="fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#7b2dff] text-white shadow-[0px_0px_15px_rgba(123,45,255,0.4)] transition-shadow hover:shadow-[0px_0px_25px_rgba(123,45,255,0.6)] md:right-8 md:bottom-8"
					aria-label="Scroll to top"
				>
					<ArrowUp className="size-5" />
				</motion.button>
			) : null}
		</AnimatePresence>
	);
};

export default ScrollToTop;
