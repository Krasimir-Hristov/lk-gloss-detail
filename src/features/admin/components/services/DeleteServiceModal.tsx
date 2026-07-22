import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

interface DeleteServiceModalProps {
	isOpen: boolean;
	serviceName: string;
	onClose: () => void;
	onConfirm: () => void;
	isDeleting: boolean;
}

export const DeleteServiceModal: React.FC<DeleteServiceModalProps> = ({
	isOpen,
	serviceName,
	onClose,
	onConfirm,
	isDeleting,
}) => {
	const t = useTranslations("Admin.services");

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={isDeleting ? undefined : onClose}
			/>

			<div className="relative w-full max-w-md overflow-hidden rounded-xl border border-red-500/30 bg-neutral-900 shadow-2xl">
				<div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-red-500 to-rose-600" />

				<div className="p-6">
					<div className="mb-4 flex items-center gap-4 text-red-400">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
							<AlertTriangle className="h-6 w-6" />
						</div>
						<h3 className="Montserrat text-xl font-bold">{t("delete.title")}</h3>
					</div>

					<p className="mb-2 text-sm text-neutral-300">
						{t("delete.message", { name: serviceName })}
					</p>
					<p className="mb-6 text-xs text-red-400/80">{t("delete.warning")}</p>

					<div className="flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={isDeleting}
							className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
						>
							{t("cancel")}
						</button>
						<button
							type="button"
							onClick={onConfirm}
							disabled={isDeleting}
							className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-red-500 disabled:opacity-50"
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span>{t("delete.deleting")}</span>
								</>
							) : (
								<span>{t("delete.confirm")}</span>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
