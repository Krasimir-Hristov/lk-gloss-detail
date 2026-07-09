import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
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
	const supabase = createServiceClient();
	const { data } = await supabase
		.from("appointments")
		.select("email, phone")
		.eq("id", id)
		.single<{ email: string; phone: string }>();
	return data;
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
		<section className="flex min-h-screen items-center justify-center bg-[#121212] px-4 py-12">
			<div className="w-full max-w-lg rounded-2xl border border-[#7b2dff]/20 bg-[#201f1f] p-8 text-center">
				<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#7b2dff]/10">
					<CheckCircle className="h-10 w-10 text-[#7b2dff]" />
				</div>

				<h1 className="font-['Montserrat'] text-2xl font-bold text-white sm:text-3xl">
					{t("success.title")}
				</h1>

				<p className="mt-4 text-white/70">{t("success.message")}</p>

				<div className="mt-6 space-y-2 text-sm text-white/80">
					{email ? <p>{t("success.contactEmail", { email })}</p> : null}
					{phone ? <p>{t("success.contactPhone", { phone })}</p> : null}
				</div>

				<Link href={`/${locale}`} passHref>
					<Button className="mt-8 w-full bg-linear-to-r from-[#7b2dff] to-[#b303f2] py-6 text-lg font-bold text-white hover:shadow-[0_0_30px_rgba(123,45,255,0.5)]">
						{t("success.backHome")}
					</Button>
				</Link>
			</div>
		</section>
	);
};

export default BookingSuccessPage;
