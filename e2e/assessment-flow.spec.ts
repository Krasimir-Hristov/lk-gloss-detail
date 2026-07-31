import { expect, test } from "@playwright/test";

test.describe("Assessment Flow (E2E)", () => {
	test("should load assessment wizard on /de/assessment", async ({ page }) => {
		await page.goto("/de/assessment");
		await expect(page).toHaveTitle(/LK Gloss & Detail/i);

		// Check assessment wizard container exists
		const main = page.locator("main");
		await expect(main).toBeVisible();
	});

	test("should support switching locales to /en/assessment and /el/assessment", async ({
		page,
	}) => {
		await page.goto("/en/assessment");
		await expect(page.url()).toContain("/en/assessment");

		await page.goto("/el/assessment");
		await expect(page.url()).toContain("/el/assessment");
	});
});
