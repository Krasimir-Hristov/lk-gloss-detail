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
		if (window.location.hash) {
			window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
		}
	}, []);

	return (
		<AnimatePresence>
			{visible ? (
				<motion.button
					type="button"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					transition={{ duration: 0.2 }}
					onClick={scrollUp}
					className="fixed bottom-4 left-3.5 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#7b2dff]/95 text-white shadow-[0px_0px_15px_rgba(123,45,255,0.45)] backdrop-blur-md transition-all hover:scale-105 hover:shadow-[0px_0px_25px_rgba(123,45,255,0.65)] sm:bottom-6 sm:left-6 sm:h-11 sm:w-11"
					aria-label="Scroll to top"
				>
					<ArrowUp className="size-4.5 sm:size-5" />
				</motion.button>
			) : null}
		</AnimatePresence>
	);
};

export default ScrollToTop;
