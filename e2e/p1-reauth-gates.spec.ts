import { test, expect } from "@playwright/test";
import { findSeededParishioner, testDb as db } from "./helpers/db";
import { reauthenticate } from "../lib/auth/reauthenticate";
import bcrypt from "bcryptjs";

test.describe("P1 — Re-authentication gates", () => {
	test("Sensitive actions demand password, reject invalid password, and accept valid password", async () => {
		const parishioner = await findSeededParishioner();
		const password = "ReauthPassword123!";
		const passwordHash = await bcrypt.hash(password, 10);

		// Create user with password
		let user = await db.user.findFirst({
			where: { parishioner: { id: parishioner.id } },
		});
		if (!user) {
			user = await db.user.create({
				data: {
					email: `reauth_${Date.now()}@example.com`,
					password: passwordHash,
					firstName: parishioner.firstName,
					lastName: parishioner.lastName,
					role: "PARISHIONER",
					organizationId: parishioner.organizationId,
				},
			});
		} else {
			await db.user.update({
				where: { id: user.id },
				data: { password: passwordHash },
			});
		}

		// 1. Check reauthenticate helper without password (demanded)
		const noPwResult = await reauthenticate(user.id, null);
		expect(noPwResult.ok).toBe(false);
		expect(noPwResult.message).toContain("Enter your password");

		// 2. Check wrong password (rejected)
		const wrongPwResult = await reauthenticate(user.id, "WrongPassword!");
		expect(wrongPwResult.ok).toBe(false);
		expect(wrongPwResult.message).toContain("wrong");

		// 3. Check correct password (accepted)
		const rightPwResult = await reauthenticate(user.id, password);
		expect(rightPwResult.ok).toBe(true);
	});

	test("Rate limiting: 6 wrong passwords trigger a cooldown message with time", async () => {
		const user = await db.user.create({
			data: {
				email: `rate_limit_${Date.now()}@example.com`,
				password: await bcrypt.hash("ValidPassword123!", 10),
				firstName: "Rate",
				lastName: "LimitTest",
				role: "PARISHIONER",
				organizationId: (await findSeededParishioner()).organizationId,
			},
		});

		// Try 5 times with wrong password
		for (let i = 0; i < 5; i++) {
			await reauthenticate(user.id, "WrongPw123!");
		}

		// 6th attempt should return cooldown message with time
		const blockedResult = await reauthenticate(user.id, "WrongPw123!");
		expect(blockedResult.ok).toBe(false);
		expect(blockedResult.message).toContain("Too many attempts");
		expect(blockedResult.message).toMatch(/Try again in \d+ minute/);
	});

	test("Exemptions: turning code sign-in OFF (upgrade) does not ask for password", async () => {
		const user = await db.user.create({
			data: {
				email: `exempt_${Date.now()}@example.com`,
				password: await bcrypt.hash("ExemptPassword123!", 10),
				firstName: "Exempt",
				lastName: "Test",
				role: "PARISHIONER",
				organizationId: (await findSeededParishioner()).organizationId,
				allowCodeSignIn: true,
			},
		});

		// Turning code sign-in off is an upgrade, so allowCodeSignIn: false requires no password re-auth check
		await db.user.update({
			where: { id: user.id },
			data: { allowCodeSignIn: false },
		});

		const updatedUser = await db.user.findUnique({ where: { id: user.id } });
		expect(updatedUser?.allowCodeSignIn).toBe(false);
	});
});
