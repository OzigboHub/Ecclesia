# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-lockin-flow.spec.ts >> P1 — Lock-in, including failure states & phone normalization >> Failure states: unknown number, wrong code (attempts remaining), too many attempts (cooldown)
- Location: e2e\p1-lockin-flow.spec.ts:56:6

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
  1   | import { test, expect } from "@playwright/test";
  2   | import {
  3   | 	findSeededParishioner,
  4   | 	getAdminUser,
  5   | 	normaliseNgPhone,
  6   | 	lookupParishionerByPhoneTest as lookupParishionerByPhone,
  7   | 	testDb as db,
  8   | } from "./helpers/db";
  9   | import bcrypt from "bcryptjs";
  10  | 
  11  | test.describe("P1 — Lock-in, including failure states & phone normalization", () => {
  12  | 	test("Name confirmation displays first name + last initial ONLY (never full surname, phone or email)", async () => {
  13  | 		const parishioner = await findSeededParishioner();
  14  | 		const orgId = parishioner.organizationId;
  15  | 		const result = await lookupParishionerByPhone(orgId, parishioner.phone);
  16  | 
  17  | 		expect(result.success).toBe(true);
  18  | 		expect(result.data).not.toBeNull();
  19  | 		if (result.data) {
  20  | 			const displayName = result.data.displayName;
  21  | 			const initial = parishioner.lastName.trim().charAt(0).toUpperCase();
  22  | 
  23  | 			// Must be First L.
  24  | 			expect(displayName).toBe(`${parishioner.firstName} ${initial}.`);
  25  | 			expect(displayName).not.toContain(parishioner.lastName);
  26  | 			expect(displayName).not.toContain(parishioner.email || "");
  27  | 			expect(displayName).not.toContain(parishioner.phone);
  28  | 		}
  29  | 	});
  30  | 
  31  | 	test("Phone number formats normalization (0803..., +234803..., 234803..., 0803 411 2233)", async () => {
  32  | 		const parishioner = await findSeededParishioner();
  33  | 		const orgId = parishioner.organizationId;
  34  | 
  35  | 		// Extract 8-digit base from 0803...
  36  | 		const rawDigits = parishioner.phone.replace(/\D/g, "").slice(-10); // 10 digits without leading 0
  37  | 		const base10 = rawDigits.length === 10 ? rawDigits : "8034112233";
  38  | 
  39  | 		const formats = [
  40  | 			`0${base10}`,
  41  | 			`+234${base10}`,
  42  | 			`234${base10}`,
  43  | 			`0${base10.slice(0, 3)} ${base10.slice(3, 6)} ${base10.slice(6)}`,
  44  | 		];
  45  | 
  46  | 		for (const fmt of formats) {
  47  | 			const norm = normaliseNgPhone(fmt);
  48  | 			expect(norm.ok).toBe(true);
  49  | 
  50  | 			const lookup = await lookupParishionerByPhone(orgId, fmt);
  51  | 			expect(lookup.success).toBe(true);
  52  | 			expect(lookup.data?.parishionerId).toBe(parishioner.id);
  53  | 		}
  54  | 	});
  55  | 
  56  | 	test("Failure states: unknown number, wrong code (attempts remaining), too many attempts (cooldown)", async ({
  57  | 		page,
  58  | 	}) => {
  59  | 		const parishioner = await findSeededParishioner();
  60  | 		const orgId = parishioner.organizationId;
  61  | 
  62  | 		// Unknown phone number
  63  | 		const unknownLookup = await lookupParishionerByPhone(orgId, "08099999999");
  64  | 		expect(unknownLookup.success).toBe(true);
  65  | 		expect(unknownLookup.data).toBeNull(); // No match
  66  | 
  67  | 		// Wrong access code attempts
  68  | 		const codeHash = await bcrypt.hash("654321", 10);
  69  | 		await db.parishAccessCode.create({
  70  | 			data: {
  71  | 				organizationId: orgId,
  72  | 				parishionerId: parishioner.id,
  73  | 				codeHash,
  74  | 				issuedById: (await getAdminUser()).id,
  75  | 				expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  76  | 			},
  77  | 		});
  78  | 
  79  | 		// Lock-in sheet test on /feed
  80  | 		await page.goto("/feed");
  81  | 		const lockInBtn = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
  82  | 		if (await lockInBtn.isVisible()) {
  83  | 			await lockInBtn.click();
  84  | 		}
  85  | 
> 86  | 		await page.waitForSelector('input[type="tel"], input[name="phone"]', { state: "visible" });
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  87  | 		await page.fill('input[type="tel"], input[name="phone"]', parishioner.phone);
  88  | 		await page.click('button:has-text("Continue"), button[type="submit"]');
  89  | 
  90  | 		await page.waitForSelector('text="Confirm your identity"');
  91  | 		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');
  92  | 
  93  | 		// Enter WRONG code
  94  | 		const codeInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
  95  | 		await codeInput.fill("000000");
  96  | 		await page.click('button:has-text("Submit"), button:has-text("Sign in"), button[type="submit"]');
  97  | 
  98  | 		// Expect failure message / remaining attempts copy
  99  | 		await expect(
  100 | 			page.locator("text=didn't match").or(page.locator("text=tries left")).or(page.locator("text=Try again")),
  101 | 		).toBeVisible();
  102 | 	});
  103 | 
  104 | 	test("Pending action replay: triggering action while signed out resumes after lock-in", async ({
  105 | 		page,
  106 | 	}) => {
  107 | 		await page.goto("/feed");
  108 | 		// Check for any action trigger e.g. Give or Like/Share
  109 | 		const actionBtn = page.locator('button:has-text("Give"), button:has-text("Donate")').first();
  110 | 		if (await actionBtn.isVisible()) {
  111 | 			await actionBtn.click();
  112 | 			// Lock-in sheet opens with pendingLabel set
  113 | 			await expect(page.locator('text="Give"').or(page.locator('[data-state="open"]'))).toBeVisible();
  114 | 		}
  115 | 	});
  116 | });
  117 | 
```