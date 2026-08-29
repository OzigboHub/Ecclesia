import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";
import crypto from "crypto";
import { authenticator } from "otplib";
import type { Page } from "@playwright/test";

authenticator.options = { digits: 6, step: 30, window: 1 };

function createDbClient() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) throw new Error("DATABASE_URL is not set");
	neonConfig.webSocketConstructor = globalThis.WebSocket ?? WebSocket;
	const adapter = new PrismaNeon({ connectionString });
	return new PrismaClient({ adapter });
}

export const testDb = createDbClient();

export const NG_COUNTRY_CODE = "234";
const VALID_LEADING_DIGITS = new Set(["7", "8", "9"]);

export function normaliseNgPhone(input: string | null | undefined) {
	if (!input) return { ok: false as const, reason: "empty" as const };
	const trimmed = input.trim();
	const digits = trimmed.replace(/\D/g, "");
	if (!digits) return { ok: false as const, reason: "empty" as const };

	let national: string | null = null;
	if (digits.startsWith("00234")) {
		national = digits.slice(5);
	} else if (digits.startsWith(NG_COUNTRY_CODE) && digits.length >= 12) {
		national = digits.slice(3);
	} else if (digits.startsWith("0")) {
		national = digits.slice(1);
	} else {
		national = digits;
	}

	if (national.length === 11 && national.startsWith("0")) {
		national = national.slice(1);
	}

	if (national.length < 10) return { ok: false as const, reason: "too-short" as const };
	if (national.length > 10) return { ok: false as const, reason: "too-long" as const };
	if (!VALID_LEADING_DIGITS.has(national[0])) {
		return { ok: false as const, reason: "unrecognised" as const };
	}

	return {
		ok: true as const,
		e164: `+${NG_COUNTRY_CODE}${national}`,
		national,
	};
}

export async function lookupParishionerByPhoneTest(organizationId: string, phone: string) {
	const parsed = normaliseNgPhone(phone);
	if (!parsed.ok) {
		return { success: false, message: "Invalid phone number", data: null };
	}
	const parishioner = await testDb.parishioner.findFirst({
		where: { organizationId, phoneE164: parsed.e164, deletedAt: null, isActive: true },
		select: { id: true, firstName: true, lastName: true, organizationId: true, organization: { select: { name: true } } },
	});
	if (!parishioner) {
		return { success: true, message: "No match", data: null };
	}
	const initial = parishioner.lastName.trim().charAt(0).toUpperCase();
	return {
		success: true,
		message: "Found",
		data: {
			parishionerId: parishioner.id,
			displayName: initial ? `${parishioner.firstName} ${initial}.` : parishioner.firstName,
			organizationId: parishioner.organizationId,
			organizationName: parishioner.organization.name,
		},
	};
}

export function generateTotpCode(secret: string): string {
	return authenticator.generate(secret);
}

export function encryptTotpSecret(secret: string): string {
	const rawKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
	if (!rawKey) throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not set");
	const key = Buffer.from(rawKey, "base64");
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptTotpSecret(payload: string): string {
	const [ivBase64, tagBase64, dataBase64] = payload.split(":");
	if (!ivBase64 || !tagBase64 || !dataBase64) {
		throw new Error("Invalid encrypted secret format");
	}
	const rawKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
	if (!rawKey) throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not set");
	const key = Buffer.from(rawKey, "base64");
	const iv = Buffer.from(ivBase64, "base64");
	const tag = Buffer.from(tagBase64, "base64");
	const encrypted = Buffer.from(dataBase64, "base64");
	const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(tag);
	const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
	return decrypted.toString("utf8");
}

export async function findSeededParishioner() {
	const parishioner = await testDb.parishioner.findFirst({
		where: {
			deletedAt: null,
			phoneE164: { not: null },
			userId: null,
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			phone: true,
			phoneE164: true,
			organizationId: true,
		},
	});
	if (!parishioner) {
		throw new Error("No unlinked seeded parishioner found");
	}
	return parishioner;
}

export async function getAdminUser(): Promise<{ id: string; email: string; password: string | null; twoFactorEnabled: boolean; twoFactorSecret: string | null }> {
	const admin = await testDb.user.findUnique({
		where: { email: "admin@ecclesialight.com" },
		select: { id: true, email: true, password: true, twoFactorEnabled: true, twoFactorSecret: true },
	});
	if (!admin || !admin.email) {
		throw new Error("Admin user admin@ecclesialight.com not found");
	}
	return admin as { id: string; email: string; password: string | null; twoFactorEnabled: boolean; twoFactorSecret: string | null };
}

export async function getAdminTotpCode(): Promise<string> {
	const admin = await getAdminUser();
	if (!admin.twoFactorSecret) {
		throw new Error("Admin user does not have twoFactorSecret set");
	}
	const secret = decryptTotpSecret(admin.twoFactorSecret);
	return authenticator.generate(secret);
}

export async function loginAsAdmin(page: Page) {
	await page.goto("/auth/login");
	await page.fill('input[name="email"], input[type="email"]', "admin@ecclesialight.com");
	await page.fill('input[name="password"], input[type="password"]', "@Ecli#$QAWW@20Cia27$");
	await page.click('button[type="submit"]');

	await page.waitForURL((url) => url.pathname.includes("/auth/verify-2fa") || url.pathname.includes("/dashboard"), { timeout: 15000 }).catch(() => {});

	if (page.url().includes("/auth/verify-2fa")) {
		const code = await getAdminTotpCode();
		const otpInput = page.locator("input").first();
		await otpInput.focus();
		await page.keyboard.type(code, { delay: 50 });
		await page.click('button:has-text("Verify")');
	}

	await page.waitForURL("**/dashboard**", { timeout: 20000 });
}

export async function setParishionerTwoFactor(userId: string, secret: string) {
	const encryptedSecret = encryptTotpSecret(secret);
	await testDb.user.update({
		where: { id: userId },
		data: {
			twoFactorEnabled: true,
			twoFactorMethod: "TOTP",
			twoFactorSecret: encryptedSecret,
		},
	});
}

export async function setEmailVerified(userId: string) {
	await testDb.user.update({
		where: { id: userId },
		data: {
			emailVerifiedAt: new Date(),
		},
	});
}

export async function backdateUserSessions(userId: string, minutesAgo: number) {
	const backdatedTime = new Date(Date.now() - minutesAgo * 60 * 1000);
	await testDb.userSession.updateMany({
		where: { userId },
		data: {
			lastSeenAt: backdatedTime,
		},
	});
}

export async function getParishionerUser(phoneE164: string) {
	const parishioner = await testDb.parishioner.findFirst({
		where: { phoneE164, deletedAt: null },
		include: { user: true },
	});
	return parishioner?.user || null;
}
