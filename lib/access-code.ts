import { randomInt } from "node:crypto";

/**
 * One-time access codes for parishioner lock-in.
 *
 * The parish office issues a code, reads it out, and the parishioner types it
 * on their phone. Only a bcrypt hash is stored, so the plaintext exists in
 * exactly one place — the screen the staff member is looking at — and only for
 * as long as they are looking at it. A database dump does not hand over the
 * parish, and no member of staff holds standing power to impersonate anyone.
 */

/**
 * Crockford-ish alphabet: no O/0, no I/1/L, no U. These get read aloud across
 * a parish office counter and written on paper slips, and every excluded
 * character is one somebody would otherwise mis-hear or mis-copy.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export const ACCESS_CODE_LENGTH = 6;

/** How long an issued code stays usable. */
export const ACCESS_CODE_TTL_HOURS = 24;

/** Groups of three read aloud far more reliably than a run of six. */
export function formatAccessCode(code: string): string {
	if (code.length !== ACCESS_CODE_LENGTH) return code;
	return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/**
 * Generate a code. Uses randomInt (CSPRNG, rejection-sampled) rather than
 * Math.random — this is a credential, however short-lived.
 */
export function generateAccessCode(): string {
	let code = "";
	for (let i = 0; i < ACCESS_CODE_LENGTH; i += 1) {
		code += ALPHABET[randomInt(ALPHABET.length)];
	}
	return code;
}

/**
 * Normalise what someone typed. The keypad is alphanumeric and people insert
 * the space they were read, so strip whitespace and upcase before comparing.
 */
export function normaliseAccessCode(input: string): string {
	return input.replace(/\s+/g, "").toUpperCase();
}

export function accessCodeExpiry(from = new Date()): Date {
	return new Date(from.getTime() + ACCESS_CODE_TTL_HOURS * 60 * 60 * 1000);
}
