"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";

import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { cn } from "@/lib/utils";

// ---------- Inline sub-components ----------

const navLinkClass = (isActive: boolean) =>
	cn(
		"font-medium text-sm transition-colors",
		isActive ? "text-[#d1bcff] font-bold" : "text-[#ccc3d9] hover:text-[#d1bcff]",
	);

const DesktopNavLink = ({ href, children }: { href: string; children: ReactNode }) => {
	const pathname = usePathname();
	const locale = useLocale();
	const stripped = pathname.replace(`/${locale}`, "") || "/";
	const isActive = href === "/" ? stripped === "/" : stripped.startsWith(href);

	return (
		<Link
			href={`/${locale}${href}`}
			className={cn(
				navLinkClass(isActive),
				"relative pb-1",
				isActive &&
					"after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#7b2dff]",
			)}
		>
			{children}
		</Link>
	);
};

const MobileNavLink = ({
	href,
	children,
	onClick,
}: {
	href: string;
	children: ReactNode;
	onClick: () => void;
}) => {
	const pathname = usePathname();
	const locale = useLocale();
	const stripped = pathname.replace(`/${locale}`, "") || "/";
	const isActive = href === "/" ? stripped === "/" : stripped.startsWith(href);

	return (
		<Link
			href={`/${locale}${href}`}
			onClick={onClick}
			className={cn(
				"block rounded-lg px-4 py-3 text-lg font-medium transition-colors",
				isActive ? "bg-[#7b2dff]/20 text-[#d1bcff]" : "text-[#e5e2e1] hover:bg-[#2a2a2a]",
			)}
		>
			{children}
		</Link>
	);
};

// ---------- Main Navbar ----------

const Navbar = () => {
	const t = useTranslations("Navigation");
	const locale = useLocale();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [hidden, setHidden] = useState(false);
	const lastScrollY = useRef(0);

	useEffect(() => {
		const onScroll = () => {
			const currentY = window.scrollY;
			if (currentY > lastScrollY.current && currentY > 80) {
				setHidden(true);
			} else {
				setHidden(false);
			}
			lastScrollY.current = currentY;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const closeMobile = useCallback(() => setMobileOpen(false), []);

	const navLinks = [
		{ href: "/", label: t("home") },
		{ href: "/services", label: t("services") },
		{ href: "/assessment", label: t("assessment") },
		{ href: "/gallery", label: t("gallery") },
		{ href: "/contact", label: t("contact") },
	];

	return (
		<header
			className={cn(
				"fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 shadow-[0px_0px_15px_rgba(123,45,255,0.15)] backdrop-blur-xl transition-transform duration-300",
				hidden ? "-translate-y-full" : "translate-y-0",
			)}
		>
			<nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-16">
				{/* ----- Logo ----- */}
				<Link href={`/${locale}`} className="flex items-center">
					<div className="md:col-span-2">
						<div className="mb-4 text-xl font-extrabold tracking-tighter text-[#d1bcff] uppercase">
							LK Gloss <span className="text-[#7b2dff]">&</span> Detail
						</div>
					</div>
				</Link>

				{/* ----- Desktop Links ----- */}
				<div className="hidden items-center gap-8 md:flex">
					{navLinks.map((l) => (
						<DesktopNavLink key={l.href} href={l.href}>
							{l.label}
						</DesktopNavLink>
					))}
				</div>

				{/* ----- Right Actions ----- */}
				<div className="flex items-center gap-4">
					<LanguageSwitcher />

					{/* Desktop CTA */}
					<Link
						href={`/${locale}/booking`}
						className="hidden rounded-lg bg-linear-to-r from-[#7B2DFF] to-[#C026FF] px-5 py-2.5 text-sm font-bold text-white shadow-[0px_0px_15px_rgba(192,38,255,0.4)] transition-all hover:shadow-[0px_0px_25px_rgba(192,38,255,0.6)] active:scale-95 md:inline-flex"
					>
						{t("bookNow")}
					</Link>

					{/* Hamburger button */}
					<button
						onClick={() => setMobileOpen((prev) => !prev)}
						className="inline-flex items-center justify-center rounded-lg p-2 text-[#ccc3d9] transition-colors hover:text-[#d1bcff] md:hidden"
						aria-label={mobileOpen ? "Close menu" : "Open menu"}
						aria-expanded={mobileOpen}
					>
						{mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
					</button>
				</div>
			</nav>

			{/* ----- Mobile Drawer ----- */}
			<AnimatePresence>
				{mobileOpen ? (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="overflow-hidden border-t border-white/10 bg-black/95 backdrop-blur-xl md:hidden"
					>
						<div className="flex flex-col gap-1 px-4 py-4">
							{navLinks.map((l) => (
								<MobileNavLink key={l.href} href={l.href} onClick={closeMobile}>
									{l.label}
								</MobileNavLink>
							))}
							<hr className="my-2 border-white/10" />
							<Link
								href={`/${locale}/booking`}
								onClick={closeMobile}
								className="mt-2 block rounded-lg bg-linear-to-r from-[#7B2DFF] to-[#C026FF] px-4 py-3 text-center text-base font-bold text-white shadow-[0px_0px_15px_rgba(192,38,255,0.4)]"
							>
								{t("bookNow")}
							</Link>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</header>
	);
};

export default Navbar;
