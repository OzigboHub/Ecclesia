# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p0-session-policy.spec.ts >> P0 — Session policy, both directions >> Parishioner multi-device persistence: context A and B stay live and survive idle timeout
- Location: e2e\p0-session-policy.spec.ts:54:6

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[type="tel"], input[name="phone"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - generic [ref=e8]: Ecclesia
          - navigation "Primary" [ref=e11]:
            - link "Feed" [ref=e12] [cursor=pointer]:
              - /url: /feed
            - link "Explore" [ref=e15] [cursor=pointer]:
              - /url: /explore
            - link "Give" [ref=e19] [cursor=pointer]:
              - /url: /give
              - img [ref=e20]:
                - generic [ref=e22]: ₦
              - text: Give
            - link "Alerts" [ref=e23] [cursor=pointer]:
              - /url: /alerts
            - link "Me" [ref=e27] [cursor=pointer]:
              - /url: /me
        - radiogroup "Colour theme" [ref=e32]:
          - radio "Light" [ref=e33]
          - radio "Dark" [ref=e41]
          - radio "System" [checked] [ref=e45]
    - main [ref=e49]:
      - generic [ref=e50]: Ecclesia
      - generic [ref=e54]:
        - heading "See your own parish here" [level=2] [ref=e55]
        - paragraph [ref=e56]: Mass times, announcements and giving from the parish you attend.
        - generic [ref=e57]:
          - link "Find my parish" [ref=e58] [cursor=pointer]:
            - /url: /start
          - link "Not now" [ref=e59] [cursor=pointer]:
            - /url: /explore
      - generic [ref=e60]:
        - heading "Nothing here yet" [level=2] [ref=e65]
        - paragraph [ref=e66]: No parish has posted anything public yet. Find your parish to see what's happening there.
        - link "Look at another parish" [ref=e67] [cursor=pointer]:
          - /url: /explore
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e73] [cursor=pointer]
  - alert [ref=e77]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import {
  3  | 	getAdminUser,
  4  | 	findSeededParishioner,
  5  | 	backdateUserSessions,
  6  | 	loginAsAdmin,
  7  | 	testDb as db,
  8  | } from "./helpers/db";
  9  | 
  10 | test.describe("P0 — Session policy, both directions", () => {
  11 | 	test("Staff single session enforcement: signing in on context B signs out context A", async ({
  12 | 		browser,
  13 | 	}) => {
  14 | 		const contextA = await browser.newContext();
  15 | 		const pageA = await contextA.newPage();
  16 | 		await loginAsAdmin(pageA);
  17 | 		expect(pageA.url()).toContain("/dashboard");
  18 | 
  19 | 		const contextB = await browser.newContext();
  20 | 		const pageB = await contextB.newPage();
  21 | 		await loginAsAdmin(pageB);
  22 | 		expect(pageB.url()).toContain("/dashboard");
  23 | 
  24 | 		// Next request on Context A should sign Context A out
  25 | 		await pageA.goto("/dashboard");
  26 | 		await pageA.waitForURL("**/auth/login**");
  27 | 		expect(pageA.url()).toContain("/auth/login");
  28 | 
  29 | 		await contextA.close();
  30 | 		await contextB.close();
  31 | 	});
  32 | 
  33 | 	test("Staff session 30-minute idle timeout triggers sign out on next request", async ({
  34 | 		browser,
  35 | 	}) => {
  36 | 		const admin = await getAdminUser();
  37 | 
  38 | 		const context = await browser.newContext();
  39 | 		const page = await context.newPage();
  40 | 		await loginAsAdmin(page);
  41 | 		expect(page.url()).toContain("/dashboard");
  42 | 
  43 | 		// Backdate UserSession.lastSeenAt to 31 minutes ago
  44 | 		await backdateUserSessions(admin.id, 31);
  45 | 
  46 | 		// Next request should trigger sign-out
  47 | 		await page.goto("/dashboard");
  48 | 		await page.waitForURL("**/auth/login**");
  49 | 		expect(page.url()).toContain("/auth/login");
  50 | 
  51 | 		await context.close();
  52 | 	});
  53 | 
  54 | 	test("Parishioner multi-device persistence: context A and B stay live and survive idle timeout", async ({
  55 | 		browser,
  56 | 	}) => {
  57 | 		const parishioner = await findSeededParishioner();
  58 | 		const phone = parishioner.phone;
  59 | 
  60 | 		const contextA = await browser.newContext();
  61 | 		const pageA = await contextA.newPage();
  62 | 		await pageA.goto("/feed");
  63 | 
  64 | 		const lockInBtnA = pageA.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
  65 | 		if (await lockInBtnA.isVisible()) {
  66 | 			await lockInBtnA.click();
  67 | 		}
> 68 | 		await pageA.waitForSelector('input[type="tel"], input[name="phone"]', { state: "visible" });
     |               ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  69 | 		await pageA.fill('input[type="tel"], input[name="phone"]', phone);
  70 | 		await pageA.click('button:has-text("Continue"), button[type="submit"]');
  71 | 
  72 | 		await pageA.waitForSelector('text="Confirm your identity"', { state: "visible" });
  73 | 		await pageA.click('button:has-text("Yes, this is me"), button:has-text("Continue")');
  74 | 
  75 | 		await contextA.close();
  76 | 	});
  77 | });
  78 | 
```