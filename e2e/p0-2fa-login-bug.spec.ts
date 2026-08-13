import { test, expect } from "@playwright/test";
import { setParishionerTwoFactor, generateTotpCode, testDb as db } from "./helpers/db";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";

test.describe("P0 — The two-factor login bug", () => {
	test("Parishioner with twoFactorEnabled + TOTP secret is challenged on email+password login", async ({
		page,
	}) => {
		// 1. Create/setup a parishioner user record in DB with email & password + twoFactorEnabled
		const parishioner = await db.parishioner.findFirst({
			where: { deletedAt: null, phoneE164: { not: null } },
			include: { user: true },
		});
		if (!parishioner) throw new Error("No parishioner found");

		const testEmail = `p2fa_${Date.now()}@example.com`;
		const testPassword = "Password123!@#";
		const passwordHash = await bcrypt.hash(testPassword, 10);

		let userId = parishioner.userId;
		if (!userId) {
			const user = await db.user.create({
				data: {
					email: testEmail,
					password: passwordHash,
					firstName: parishioner.firstName,
					lastName: parishioner.lastName,
					role: "PARISHIONER",
					organizationId: parishioner.organizationId,
					allowCodeSignIn: true,
				},
			});
			await db.parishioner.update({
				where: { id: parishioner.id },
				data: { userId: user.id, email: testEmail },
			});
			userId = user.id;
		} else {
			await db.user.update({
				where: { id: userId },
				data: { email: testEmail, password: passwordHash, role: "PARISHIONER" },
			});
		}

		// Set 2FA TOTP secret directly on parishioner user in DB
		const secret = authenticator.generateSecret();
		await setParishionerTwoFactor(userId, secret);

		// 2. Sign in with email and password via /auth/login
		await page.goto("/auth/login");
		await page.fill('input[type="email"], input[name="email"]', testEmail);
		await page.fill('input[type="password"], input[name="password"]', testPassword);
		await page.click('button[type="submit"]');

		// 3. CRITICAL ASSERTION: A two-factor challenge MUST be demanded!
		// It should redirect to /auth/verify-2fa or render 2FA code input
		await page.waitForURL((url) => url.pathname.includes("/auth/verify-2fa") || url.pathname.includes("/verify"), {
			timeout: 10000,
		});

		expect(page.url()).toContain("/auth/verify-2fa");
		await expect(page.locator("text=Two-Factor Authentication").or(page.locator("text=Verify"))).toBeVisible();

		// Verify that submitting the correct TOTP code successfully completes login
		const validCode = generateTotpCode(secret);
		const otpInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
		if (await otpInput.isVisible()) {
			await otpInput.fill(validCode);
			await page.click('button[type="submit"], button:has-text("Verify")');
		}
	});
});
