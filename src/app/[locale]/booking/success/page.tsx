import { ArrowLeft, CheckCircle2, Mail, Phone, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { createServiceClient } from "@/lib/supabase/service";

import type { Metadata } from "next";

type Params = { locale: string };
type SearchParams = { id?: string };

export const generateMetadata = async ({
	params,
}: {
	params: Promise<Params>;
}): Promise<Metadata> => {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Booking.success" });

	return {
		title: t("title"),
	};
};

const getAppointmentContact = async (id: string) => {
	try {
		const supabase = createServiceClient();
		const { data } = await supabase
			.from("appointments")
			.select("email, phone")
			.eq("id", id)
			.single<{ email: string; phone: string }>();
		return data;
	} catch (error: unknown) {
		console.error("[booking/success] Failed to fetch appointment contact:", error);
		return null;
	}
};

const BookingSuccessPage = async ({
	params,
	searchParams,
}: {
	params: Promise<Params>;
	searchParams: Promise<SearchParams>;
}) => {
	const { locale } = await params;
	const { id } = await searchParams;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "Booking" });

	let email = "";
	let phone = "";
	if (id) {
		const contact = await getAppointmentContact(id);
		if (contact) {
			email = contact.email ?? "";
			phone = contact.phone ?? "";
		}
	}

	return (
		<section className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-[#07070a] px-4 py-14 sm:py-20">
			{/* Atelier Grid & Celebratory Ambient Studio Aura */}
			<div className="atelier-grid pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_25%,transparent_78%)] opacity-50" />
			<div className="pointer-events-none absolute top-1/2 left-1/2 h-112 w-112 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b2dff]/18 blur-[150px]" />
			<div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-[130px]" />

			<article className="obsidian-card relative w-full max-w-xl overflow-hidden rounded-3xl p-6 text-center sm:p-10">
				{/* Specular Top Violet-Emerald Light-Strip */}
				<div className="pointer-events-none absolute top-0 right-10 left-10 h-px bg-linear-to-r from-transparent via-[#c026ff]/80 to-transparent" />

				{/* Authentic Brand Header */}
				<div className="mb-7 flex justify-center">
					<BrandLogo size="md" />
				</div>

				{/* Glowing Confirmation Medallion */}
				<div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
					<div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-[#7b2dff]/45 to-emerald-400/35 blur-xl" />
					<div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#a855f7]/45 bg-linear-to-br from-[#7b2dff]/25 via-[#13111f] to-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
						<CheckCircle2 className="h-10 w-10 text-emerald-300" aria-hidden="true" />
					</div>
				</div>

				{/* Status Pill Badge */}
				<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1">
					<Sparkles className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
					<span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-emerald-200 uppercase">
						{t("success.badge")}
					</span>
				</div>

				<h1 className="font-display text-2xl leading-tight font-black tracking-[-0.02em] sm:text-4xl">
					<span className="metallic-text">{t("success.title")}</span>
				</h1>

				<p className="mt-3 text-base leading-relaxed text-[#cfc9de]">{t("success.message")}</p>
				<p className="mt-1.5 text-sm leading-relaxed text-[#9b93ad]">{t("success.nextSteps")}</p>

				{/* Contact Confirmation Pills */}
				{email || phone ? (
					<div className="mt-7 space-y-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left">
						{email ? (
							<div className="flex items-center gap-3 text-sm text-[#e5e2e1]">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7b2dff]/35 bg-[#7b2dff]/15 text-[#d8b4fe]">
									<Mail className="h-4 w-4" aria-hidden="true" />
								</div>
								<p className="min-w-0 truncate">{t("success.contactEmail", { email })}</p>
							</div>
						) : null}

						{phone ? (
							<div className="flex items-center gap-3 text-sm text-[#e5e2e1]">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7b2dff]/35 bg-[#7b2dff]/15 text-[#d8b4fe]">
									<Phone className="h-4 w-4" aria-hidden="true" />
								</div>
								<p className="min-w-0 truncate">{t("success.contactPhone", { phone })}</p>
							</div>
						) : null}
					</div>
				) : null}

				{/* Return Home CTA */}
				<div className="mt-8">
					<Link
						href={`/${locale}`}
						aria-label={t("success.backHome")}
						className="group font-display inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-[#7b2dff] via-[#9c2bff] to-[#c026ff] px-7 text-base font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_14px_38px_-8px_rgba(123,45,255,0.6)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_18px_46px_-6px_rgba(192,38,255,0.68)] hover:brightness-110 active:scale-[0.99]"
					>
						<ArrowLeft
							className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
							aria-hidden="true"
						/>
						<span>{t("success.backHome")}</span>
					</Link>
				</div>
			</article>
		</section>
	);
};

export default BookingSuccessPage;
