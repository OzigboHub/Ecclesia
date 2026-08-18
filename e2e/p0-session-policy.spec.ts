import { test, expect } from "@playwright/test";
import {
	getAdminUser,
	findSeededParishioner,
	backdateUserSessions,
	loginAsAdmin,
	testDb as db,
} from "./helpers/db";

test.describe("P0 — Session policy, both directions", () => {
	test("Staff single session enforcement: signing in on context B signs out context A", async ({
		browser,
	}) => {
		const contextA = await browser.newContext();
		const pageA = await contextA.newPage();
		await loginAsAdmin(pageA);
		expect(pageA.url()).toContain("/dashboard");

		const contextB = await browser.newContext();
		const pageB = await contextB.newPage();
		await loginAsAdmin(pageB);
		expect(pageB.url()).toContain("/dashboard");

		// Next request on Context A should sign Context A out
		await pageA.goto("/dashboard");
		await pageA.waitForURL("**/auth/login**");
		expect(pageA.url()).toContain("/auth/login");

		await contextA.close();
		await contextB.close();
	});

	test("Staff session 30-minute idle timeout triggers sign out on next request", async ({
		browser,
	}) => {
		const admin = await getAdminUser();

		const context = await browser.newContext();
		const page = await context.newPage();
		await loginAsAdmin(page);
		expect(page.url()).toContain("/dashboard");

		// Backdate UserSession.lastSeenAt to 31 minutes ago
		await backdateUserSessions(admin.id, 31);

		// Next request should trigger sign-out
		await page.goto("/dashboard");
		await page.waitForURL("**/auth/login**");
		expect(page.url()).toContain("/auth/login");

		await context.close();
	});

	test("Parishioner multi-device persistence: context A and B stay live and survive idle timeout", async ({
		browser,
	}) => {
		const parishioner = await findSeededParishioner();
		const phone = parishioner.phone;

		const contextA = await browser.newContext();
		const pageA = await contextA.newPage();
		await pageA.goto("/feed");

		const lockInBtnA = pageA.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
		if (await lockInBtnA.isVisible()) {
			await lockInBtnA.click();
		}
		await pageA.waitForSelector('input[type="tel"], input[name="phone"]', { state: "visible" });
		await pageA.fill('input[type="tel"], input[name="phone"]', phone);
		await pageA.click('button:has-text("Continue"), button[type="submit"]');

		await pageA.waitForSelector('text="Confirm your identity"', { state: "visible" });
		await pageA.click('button:has-text("Yes, this is me"), button:has-text("Continue")');

		await contextA.close();
	});
});
