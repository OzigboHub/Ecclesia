# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p0-2fa-login-bug.spec.ts >> P0 — The two-factor login bug >> Parishioner with twoFactorEnabled + TOTP secret is challenged on email+password login
- Location: e2e\p0-2fa-login-bug.spec.ts:7:6

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Two-Factor Authentication').or(locator('text=Verify'))
Expected: visible
Error: strict mode violation: locator('text=Two-Factor Authentication').or(locator('text=Verify')) resolved to 3 elements:
    1) <h2 class="text-2xl font-semibold">Verify Your Sign-in</h2> aka getByRole('heading', { name: 'Verify Your Sign-in' })
    2) <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 rounded-md px-8 w-full mt-6">Verify</button> aka getByRole('button', { name: 'Verify' })
    3) <div class="" data-title="">Verify your sign-in to continue</div> aka getByText('Verify your sign-in to')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Two-Factor Authentication').or(locator('text=Verify'))

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link [ref=e3] [cursor=pointer]:
      - /url: /
      - img "logo" [ref=e4]
    - generic [ref=e5]:
      - link "Home" [ref=e6] [cursor=pointer]:
        - /url: /
      - link "Features" [ref=e7] [cursor=pointer]:
        - /url: "#features"
      - link "Contact" [ref=e8] [cursor=pointer]:
        - /url: /contact
      - link "Parish" [ref=e9] [cursor=pointer]:
        - /url: /parish
      - generic [ref=e10]:
        - button [ref=e11]:
          - link "Register" [ref=e12] [cursor=pointer]:
            - /url: /auth/register
        - button [ref=e13]:
          - link "Login" [ref=e14] [cursor=pointer]:
            - /url: /auth/login
  - generic [ref=e17]:
    - generic [ref=e18]:
      - heading "Verify Your Sign-in" [level=2] [ref=e23]
      - paragraph [ref=e24]: Enter the 6-digit code from your authenticator app.
    - textbox [ref=e26]
    - button "Verify" [ref=e27]
    - link "Use a different account" [ref=e29] [cursor=pointer]:
      - /url: /auth/login
  - region "Notifications alt+T":
    - list:
      - listitem [ref=e30]:
        - generic [ref=e34]: Verify your sign-in to continue
  - button "Open Next.js Dev Tools" [ref=e41] [cursor=pointer]
  - alert [ref=e45]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { setParishionerTwoFactor, generateTotpCode, testDb as db } from "./helpers/db";
  3  | import bcrypt from "bcryptjs";
  4  | import { authenticator } from "otplib";
  5  | 
  6  | test.describe("P0 — The two-factor login bug", () => {
  7  | 	test("Parishioner with twoFactorEnabled + TOTP secret is challenged on email+password login", async ({
  8  | 		page,
  9  | 	}) => {
  10 | 		// 1. Create/setup a parishioner user record in DB with email & password + twoFactorEnabled
  11 | 		const parishioner = await db.parishioner.findFirst({
  12 | 			where: { deletedAt: null, phoneE164: { not: null } },
  13 | 			include: { user: true },
  14 | 		});
  15 | 		if (!parishioner) throw new Error("No parishioner found");
  16 | 
  17 | 		const testEmail = `p2fa_${Date.now()}@example.com`;
  18 | 		const testPassword = "Password123!@#";
  19 | 		const passwordHash = await bcrypt.hash(testPassword, 10);
  20 | 
  21 | 		let userId = parishioner.userId;
  22 | 		if (!userId) {
  23 | 			const user = await db.user.create({
  24 | 				data: {
  25 | 					email: testEmail,
  26 | 					password: passwordHash,
  27 | 					firstName: parishioner.firstName,
  28 | 					lastName: parishioner.lastName,
  29 | 					role: "PARISHIONER",
  30 | 					organizationId: parishioner.organizationId,
  31 | 					allowCodeSignIn: true,
  32 | 				},
  33 | 			});
  34 | 			await db.parishioner.update({
  35 | 				where: { id: parishioner.id },
  36 | 				data: { userId: user.id, email: testEmail },
  37 | 			});
  38 | 			userId = user.id;
  39 | 		} else {
  40 | 			await db.user.update({
  41 | 				where: { id: userId },
  42 | 				data: { email: testEmail, password: passwordHash, role: "PARISHIONER" },
  43 | 			});
  44 | 		}
  45 | 
  46 | 		// Set 2FA TOTP secret directly on parishioner user in DB
  47 | 		const secret = authenticator.generateSecret();
  48 | 		await setParishionerTwoFactor(userId, secret);
  49 | 
  50 | 		// 2. Sign in with email and password via /auth/login
  51 | 		await page.goto("/auth/login");
  52 | 		await page.fill('input[type="email"], input[name="email"]', testEmail);
  53 | 		await page.fill('input[type="password"], input[name="password"]', testPassword);
  54 | 		await page.click('button[type="submit"]');
  55 | 
  56 | 		// 3. CRITICAL ASSERTION: A two-factor challenge MUST be demanded!
  57 | 		// It should redirect to /auth/verify-2fa or render 2FA code input
  58 | 		await page.waitForURL((url) => url.pathname.includes("/auth/verify-2fa") || url.pathname.includes("/verify"), {
  59 | 			timeout: 10000,
  60 | 		});
  61 | 
  62 | 		expect(page.url()).toContain("/auth/verify-2fa");
> 63 | 		await expect(page.locator("text=Two-Factor Authentication").or(page.locator("text=Verify"))).toBeVisible();
     |                                                                                                ^ Error: expect(locator).toBeVisible() failed
  64 | 
  65 | 		// Verify that submitting the correct TOTP code successfully completes login
  66 | 		const validCode = generateTotpCode(secret);
  67 | 		const otpInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
  68 | 		if (await otpInput.isVisible()) {
  69 | 			await otpInput.fill(validCode);
  70 | 			await page.click('button[type="submit"], button:has-text("Verify")');
  71 | 		}
  72 | 	});
  73 | });
  74 | 
```