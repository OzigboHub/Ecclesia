import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The device-side half of the parish gate.
 *
 * Once someone enters a parish's shared code, that device is remembered for six
 * months. The proof is an HMAC over the parish id and an expiry, stored in an
 * httpOnly cookie — so it survives a reload, cannot be forged by editing local
 * storage, and needs no database round-trip to check on every feed request.
 */

const COOKIE_PREFIX = "pg_";
export const GATE_COOKIE_MAX_AGE = 180 * 24 * 60 * 60;

export function gateCookieName(organizationId: string): string {
	return `${COOKIE_PREFIX}${organizationId}`;
}

function secret(): string {
	const value = process.env.AUTH_SECRET;
	if (!value) {
		throw new Error("AUTH_SECRET is required to sign parish gate cookies");
	}
	return value;
}

function sign(payload: string): string {
	return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Build the cookie value: "<expiryMs>.<signature>". */
export function createGatePass(
	organizationId: string,
	expiresAt = new Date(Date.now() + GATE_COOKIE_MAX_AGE * 1000),
): string {
	const expiry = String(expiresAt.getTime());
	const payload = `${organizationId}.${expiry}`;
	return `${expiry}.${sign(payload)}`;
}

/** Verify a cookie value. Returns false for anything malformed or expired. */
export function verifyGatePass(
	organizationId: string,
	value: string | undefined | null,
): boolean {
	if (!value) return false;

	const separator = value.indexOf(".");
	if (separator <= 0) return false;

	const expiry = value.slice(0, separator);
	const signature = value.slice(separator + 1);

	const expiryMs = Number(expiry);
	if (!Number.isFinite(expiryMs) || expiryMs <= Date.now()) return false;

	const expected = sign(`${organizationId}.${expiry}`);

	// Constant-time compare. Buffer lengths must match first, since
	// timingSafeEqual throws on a length mismatch.
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
