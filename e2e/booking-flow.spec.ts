import { expect, test } from "@playwright/test";

test.describe("Booking Flow (E2E)", () => {
	test("should display booking wizard on /de/booking with valid status and wizard container", async ({
		page,
	}) => {
		const response = await page.goto("/de/booking");
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(/LK Gloss & Detail/i);

		const wizard = page.locator('[data-testid="booking-wizard"]');
		await expect(wizard).toBeVisible();
	});

	test("should load booking page in English and Greek with 200 status and localized render", async ({
		page,
	}) => {
		const enResponse = await page.goto("/en/booking");
		expect(enResponse?.status()).toBe(200);
		await expect(page.url()).toContain("/en/booking");
		await expect(page.locator('[data-testid="booking-wizard"]')).toBeVisible();

		const elResponse = await page.goto("/el/booking");
		expect(elResponse?.status()).toBe(200);
		await expect(page.url()).toContain("/el/booking");
		await expect(page.locator('[data-testid="booking-wizard"]')).toBeVisible();
	});
});
