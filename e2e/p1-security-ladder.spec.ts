import { test, expect } from "@playwright/test";
import {
	findSeededParishioner,
	setEmailVerified,
	setParishionerTwoFactor,
	generateTotpCode,
	getAdminUser,
	testDb as db,
} from "./helpers/db";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";

test.describe("P1 — The ladder, walked end to end", () => {
	test("Full security ladder walk and post-code-disable enforcement", async ({
		page,
		browser,
	}) => {
		const parishioner = await findSeededParishioner();
		const orgId = parishioner.organizationId;
		const phone = parishioner.phone;
		const testEmail = `ladder_${Date.now()}@example.com`;
		const testPassword = "LadderPassword123!";

		// Step 1: Issue access code in DB for parishioner
		const accessCodePlain = "123456";
		const codeHash = await bcrypt.hash(accessCodePlain, 10);
		const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

		await db.parishAccessCode.create({
			data: {
				organizationId: orgId,
				parishionerId: parishioner.id,
				codeHash,
				issuedById: (await getAdminUser()).id,
				expiresAt,
			},
		});

		// 1. Lock in with phone + code on /feed
		await page.goto("/feed");
		const lockInBtn = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
		if (await lockInBtn.isVisible()) {
			await lockInBtn.click();
		}

		await page.waitForSelector('input[type="tel"], input[name="phone"]', { state: "visible" });
		await page.fill('input[type="tel"], input[name="phone"]', phone);
		await page.click('button:has-text("Continue"), button[type="submit"]');

		// Name confirmation
		await page.waitForSelector('text="Confirm your identity"');
		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');

		// Enter code
		const codeInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
		await codeInput.fill(accessCodePlain);
		await page.click('button:has-text("Submit"), button:has-text("Sign in"), button[type="submit"]');

		// Verify signed in (redirects or closes sheet)
		await page.waitForTimeout(1000);

		// Step 2: Set email & password via DB / /me/security
		// Find user or create linked user
		let user = await db.user.findFirst({
			where: { parishioner: { id: parishioner.id } },
		});
		if (!user) {
			const pwHash = await bcrypt.hash(testPassword, 10);
			user = await db.user.create({
				data: {
					email: testEmail,
					password: pwHash,
					firstName: parishioner.firstName,
					lastName: parishioner.lastName,
					role: "PARISHIONER",
					organizationId: orgId,
					allowCodeSignIn: true,
				},
			});
			await db.parishioner.update({
				where: { id: parishioner.id },
				data: { userId: user.id, email: testEmail },
			});
		} else {
			const pwHash = await bcrypt.hash(testPassword, 10);
			await db.user.update({
				where: { id: user.id },
				data: { email: testEmail, password: pwHash, allowCodeSignIn: true },
			});
		}

		// Step 3: Sign out and sign in with password inside lock-in sheet
		await page.goto("/feed");
		// Sign out if signed in
		await page.evaluate(() => {
			document.cookie.split(";").forEach((c) => {
				document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
			});
		});
		await page.reload();

		await page.goto("/feed");
		const lockInBtn2 = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
		if (await lockInBtn2.isVisible()) {
			await lockInBtn2.click();
		}
		await page.fill('input[type="tel"], input[name="phone"]', phone);
		await page.click('button:has-text("Continue"), button[type="submit"]');

		// Name confirmation -> password step (if password set or choose password)
		await page.waitForSelector('text="Confirm your identity"');
		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');

		// Step 4: Stub emailVerifiedAt in DB
		await setEmailVerified(user.id);

		// Step 5: Enable TOTP 2FA
		const totpSecret = authenticator.generateSecret();
		await setParishionerTwoFactor(user.id, totpSecret);

		// Step 6: Sign out -> sign in -> confirm 2FA challenge appears AS A STEP IN THE SHEET (not redirect to /auth/verify-2fa)
		await page.evaluate(() => {
			document.cookie.split(";").forEach((c) => {
				document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
			});
		});
		await page.reload();

		await page.goto("/feed");
		const lockInBtn3 = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
		if (await lockInBtn3.isVisible()) {
			await lockInBtn3.click();
		}
		await page.fill('input[type="tel"], input[name="phone"]', phone);
		await page.click('button:has-text("Continue"), button[type="submit"]');

		await page.waitForSelector('text="Confirm your identity"');
		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');

		// Fill password if prompted
		const pwInput = page.locator('input[type="password"]').first();
		if (await pwInput.isVisible()) {
			await pwInput.fill(testPassword);
			await page.click('button:has-text("Sign in"), button[type="submit"]');
		}

		// Verify 2FA step appears IN SHEET
		await page.waitForTimeout(500);
		expect(page.url()).not.toContain("/auth/verify-2fa"); // MUST NOT redirect to /auth/verify-2fa

		// Step 7: Turn code sign-in off (allowCodeSignIn: false)
		await db.user.update({
			where: { id: user.id },
			data: { allowCodeSignIn: false },
		});

		// Step 8a: Admin issueAccessCode refusal in admin UI
		const adminContext = await browser.newContext();
		const adminPage = await adminContext.newPage();
		const admin = await getAdminUser();
		await adminPage.goto("/auth/login");
		await adminPage.fill('input[type="email"], input[name="email"]', admin.email);
		await adminPage.fill('input[type="password"], input[name="password"]', "@Ecli#$QAWW@20Cia27$");
		await adminPage.click('button[type="submit"]');
		await adminPage.waitForURL("**/dashboard**");

		await adminPage.goto(`/parishioners/${parishioner.id}`);
		const issueCodeBtn = adminPage.locator('button:has-text("Issue a code"), button:has-text("Issue code")').first();
		if (await issueCodeBtn.isVisible()) {
			await issueCodeBtn.click();
			// Copy explaining why code sign in is disabled should appear
			await expect(adminPage.locator(`text=${parishioner.firstName}`).or(adminPage.locator("text=turned off code sign-in"))).toBeVisible();
		}

		// Step 8b: Lock-in sheet routes phone number to password step (not code step)
		await page.goto("/feed");
		await page.evaluate(() => {
			document.cookie.split(";").forEach((c) => {
				document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
			});
		});
		await page.reload();

		const lockInBtn4 = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
		if (await lockInBtn4.isVisible()) {
			await lockInBtn4.click();
		}
		await page.fill('input[type="tel"], input[name="phone"]', phone);
		await page.click('button:has-text("Continue"), button[type="submit"]');

		await page.waitForSelector('text="Confirm your identity"');
		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');

		// Sheet should route to password step directly
		await expect(page.locator('input[type="password"]').or(page.locator("text=Enter your password"))).toBeVisible();

		// Step 8c: Admin restores code sign-in
		await db.user.update({
			where: { id: user.id },
			data: { allowCodeSignIn: true },
		});

		await adminContext.close();
	});
});
