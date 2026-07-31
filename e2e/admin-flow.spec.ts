import { expect, test } from "@playwright/test";

test.describe("Admin Portal (E2E)", () => {
	test("should load admin login page", async ({ page }) => {
		await page.goto("/admin/login");
		const main = page.locator("main");
		await expect(main).toBeVisible();
	});
});
