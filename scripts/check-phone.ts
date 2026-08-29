/**
 * Fixture check for lib/phone.ts.
 *
 *   pnpm tsx scripts/check-phone.ts
 *
 * There is no test runner in this project, so this is a plain script that exits
 * non-zero on failure — runnable in CI as-is. Every row below is a shape that
 * actually turns up in a Nigerian parish register.
 */

import { maskNgPhone, formatNgPhone, normaliseNgPhone } from "../lib/phone";

const VALID: [input: string, expected: string][] = [
	["08034112233", "+2348034112233"],
	["0803 411 2233", "+2348034112233"],
	["0803-411-2233", "+2348034112233"],
	["+2348034112233", "+2348034112233"],
	["+234 803 411 2233", "+2348034112233"],
	["2348034112233", "+2348034112233"],
	["234-803-411-2233", "+2348034112233"],
	["002348034112233", "+2348034112233"],
	["8034112233", "+2348034112233"],
	["  08034112233  ", "+2348034112233"],
	["(0803) 411-2233", "+2348034112233"],
	["+234(0)8034112233", "+2348034112233"],
	// The other live mobile prefixes.
	["07031234567", "+2347031234567"],
	["09011234567", "+2349011234567"],
	["08121234567", "+2348121234567"],
];

const INVALID: [input: string, reason: string][] = [
	["", "empty"],
	["   ", "empty"],
	["0803411", "too-short"],
	["080341122334455", "too-long"],
	// Lagos landline. Rejected on purpose — see lib/phone.ts.
	["014605050", "too-short"],
	// Ten digits but no Nigerian mobile prefix.
	["01234567890", "unrecognised"],
	["00000000000", "unrecognised"],
];

let failures = 0;

function fail(message: string) {
	failures += 1;
	console.error(`  FAIL  ${message}`);
}

for (const [input, expected] of VALID) {
	const result = normaliseNgPhone(input);
	if (!result.ok) {
		fail(`${JSON.stringify(input)} → rejected (${result.reason}), expected ${expected}`);
	} else if (result.e164 !== expected) {
		fail(`${JSON.stringify(input)} → ${result.e164}, expected ${expected}`);
	}
}

for (const [input, reason] of INVALID) {
	const result = normaliseNgPhone(input);
	if (result.ok) {
		fail(`${JSON.stringify(input)} → accepted as ${result.e164}, expected rejection`);
	} else if (result.reason !== reason) {
		fail(`${JSON.stringify(input)} → ${result.reason}, expected ${reason}`);
	}
}

// Every accepted spelling of one number must collapse to one value — this is
// the property that decides whether lock-in finds people.
const spellings = VALID.slice(0, 12).map(([input]) => normaliseNgPhone(input));
const distinct = new Set(spellings.map((r) => (r.ok ? r.e164 : "REJECTED")));
if (distinct.size !== 1) {
	fail(`one number spelled 12 ways produced ${distinct.size} values: ${[...distinct].join(", ")}`);
}

if (formatNgPhone("+2348034112233") !== "0803 411 2233") {
	fail(`formatNgPhone → ${formatNgPhone("+2348034112233")}`);
}
if (maskNgPhone("+2348034112233") !== "0803 ••• 2233") {
	fail(`maskNgPhone → ${maskNgPhone("+2348034112233")}`);
}
// Never leak digits from something unparseable.
if (maskNgPhone("garbage") !== "") {
	fail(`maskNgPhone("garbage") → ${maskNgPhone("garbage")}`);
}

const total = VALID.length + INVALID.length + 4;
if (failures) {
	console.error(`\n  ${failures} of ${total} phone checks failed.\n`);
	process.exit(1);
}
console.log(`\n  All ${total} phone checks passed.\n`);
