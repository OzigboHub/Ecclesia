# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2-features-and-regressions.spec.ts >> P2 — Features & Console Regressions >> Staff console regression: parishioners, payments, announcements, societies
- Location: e2e\p2-features-and-regressions.spec.ts:75:6

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/payments", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import bcrypt from "bcryptjs";
  3  | import { getAdminUser, findSeededParishioner, loginAsAdmin, testDb as db } from "./helpers/db";
  4  | 
  5  | test.describe("P2 — Features & Console Regressions", () => {
  6  | 	test("Feed onboarding /start has 3 steps and is skippable", async ({ page }) => {
  7  | 		await page.goto("/start");
  8  | 		await expect(page).toHaveURL(/.*start/);
  9  | 		await expect(page.locator("body")).toBeVisible();
  10 | 	});
  11 | 
  12 | 	test("Parish Gate enforcement, code submission, and device persistence", async ({
  13 | 		browser,
  14 | 	}) => {
  15 | 		const parishioner = await findSeededParishioner();
  16 | 		const orgId = parishioner.organizationId;
  17 | 
  18 | 		// Set gate code in DB
  19 | 		const gateCode = "987654";
  20 | 		const codeHash = await bcrypt.hash(gateCode, 10);
  21 | 		await db.parishGateCode.upsert({
  22 | 			where: { organizationId: orgId },
  23 | 			update: { codeHash, isActive: true },
  24 | 			create: { organizationId: orgId, codeHash, isActive: true },
  25 | 		});
  26 | 		await db.organizationFeatureSettings.upsert({
  27 | 			where: { organizationId: orgId },
  28 | 			update: { requireGateCode: true },
  29 | 			create: { organizationId: orgId, requireGateCode: true },
  30 | 		});
  31 | 
  32 | 		// Fresh context visiting /gate/[parishId] or /feed
  33 | 		const context = await browser.newContext();
  34 | 		const page = await context.newPage();
  35 | 		await page.goto(`/gate/${orgId}`);
  36 | 		await expect(page).toHaveURL(new RegExp(`.*gate/${orgId}`));
  37 | 
  38 | 		// Wrong gate code
  39 | 		const codeInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
  40 | 		if (await codeInput.isVisible()) {
  41 | 			await codeInput.fill("000000");
  42 | 			await page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Enter")');
  43 | 			await expect(page.locator("text=didn't match").or(page.locator("text=Invalid"))).toBeVisible();
  44 | 
  45 | 			// Correct gate code
  46 | 			await codeInput.fill(gateCode);
  47 | 			await page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Enter")');
  48 | 			await page.waitForURL("**/feed**");
  49 | 
  50 | 			// Reload to verify gate code remembered on device
  51 | 			await page.reload();
  52 | 			expect(page.url()).toContain("/feed");
  53 | 		}
  54 | 
  55 | 		await context.close();
  56 | 	});
  57 | 
  58 | 	test("Mobile layout constraints at 360x800", async ({ page }) => {
  59 | 		await page.setViewportSize({ width: 360, height: 800 });
  60 | 		await page.goto("/feed");
  61 | 
  62 | 		// Assert no horizontal page scroll
  63 | 		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  64 | 		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  65 | 		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  66 | 
  67 | 		// Assert bottom tab bar clears safe area if visible
  68 | 		const navBar = page.locator("nav, footer, [role='navigation']").last();
  69 | 		if (await navBar.isVisible()) {
  70 | 			const box = await navBar.boundingBox();
  71 | 			expect(box?.height).toBeGreaterThanOrEqual(44);
  72 | 		}
  73 | 	});
  74 | 
  75 | 	test("Staff console regression: parishioners, payments, announcements, societies", async ({
  76 | 		page,
  77 | 	}) => {
  78 | 		await loginAsAdmin(page);
  79 | 
  80 | 		const routes = ["/parishioners", "/payments", "/announcements", "/societies"];
  81 | 		for (const route of routes) {
> 82 | 			await page.goto(route);
     |               ^ Error: page.goto: Test timeout of 30000ms exceeded.
  83 | 			await expect(page).toHaveURL(new RegExp(`.*${route}`));
  84 | 			await expect(page.locator("body")).toBeVisible();
  85 | 		}
  86 | 	});
  87 | });
  88 | 
```