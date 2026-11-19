import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { CONTACT_INFO } from "@/constants/contact";
import { NAV_LINKS, LEGAL_LINKS } from "@/constants/navigation";
import { Link } from "@/i18n/routing";

const Footer: React.FC = () => {
	const t = useTranslations("Footer");
	const tNav = useTranslations("Navigation");

	const year = new Date().getFullYear();

	const navLinks = NAV_LINKS.filter((l) => l.href !== "/").map((l) => ({
		key: l.href,
		href: l.href.startsWith("#") ? { pathname: "/", hash: l.href.slice(1) } : l.href,
		label: tNav(l.i18nKey),
	}));

	const legalLinks = LEGAL_LINKS.map((l) => ({
		href: l.href,
		label: t(l.i18nKey),
	}));

	return (
		<footer className="relative w-full overflow-hidden border-t border-white/[0.08] bg-[#050508] pt-16 pb-32 md:pt-24 md:pb-16">
			{/* Top hairline violet accent */}
			<div className="pointer-events-none absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-[#7b2dff]/70 to-transparent" />
			<div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-full max-w-96 -translate-x-1/2 rounded-full bg-[#7b2dff]/10 blur-3xl" />

			<div className="relative mx-auto max-w-7xl px-4 md:px-12">
				<div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
					{/* --- Column 1: Brand --- */}
					<div className="space-y-5 lg:col-span-4">
						<Link href="/" aria-label="LK Gloss & Detail" className="group inline-flex">
							<BrandLogo size="lg" />
						</Link>
						<p className="max-w-xs text-sm leading-relaxed text-[#9f99b0]">
							{t("copyright", { year })}
						</p>
					</div>

					{/* --- Column 2: Navigation --- */}
					<div className="space-y-4 lg:col-span-2">
						<h5 className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#d1bcff] uppercase">
							{t("services")}
						</h5>
						<ul className="space-y-2.5">
							{navLinks.map((l) => (
								<li key={l.key}>
									<Link
										href={l.href}
										className="group inline-flex items-center gap-1 text-sm text-[#b8b2c7] transition-colors hover:text-white"
									>
										<span>{l.label}</span>
										<ArrowUpRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#d1bcff] group-hover:opacity-100" />
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* --- Column 3: Legal --- */}
					<div className="space-y-4 lg:col-span-2">
						<h5 className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#d1bcff] uppercase">
							{t("impressum")}
						</h5>
						<ul className="space-y-2.5">
							{legalLinks.map((l) => (
								<li key={l.href + l.label}>
									<Link
										href={l.href}
										className="text-sm text-[#b8b2c7] transition-colors hover:text-white hover:underline hover:underline-offset-4"
									>
										{l.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* --- Column 4: Contact --- */}
					<div className="space-y-4 lg:col-span-4">
						<h5 className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#d1bcff] uppercase">
							{t("contact")}
						</h5>
						<ul className="space-y-3 text-sm text-[#ccc3d9]">
							<li>
								<a
									href={`tel:${CONTACT_INFO.phoneRaw}`}
									aria-label={CONTACT_INFO.phone}
									className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 transition-all hover:border-[#7b2dff]/45 hover:bg-white/[0.04]"
								>
									<span className="flex items-center gap-3">
										<Phone className="size-4 text-[#b37cff]" />
										<span className="font-mono text-xs text-[#e5e2e1] group-hover:text-white">
											{CONTACT_INFO.phone}
										</span>
									</span>
									<ArrowUpRight className="size-4 text-[#8c859e] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#d1bcff]" />
								</a>
							</li>
							<li>
								<a
									href={`mailto:${CONTACT_INFO.email}`}
									aria-label={CONTACT_INFO.email}
									className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 transition-all hover:border-[#7b2dff]/45 hover:bg-white/[0.04]"
								>
									<span className="flex min-w-0 items-center gap-3">
										<Mail className="size-4 shrink-0 text-[#b37cff]" />
										<span className="truncate font-mono text-xs text-[#e5e2e1] group-hover:text-white">
											{CONTACT_INFO.email}
										</span>
									</span>
									<ArrowUpRight className="size-4 shrink-0 text-[#8c859e] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#d1bcff]" />
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom divider bar */}
				<div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row">
					<p className="font-mono text-[11px] text-[#7c758f]">{t("copyright", { year })}</p>
					<span className="font-mono text-[10px] tracking-[0.22em] text-[#7c758f] uppercase">
						LK Gloss &amp; Detail • Mobile Detailing
					</span>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
