import { Mail, Phone, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { CONTACT_INFO } from "@/constants/contact";
import { ContactForm } from "@/features/contact";

export const ContactSection: React.FC = () => {
	const t = useTranslations("Contact");

	return (
		<section id="contact" className="px-4 py-12 sm:py-20 md:px-16 md:py-28">
			<div className="mx-auto max-w-7xl">
				{/* Section header */}
				<div className="mb-10 text-center sm:mb-16">
					<div className="mx-auto mb-4 h-1 w-16 rounded-full bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
					<h2 className="text-2xl font-bold text-[#e5e2e1] sm:text-3xl md:text-4xl">
						{t("title")}
					</h2>
				</div>

				<div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2 lg:gap-12">
					{/* Contact form */}
					<div className="rounded-xl border border-[#353534] bg-[#201f1f] p-5 sm:p-8">
						<ContactForm />
					</div>

					{/* Contact details */}
					<div className="flex flex-col gap-6">
						<a
							href={`tel:${CONTACT_INFO.phoneRaw}`}
							className="flex items-center gap-4 rounded-xl border border-[#353534] bg-[#201f1f] p-6 transition-all hover:border-[#7b2dff]/30"
						>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7b2dff]/15">
								<Phone className="h-6 w-6 text-[#d1bcff]" />
							</div>
							<div>
								<p className="text-sm font-bold text-[#e5e2e1]">{t("details.phone")}</p>
								<p className="text-sm text-[#ccc3d9]">{CONTACT_INFO.phone}</p>
							</div>
						</a>
						<a
							href={`mailto:${CONTACT_INFO.email}`}
							className="flex items-center gap-4 rounded-xl border border-[#353534] bg-[#201f1f] p-6 transition-all hover:border-[#7b2dff]/30"
						>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7b2dff]/15">
								<Mail className="h-6 w-6 text-[#d1bcff]" />
							</div>
							<div>
								<p className="text-sm font-bold text-[#e5e2e1]">{t("details.email")}</p>
								<p className="text-sm text-[#ccc3d9]">{CONTACT_INFO.email}</p>
							</div>
						</a>
						<a
							href={CONTACT_INFO.whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-4 rounded-xl border border-[#353534] bg-[#201f1f] p-6 transition-all hover:border-[#7b2dff]/30"
						>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7b2dff]/15">
								<MessageCircle className="h-6 w-6 text-[#d1bcff]" />
							</div>
							<div>
								<p className="text-sm font-bold text-[#e5e2e1]">{t("details.whatsapp")}</p>
								<p className="text-sm text-[#ccc3d9]">WhatsApp</p>
							</div>
						</a>
					</div>
				</div>
			</div>
		</section>
	);
};
