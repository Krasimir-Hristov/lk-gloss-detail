import { expect, test } from "@playwright/test";

test.describe("Assessment Flow (E2E)", () => {
	test("should load assessment wizard on /de/assessment with valid status and wizard container", async ({
		page,
	}) => {
		const response = await page.goto("/de/assessment");
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(/LK Gloss & Detail/i);

		const wizard = page.locator('[data-testid="assessment-wizard"]');
		await expect(wizard).toBeVisible();
	});

	test("should support switching locales to /en/assessment and /el/assessment with 200 status and localized render", async ({
		page,
	}) => {
		const enResponse = await page.goto("/en/assessment");
		expect(enResponse?.status()).toBe(200);
		await expect(page.url()).toContain("/en/assessment");
		await expect(page.locator('[data-testid="assessment-wizard"]')).toBeVisible();

		const elResponse = await page.goto("/el/assessment");
		expect(elResponse?.status()).toBe(200);
		await expect(page.url()).toContain("/el/assessment");
		await expect(page.locator('[data-testid="assessment-wizard"]')).toBeVisible();
	});
});
