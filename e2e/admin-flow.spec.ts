import { expect, test } from "@playwright/test";

test.describe("Admin Portal (E2E)", () => {
	test("should load admin login page with email input control", async ({ page }) => {
		const response = await page.goto("/de/admin/login");
		expect(response?.status()).toBe(200);

		const emailInput = page.locator("input#email");
		await expect(emailInput).toBeVisible();
	});
});
