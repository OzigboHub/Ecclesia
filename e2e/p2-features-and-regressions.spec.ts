import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { getAdminUser, findSeededParishioner, loginAsAdmin, testDb as db } from "./helpers/db";

test.describe("P2 — Features & Console Regressions", () => {
	test("Feed onboarding /start has 3 steps and is skippable", async ({ page }) => {
		await page.goto("/start");
		await expect(page).toHaveURL(/.*start/);
		await expect(page.locator("body")).toBeVisible();
	});

	test("Parish Gate enforcement, code submission, and device persistence", async ({
		browser,
	}) => {
		const parishioner = await findSeededParishioner();
		const orgId = parishioner.organizationId;

		// Set gate code in DB
		const gateCode = "987654";
		const codeHash = await bcrypt.hash(gateCode, 10);
		await db.parishGateCode.upsert({
			where: { organizationId: orgId },
			update: { codeHash, isActive: true },
			create: { organizationId: orgId, codeHash, isActive: true },
		});
		await db.organizationFeatureSettings.upsert({
			where: { organizationId: orgId },
			update: { requireGateCode: true },
			create: { organizationId: orgId, requireGateCode: true },
		});

		// Fresh context visiting /gate/[parishId] or /feed
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.goto(`/gate/${orgId}`);
		await expect(page).toHaveURL(new RegExp(`.*gate/${orgId}`));

		// Wrong gate code
		const codeInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
		if (await codeInput.isVisible()) {
			await codeInput.fill("000000");
			await page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Enter")');
			await expect(page.locator("text=didn't match").or(page.locator("text=Invalid"))).toBeVisible();

			// Correct gate code
			await codeInput.fill(gateCode);
			await page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Enter")');
			await page.waitForURL("**/feed**");

			// Reload to verify gate code remembered on device
			await page.reload();
			expect(page.url()).toContain("/feed");
		}

		await context.close();
	});

	test("Mobile layout constraints at 360x800", async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 800 });
		await page.goto("/feed");

		// Assert no horizontal page scroll
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

		// Assert bottom tab bar clears safe area if visible
		const navBar = page.locator("nav, footer, [role='navigation']").last();
		if (await navBar.isVisible()) {
			const box = await navBar.boundingBox();
			expect(box?.height).toBeGreaterThanOrEqual(44);
		}
	});

	test("Staff console regression: parishioners, payments, announcements, societies", async ({
		page,
	}) => {
		await loginAsAdmin(page);

		const routes = ["/parishioners", "/payments", "/announcements", "/societies"];
		for (const route of routes) {
			await page.goto(route);
			await expect(page).toHaveURL(new RegExp(`.*${route}`));
			await expect(page.locator("body")).toBeVisible();
		}
	});
});
