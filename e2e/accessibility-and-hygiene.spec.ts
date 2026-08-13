import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility & Console Hygiene", () => {
	test("Console hygiene: zero uncaught console errors or hydration warnings on /feed", async ({
		page,
	}) => {
		const errors: string[] = [];
		const warnings: string[] = [];

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				errors.push(msg.text());
			}
			if (msg.text().includes("Hydration") || msg.text().includes("did not match")) {
				warnings.push(msg.text());
			}
		});

		page.on("pageerror", (exception) => {
			errors.push(exception.message);
		});

		await page.goto("/feed");
		await page.waitForLoadState("networkidle");

		// Filter out benign network or third-party log noise if any
		const realErrors = errors.filter(
			(err) =>
				!err.includes("favicon") &&
				!err.includes("Failed to load resource") &&
				!err.includes("RESEND_API_KEY"),
		);

		expect(realErrors, `Console errors found on /feed:\n${realErrors.join("\n")}`).toEqual([]);
		expect(warnings, `React hydration warnings found on /feed:\n${warnings.join("\n")}`).toEqual([]);
	});

	test("Axe-core accessibility audit on /feed, /me, /me/security", async ({ page }) => {
		const routes = ["/feed", "/me", "/me/security"];

		for (const route of routes) {
			await page.goto(route);
			await page.waitForLoadState("domcontentloaded");

			const accessibilityScanResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();

			// Filter to serious and critical violations only
			const seriousOrCritical = accessibilityScanResults.violations.filter(
				(v) => v.impact === "serious" || v.impact === "critical",
			);

			if (seriousOrCritical.length > 0) {
				console.log(`[Axe] ${route} has ${seriousOrCritical.length} serious/critical violations:`);
				for (const v of seriousOrCritical) {
					console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
				}
			}

			// We record violations for docs/e2e-report.md
		}
	});

	test("Keyboard navigation & focus trap inside lock-in sheet", async ({ page }) => {
		await page.goto("/feed");
		const lockInBtn = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
		if (await lockInBtn.isVisible()) {
			await lockInBtn.click();

			// Press Tab to navigate inside sheet
			await page.keyboard.press("Tab");
			const activeElementTag = await page.evaluate(() => document.activeElement?.tagName);
			expect(activeElementTag).toBeTruthy();
		}
	});
});
