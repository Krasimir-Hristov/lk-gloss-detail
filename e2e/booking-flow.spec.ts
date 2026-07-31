import { expect, test } from "@playwright/test";

test.describe("Booking Flow (E2E)", () => {
	test("should display booking wizard on /de/booking", async ({ page }) => {
		await page.goto("/de/booking");
		await expect(page).toHaveTitle(/LK Gloss & Detail/i);

		const main = page.locator("main");
		await expect(main).toBeVisible();
	});

	test("should load booking page in English and Greek", async ({ page }) => {
		await page.goto("/en/booking");
		await expect(page.url()).toContain("/en/booking");

		await page.goto("/el/booking");
		await expect(page.url()).toContain("/el/booking");
	});
});
