import crypto from "crypto";
import { authenticator } from "otplib";

authenticator.options = {
	digits: 6,
	step: 30,
	window: 1,
};

const ISSUER = "Ecclesia DPM";

function getEncryptionKey(): Buffer {
	const rawKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
	if (!rawKey) {
		throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not configured");
	}

	const key = Buffer.from(rawKey, "base64");
	if (key.length !== 32) {
		throw new Error("TWO_FACTOR_ENCRYPTION_KEY must be 32 bytes (base64)");
	}

	return key;
}

export function generateEmailOtp(): { code: string; codeHash: string } {
	// randomInt, not Math.random: this is a credential. Math.random is seeded
	// predictably enough that a six-digit code drawn from it is guessable given
	// a few observed samples, and this OTP now guards parishioner accounts as
	// well as staff ones.
	const code = crypto.randomInt(100000, 1000000).toString();
	const codeHash = crypto.createHash("sha256").update(code).digest("hex");
	return { code, codeHash };
}

export function generateTotpSecret(email: string): {
	secret: string;
	otpauthUrl: string;
} {
	const secret = authenticator.generateSecret();
	const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
	return { secret, otpauthUrl };
}

export function verifyTotpCode(secret: string, code: string): boolean {
	return authenticator.check(code, secret);
}

export function encryptTotpSecret(secret: string): string {
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([
		cipher.update(secret, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();

	return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptTotpSecret(payload: string): string {
	const [ivBase64, tagBase64, dataBase64] = payload.split(":");
	if (!ivBase64 || !tagBase64 || !dataBase64) {
		throw new Error("Invalid encrypted secret format");
	}

	const key = getEncryptionKey();
	const iv = Buffer.from(ivBase64, "base64");
	const tag = Buffer.from(tagBase64, "base64");
	const encrypted = Buffer.from(dataBase64, "base64");
	const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(tag);
	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);
	return decrypted.toString("utf8");
}
