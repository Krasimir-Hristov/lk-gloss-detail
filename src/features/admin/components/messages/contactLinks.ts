export const sanitizeTel = (phone: string): string => phone.replace(/[^\d+]/g, "");

export const toWhatsappUrl = (phone: string): string | null => {
	let digits = phone.replace(/\D/g, "");
	if (!digits) return null;
	if (digits.startsWith("00")) {
		digits = digits.slice(2);
	} else if (digits.startsWith("0")) {
		digits = `49${digits.slice(1)}`;
	}
	return `https://wa.me/${digits}`;
};
