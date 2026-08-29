/**
 * Nigerian phone number normalisation.
 *
 * This is the single most consequential function in the parish-feed work. A
 * parish register is typed by hand over years, so the same person's number
 * appears as 08034112233, 8034112233, +2348034112233, 234-803-411-2233 and
 * "0803 411 2233". Lock-in looks people up by phone, so anything that fails to
 * canonicalise here is a parishioner who cannot sign in — and it will look like
 * a bug in the code rather than a bug in the data.
 *
 * Everything canonicalises to E.164: +234 followed by the 10-digit national
 * number.
 */

export const NG_COUNTRY_CODE = "234";

/**
 * Nigerian mobile numbers are ten digits nationally and begin 7, 8 or 9
 * (070x, 080x, 081x, 090x, 091x …). Landlines are shorter and are deliberately
 * rejected: lock-in binds a personal handset, and a parish switchboard number
 * shared by twenty people is not an identity.
 */
const VALID_LEADING_DIGITS = new Set(["7", "8", "9"]);

export type PhoneNormalisation =
	| { ok: true; e164: string; national: string }
	| { ok: false; reason: "empty" | "too-short" | "too-long" | "unrecognised" };

/**
 * Reduce free-typed input to its digits, tolerating +, spaces, dashes, dots,
 * parentheses and non-breaking spaces. A leading + is remembered separately
 * because "+2348034112233" and "2348034112233" must land in the same place.
 */
function digitsOf(input: string): { digits: string; hadPlus: boolean } {
	const trimmed = input.trim();
	const hadPlus = trimmed.startsWith("+");
	return { digits: trimmed.replace(/\D/g, ""), hadPlus };
}

/**
 * Normalise a Nigerian phone number to E.164.
 *
 * Returns a discriminated result rather than throwing or returning null, so
 * callers can tell "you typed too few digits" apart from "that isn't a
 * Nigerian number" — the lock-in sheet shows different copy for each.
 */
export function normaliseNgPhone(input: string | null | undefined): PhoneNormalisation {
	if (!input) return { ok: false, reason: "empty" };

	const { digits } = digitsOf(input);
	if (!digits) return { ok: false, reason: "empty" };

	let national: string | null = null;

	if (digits.startsWith("00234")) {
		// International prefix dialled literally.
		national = digits.slice(5);
	} else if (digits.startsWith(NG_COUNTRY_CODE) && digits.length >= 12) {
		// +234803… / 234803…. Guarded on length so a local number that happens
		// to begin 234 (e.g. 2345678901) is not mistaken for a country code.
		national = digits.slice(3);
	} else if (digits.startsWith("0")) {
		// Local trunk form: 0803….
		national = digits.slice(1);
	} else {
		// Bare national number: 803….
		national = digits;
	}

	// "+234 (0) 803 411 2233" — the trunk zero written alongside the country
	// code, which is redundant but extremely common on printed material.
	if (national.length === 11 && national.startsWith("0")) {
		national = national.slice(1);
	}

	if (national.length < 10) return { ok: false, reason: "too-short" };
	if (national.length > 10) return { ok: false, reason: "too-long" };
	if (!VALID_LEADING_DIGITS.has(national[0])) {
		return { ok: false, reason: "unrecognised" };
	}

	return {
		ok: true,
		e164: `+${NG_COUNTRY_CODE}${national}`,
		national,
	};
}

/** Convenience wrapper for call sites that only care whether it worked. */
export function toE164NG(input: string | null | undefined): string | null {
	const result = normaliseNgPhone(input);
	return result.ok ? result.e164 : null;
}

/**
 * Display form: 0803 411 2233. Nigerians read their own numbers in the local
 * trunk form, not in E.164, so this is what goes on screen.
 */
export function formatNgPhone(e164: string | null | undefined): string {
	if (!e164) return "";
	const result = normaliseNgPhone(e164);
	if (!result.ok) return e164;
	const n = result.national;
	return `0${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

/**
 * Masked form for confirmation screens: 0803 ••• 2233. Never show a full number
 * on a device that has not yet proven it belongs to the person.
 */
export function maskNgPhone(e164: string | null | undefined): string {
	if (!e164) return "";
	const result = normaliseNgPhone(e164);
	if (!result.ok) return "";
	const n = result.national;
	return `0${n.slice(0, 3)} ••• ${n.slice(6)}`;
}
