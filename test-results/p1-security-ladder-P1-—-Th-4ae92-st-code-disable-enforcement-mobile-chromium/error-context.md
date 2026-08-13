# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p1-security-ladder.spec.ts >> P1 — The ladder, walked end to end >> Full security ladder walk and post-code-disable enforcement
- Location: e2e\p1-security-ladder.spec.ts:14:6

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[type="tel"], input[name="phone"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e5]:
      - generic [ref=e6]: Ecclesia
      - generic [ref=e10]:
        - heading "See your own parish here" [level=2] [ref=e11]
        - paragraph [ref=e12]: Mass times, announcements and giving from the parish you attend.
        - generic [ref=e13]:
          - link "Find my parish" [ref=e14] [cursor=pointer]:
            - /url: /start
          - link "Not now" [ref=e15] [cursor=pointer]:
            - /url: /explore
      - generic [ref=e16]:
        - heading "Nothing here yet" [level=2] [ref=e21]
        - paragraph [ref=e22]: No parish has posted anything public yet. Find your parish to see what's happening there.
        - link "Look at another parish" [ref=e23] [cursor=pointer]:
          - /url: /explore
    - navigation "Primary" [ref=e24]:
      - link "Feed" [ref=e25] [cursor=pointer]:
        - /url: /feed
      - link "Explore" [ref=e29] [cursor=pointer]:
        - /url: /explore
      - link "Give" [ref=e34] [cursor=pointer]:
        - /url: /give
        - img [ref=e35]:
          - generic [ref=e37]: ₦
      - link "Alerts" [ref=e39] [cursor=pointer]:
        - /url: /alerts
      - link "Me" [ref=e44] [cursor=pointer]:
        - /url: /me
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e54] [cursor=pointer]
  - alert [ref=e58]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import {
  3   | 	findSeededParishioner,
  4   | 	setEmailVerified,
  5   | 	setParishionerTwoFactor,
  6   | 	generateTotpCode,
  7   | 	getAdminUser,
  8   | 	testDb as db,
  9   | } from "./helpers/db";
  10  | import bcrypt from "bcryptjs";
  11  | import { authenticator } from "otplib";
  12  | 
  13  | test.describe("P1 — The ladder, walked end to end", () => {
  14  | 	test("Full security ladder walk and post-code-disable enforcement", async ({
  15  | 		page,
  16  | 		browser,
  17  | 	}) => {
  18  | 		const parishioner = await findSeededParishioner();
  19  | 		const orgId = parishioner.organizationId;
  20  | 		const phone = parishioner.phone;
  21  | 		const testEmail = `ladder_${Date.now()}@example.com`;
  22  | 		const testPassword = "LadderPassword123!";
  23  | 
  24  | 		// Step 1: Issue access code in DB for parishioner
  25  | 		const accessCodePlain = "123456";
  26  | 		const codeHash = await bcrypt.hash(accessCodePlain, 10);
  27  | 		const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  28  | 
  29  | 		await db.parishAccessCode.create({
  30  | 			data: {
  31  | 				organizationId: orgId,
  32  | 				parishionerId: parishioner.id,
  33  | 				codeHash,
  34  | 				issuedById: (await getAdminUser()).id,
  35  | 				expiresAt,
  36  | 			},
  37  | 		});
  38  | 
  39  | 		// 1. Lock in with phone + code on /feed
  40  | 		await page.goto("/feed");
  41  | 		const lockInBtn = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
  42  | 		if (await lockInBtn.isVisible()) {
  43  | 			await lockInBtn.click();
  44  | 		}
  45  | 
> 46  | 		await page.waitForSelector('input[type="tel"], input[name="phone"]', { state: "visible" });
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  47  | 		await page.fill('input[type="tel"], input[name="phone"]', phone);
  48  | 		await page.click('button:has-text("Continue"), button[type="submit"]');
  49  | 
  50  | 		// Name confirmation
  51  | 		await page.waitForSelector('text="Confirm your identity"');
  52  | 		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');
  53  | 
  54  | 		// Enter code
  55  | 		const codeInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
  56  | 		await codeInput.fill(accessCodePlain);
  57  | 		await page.click('button:has-text("Submit"), button:has-text("Sign in"), button[type="submit"]');
  58  | 
  59  | 		// Verify signed in (redirects or closes sheet)
  60  | 		await page.waitForTimeout(1000);
  61  | 
  62  | 		// Step 2: Set email & password via DB / /me/security
  63  | 		// Find user or create linked user
  64  | 		let user = await db.user.findFirst({
  65  | 			where: { parishioner: { id: parishioner.id } },
  66  | 		});
  67  | 		if (!user) {
  68  | 			const pwHash = await bcrypt.hash(testPassword, 10);
  69  | 			user = await db.user.create({
  70  | 				data: {
  71  | 					email: testEmail,
  72  | 					password: pwHash,
  73  | 					firstName: parishioner.firstName,
  74  | 					lastName: parishioner.lastName,
  75  | 					role: "PARISHIONER",
  76  | 					organizationId: orgId,
  77  | 					allowCodeSignIn: true,
  78  | 				},
  79  | 			});
  80  | 			await db.parishioner.update({
  81  | 				where: { id: parishioner.id },
  82  | 				data: { userId: user.id, email: testEmail },
  83  | 			});
  84  | 		} else {
  85  | 			const pwHash = await bcrypt.hash(testPassword, 10);
  86  | 			await db.user.update({
  87  | 				where: { id: user.id },
  88  | 				data: { email: testEmail, password: pwHash, allowCodeSignIn: true },
  89  | 			});
  90  | 		}
  91  | 
  92  | 		// Step 3: Sign out and sign in with password inside lock-in sheet
  93  | 		await page.goto("/feed");
  94  | 		// Sign out if signed in
  95  | 		await page.evaluate(() => {
  96  | 			document.cookie.split(";").forEach((c) => {
  97  | 				document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  98  | 			});
  99  | 		});
  100 | 		await page.reload();
  101 | 
  102 | 		await page.goto("/feed");
  103 | 		const lockInBtn2 = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
  104 | 		if (await lockInBtn2.isVisible()) {
  105 | 			await lockInBtn2.click();
  106 | 		}
  107 | 		await page.fill('input[type="tel"], input[name="phone"]', phone);
  108 | 		await page.click('button:has-text("Continue"), button[type="submit"]');
  109 | 
  110 | 		// Name confirmation -> password step (if password set or choose password)
  111 | 		await page.waitForSelector('text="Confirm your identity"');
  112 | 		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');
  113 | 
  114 | 		// Step 4: Stub emailVerifiedAt in DB
  115 | 		await setEmailVerified(user.id);
  116 | 
  117 | 		// Step 5: Enable TOTP 2FA
  118 | 		const totpSecret = authenticator.generateSecret();
  119 | 		await setParishionerTwoFactor(user.id, totpSecret);
  120 | 
  121 | 		// Step 6: Sign out -> sign in -> confirm 2FA challenge appears AS A STEP IN THE SHEET (not redirect to /auth/verify-2fa)
  122 | 		await page.evaluate(() => {
  123 | 			document.cookie.split(";").forEach((c) => {
  124 | 				document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  125 | 			});
  126 | 		});
  127 | 		await page.reload();
  128 | 
  129 | 		await page.goto("/feed");
  130 | 		const lockInBtn3 = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
  131 | 		if (await lockInBtn3.isVisible()) {
  132 | 			await lockInBtn3.click();
  133 | 		}
  134 | 		await page.fill('input[type="tel"], input[name="phone"]', phone);
  135 | 		await page.click('button:has-text("Continue"), button[type="submit"]');
  136 | 
  137 | 		await page.waitForSelector('text="Confirm your identity"');
  138 | 		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');
  139 | 
  140 | 		// Fill password if prompted
  141 | 		const pwInput = page.locator('input[type="password"]').first();
  142 | 		if (await pwInput.isVisible()) {
  143 | 			await pwInput.fill(testPassword);
  144 | 			await page.click('button:has-text("Sign in"), button[type="submit"]');
  145 | 		}
  146 | 
```