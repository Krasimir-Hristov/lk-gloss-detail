"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { NAV_LINKS } from "@/constants/navigation";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ---------- Custom Hooks ----------

const useNavActiveState = (href: string, activeSection: string) => {
	const pathname = usePathname();

	const isAnchor = href.startsWith("#");
	const isHomepage = pathname === "/";

	let isActive = false;
	if (isHomepage) {
		if (isAnchor) {
			const sectionId = href.replace("#", "");
			isActive = activeSection === sectionId;
		} else if (href === "/") {
			isActive = activeSection === "home";
		}
	} else {
		isActive = !isAnchor && (href === "/" ? pathname === "/" : pathname.startsWith(href));
	}

	const targetHref = isAnchor && !isHomepage ? { pathname: "/", hash: href.slice(1) } : href;

	return { isActive, targetHref };
};

// ---------- Inline sub-components ----------

const DesktopNavLink = ({
	href,
	activeSection,
	children,
}: {
	href: string;
	activeSection: string;
	children: ReactNode;
}) => {
	const { isActive, targetHref } = useNavActiveState(href, activeSection);

	return (
		<Link
			href={targetHref}
			className={cn(
				"relative rounded-full px-4 py-1.5 font-mono text-xs tracking-[0.12em] uppercase transition-all duration-200",
				isActive
					? "bg-[#7b2dff]/20 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(168,85,247,0.45)]"
					: "font-medium text-[#b8b2c7] hover:bg-white/[0.05] hover:text-white",
			)}
		>
			{children}
		</Link>
	);
};

const MobileNavLink = ({
	href,
	activeSection,
	children,
	onClick,
}: {
	href: string;
	activeSection: string;
	children: ReactNode;
	onClick: () => void;
}) => {
	const { isActive, targetHref } = useNavActiveState(href, activeSection);

	return (
		<Link
			href={targetHref}
			onClick={onClick}
			className={cn(
				"font-display block rounded-xl px-4 py-3 text-base font-semibold transition-all",
				isActive
					? "border border-[#7b2dff]/40 bg-[#7b2dff]/20 text-white"
					: "text-[#d5d0e3] hover:bg-white/[0.05] hover:text-white",
			)}
		>
			{children}
		</Link>
	);
};

// ---------- Main Navbar ----------

const Navbar = () => {
	const t = useTranslations("Navigation");
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [hidden, setHidden] = useState(false);
	const [activeSection, setActiveSection] = useState<string>("home");
	const lastScrollY = useRef(0);
	const isInitial = useRef(true);

	// Hide/Show navbar on scroll
	useEffect(() => {
		lastScrollY.current = window.scrollY;

		const onScroll = () => {
			const currentY = window.scrollY;

			if (isInitial.current) {
				isInitial.current = false;
				lastScrollY.current = currentY;
				return;
			}

			if (mobileOpen) return;

			const scrollingDown = currentY > lastScrollY.current;
			if (scrollingDown && currentY > 80) {
				setHidden(true);
			} else {
				setHidden(false);
			}
			lastScrollY.current = currentY;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [mobileOpen]);

	// Highlight active section (scrollspy)
	useEffect(() => {
		if (typeof window === "undefined") return;

		const isHomepage = pathname === "/";

		if (!isHomepage) {
			const timer = setTimeout(() => {
				setActiveSection("");
			}, 0);
			return () => clearTimeout(timer);
		}

		const handleScroll = () => {
			if (window.scrollY < 100) {
				setActiveSection("home");
				return;
			}

			const servicesEl = document.getElementById("services");
			const contactEl = document.getElementById("contact");
			const servicesRect = servicesEl?.getBoundingClientRect();
			const contactRect = contactEl?.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const isNearBottom =
				viewportHeight + window.scrollY >= document.documentElement.scrollHeight - 120;

			const isInOrPastContact =
				contactRect != null && (contactRect.top <= viewportHeight * 0.55 || isNearBottom);

			const isInServices =
				servicesRect != null &&
				servicesRect.top <= viewportHeight * 0.4 &&
				servicesRect.bottom > 160;

			const isInHero = servicesRect != null && servicesRect.top > viewportHeight * 0.4;

			if (isInOrPastContact) {
				setActiveSection("contact");
			} else if (isInServices) {
				setActiveSection("services");
			} else if (isInHero) {
				setActiveSection("home");
			} else {
				setActiveSection("");
			}
		};

		window.addEventListener("resize", handleScroll, { passive: true });
		window.addEventListener("scroll", handleScroll, { passive: true });

		const timer = setTimeout(() => {
			handleScroll();
		}, 0);

		return () => {
			window.removeEventListener("resize", handleScroll);
			window.removeEventListener("scroll", handleScroll);
			clearTimeout(timer);
		};
	}, [pathname]);

	const closeMobile = useCallback(() => setMobileOpen(false), []);

	const navLinks = NAV_LINKS.map((l) => ({
		href: l.href,
		label: t(l.i18nKey),
	}));

	return (
		<header
			className={cn(
				"fixed top-0 right-0 left-0 z-50 px-3 pt-3 transition-transform duration-300 sm:px-6",
				hidden ? "-translate-y-full" : "translate-y-0",
			)}
		>
			<nav
				aria-label="Primary Navigation"
				className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0a0a0f]/82 px-3.5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:px-5"
			>
				{/* ----- Logo ----- */}
				<Link
					href="/"
					aria-label="LK Gloss & Detail"
					className="group flex shrink-0 items-center focus:outline-none"
				>
					<BrandLogo size="sm" priority />
				</Link>

				{/* ----- Desktop Links ----- */}
				<div className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.025] p-1 lg:flex">
					{navLinks.map((l) => (
						<DesktopNavLink key={l.href} href={l.href} activeSection={activeSection}>
							{l.label}
						</DesktopNavLink>
					))}
				</div>

				{/* ----- Right Actions ----- */}
				<div className="flex items-center gap-2.5 sm:gap-3">
					<LanguageSwitcher />

					{/* Desktop CTA */}
					<Link
						href="/booking"
						aria-label={t("bookNow")}
						className="group font-display hidden items-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-4 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_20px_rgba(123,45,255,0.4)] transition-all hover:shadow-[0_0_28px_rgba(192,38,255,0.58)] hover:brightness-110 active:scale-95 md:inline-flex"
					>
						<span>{t("bookNow")}</span>
						<ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
					</Link>

					{/* Hamburger button */}
					<button
						type="button"
						onClick={() => setMobileOpen((prev) => !prev)}
						className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2 text-[#ccc3d9] transition-colors hover:border-[#7b2dff]/50 hover:text-white lg:hidden"
						aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
						aria-expanded={mobileOpen}
					>
						{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
					</button>
				</div>
			</nav>

			{/* ----- Mobile Drawer ----- */}
			<AnimatePresence>
				{mobileOpen ? (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
						className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12]/95 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl lg:hidden"
					>
						<div className="flex flex-col gap-1.5 p-4">
							{navLinks.map((l) => (
								<MobileNavLink
									key={l.href}
									href={l.href}
									activeSection={activeSection}
									onClick={closeMobile}
								>
									{l.label}
								</MobileNavLink>
							))}
							<div className="my-2 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
							<Link
								href="/booking"
								onClick={closeMobile}
								aria-label={t("bookNow")}
								className="font-display inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#7b2dff] to-[#c026ff] px-4 py-3.5 text-center text-sm font-bold tracking-wider text-white uppercase shadow-[0_0_20px_rgba(192,38,255,0.4)]"
							>
								<span>{t("bookNow")}</span>
								<ArrowRight className="size-4" />
							</Link>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</header>
	);
};

export default Navbar;
