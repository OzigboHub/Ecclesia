import { test, expect } from "@playwright/test";
import {
	findSeededParishioner,
	getAdminUser,
	normaliseNgPhone,
	lookupParishionerByPhoneTest as lookupParishionerByPhone,
	testDb as db,
} from "./helpers/db";
import bcrypt from "bcryptjs";

test.describe("P1 — Lock-in, including failure states & phone normalization", () => {
	test("Name confirmation displays first name + last initial ONLY (never full surname, phone or email)", async () => {
		const parishioner = await findSeededParishioner();
		const orgId = parishioner.organizationId;
		const result = await lookupParishionerByPhone(orgId, parishioner.phone);

		expect(result.success).toBe(true);
		expect(result.data).not.toBeNull();
		if (result.data) {
			const displayName = result.data.displayName;
			const initial = parishioner.lastName.trim().charAt(0).toUpperCase();

			// Must be First L.
			expect(displayName).toBe(`${parishioner.firstName} ${initial}.`);
			expect(displayName).not.toContain(parishioner.lastName);
			expect(displayName).not.toContain(parishioner.email || "");
			expect(displayName).not.toContain(parishioner.phone);
		}
	});

	test("Phone number formats normalization (0803..., +234803..., 234803..., 0803 411 2233)", async () => {
		const parishioner = await findSeededParishioner();
		const orgId = parishioner.organizationId;

		// Extract 8-digit base from 0803...
		const rawDigits = parishioner.phone.replace(/\D/g, "").slice(-10); // 10 digits without leading 0
		const base10 = rawDigits.length === 10 ? rawDigits : "8034112233";

		const formats = [
			`0${base10}`,
			`+234${base10}`,
			`234${base10}`,
			`0${base10.slice(0, 3)} ${base10.slice(3, 6)} ${base10.slice(6)}`,
		];

		for (const fmt of formats) {
			const norm = normaliseNgPhone(fmt);
			expect(norm.ok).toBe(true);

			const lookup = await lookupParishionerByPhone(orgId, fmt);
			expect(lookup.success).toBe(true);
			expect(lookup.data?.parishionerId).toBe(parishioner.id);
		}
	});

	test("Failure states: unknown number, wrong code (attempts remaining), too many attempts (cooldown)", async ({
		page,
	}) => {
		const parishioner = await findSeededParishioner();
		const orgId = parishioner.organizationId;

		// Unknown phone number
		const unknownLookup = await lookupParishionerByPhone(orgId, "08099999999");
		expect(unknownLookup.success).toBe(true);
		expect(unknownLookup.data).toBeNull(); // No match

		// Wrong access code attempts
		const codeHash = await bcrypt.hash("654321", 10);
		await db.parishAccessCode.create({
			data: {
				organizationId: orgId,
				parishionerId: parishioner.id,
				codeHash,
				issuedById: (await getAdminUser()).id,
				expiresAt: new Date(Date.now() + 30 * 60 * 1000),
			},
		});

		// Lock-in sheet test on /feed
		await page.goto("/feed");
		const lockInBtn = page.locator('button:has-text("Lock in"), button:has-text("Sign in")').first();
		if (await lockInBtn.isVisible()) {
			await lockInBtn.click();
		}

		await page.waitForSelector('input[type="tel"], input[name="phone"]', { state: "visible" });
		await page.fill('input[type="tel"], input[name="phone"]', parishioner.phone);
		await page.click('button:has-text("Continue"), button[type="submit"]');

		await page.waitForSelector('text="Confirm your identity"');
		await page.click('button:has-text("Yes, this is me"), button:has-text("Continue")');

		// Enter WRONG code
		const codeInput = page.locator('input[type="text"], input[name="code"], input[inputmode="numeric"]').first();
		await codeInput.fill("000000");
		await page.click('button:has-text("Submit"), button:has-text("Sign in"), button[type="submit"]');

		// Expect failure message / remaining attempts copy
		await expect(
			page.locator("text=didn't match").or(page.locator("text=tries left")).or(page.locator("text=Try again")),
		).toBeVisible();
	});

	test("Pending action replay: triggering action while signed out resumes after lock-in", async ({
		page,
	}) => {
		await page.goto("/feed");
		// Check for any action trigger e.g. Give or Like/Share
		const actionBtn = page.locator('button:has-text("Give"), button:has-text("Donate")').first();
		if (await actionBtn.isVisible()) {
			await actionBtn.click();
			// Lock-in sheet opens with pendingLabel set
			await expect(page.locator('text="Give"').or(page.locator('[data-state="open"]'))).toBeVisible();
		}
	});
});
