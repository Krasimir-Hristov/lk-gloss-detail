import { Mail, Phone, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { ContactForm } from "@/features/contact";

export const ContactSection = () => {
	const t = useTranslations("Contact");

	return (
		<section id="contact" className="px-4 py-20 md:px-16 md:py-28">
			<div className="mx-auto max-w-7xl">
				{/* Section header */}
				<div className="mb-16 text-center">
					<div className="mx-auto mb-4 h-1 w-16 rounded-full bg-linear-to-r from-[#7b2dff] to-[#d8b4fe]" />
					<h2 className="text-3xl font-bold text-[#e5e2e1] md:text-4xl">{t("title")}</h2>
				</div>

				<div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-2">
					{/* Contact form */}
					<div className="rounded-xl border border-[#353534] bg-[#201f1f] p-8">
						<ContactForm />
					</div>

					{/* Contact details */}
					<div className="flex flex-col gap-6">
						<a
							href="tel:+491234567890"
							className="flex items-center gap-4 rounded-xl border border-[#353534] bg-[#201f1f] p-6 transition-all hover:border-[#7b2dff]/30"
						>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7b2dff]/15">
								<Phone className="h-6 w-6 text-[#d1bcff]" />
							</div>
							<div>
								<p className="text-sm font-bold text-[#e5e2e1]">{t("details.phone")}</p>
								<p className="text-sm text-[#ccc3d9]">+49 123 456 7890</p>
							</div>
						</a>
						<a
							href="mailto:info@lkglossanddetail.de"
							className="flex items-center gap-4 rounded-xl border border-[#353534] bg-[#201f1f] p-6 transition-all hover:border-[#7b2dff]/30"
						>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7b2dff]/15">
								<Mail className="h-6 w-6 text-[#d1bcff]" />
							</div>
							<div>
								<p className="text-sm font-bold text-[#e5e2e1]">{t("details.email")}</p>
								<p className="text-sm text-[#ccc3d9]">info@lkglossanddetail.de</p>
							</div>
						</a>
						<a
							href="https://wa.me/491234567890"
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
