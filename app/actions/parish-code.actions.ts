"use server";

import { auth, signIn } from "@/auth";
import {
	ACCESS_CODE_LENGTH,
	accessCodeExpiry,
	generateAccessCode,
	normaliseAccessCode,
} from "@/lib/access-code";
import db from "@/lib/db";
import { canManageParishioners } from "@/lib/permissions";
import { normaliseNgPhone } from "@/lib/phone";
import { codeKey, consumeAttempt, clearAttempts, lookupKey } from "@/lib/rate-limit";
import type { ActionResponse } from "@/types";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/** Attempts against one person's code before the code is burned. */
const MAX_CODE_ATTEMPTS = 5;
/** Lookups of "does this phone exist here" per device per window. */
const MAX_LOOKUPS = 10;

async function requestIp(): Promise<string | null> {
	const h = await headers();
	const forwarded = h.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
	return h.get("x-real-ip");
}

export type ParishionerPreview = {
	parishionerId: string;
	/** First name plus last initial. Never the full surname. */
	displayName: string;
	organizationId: string;
	organizationName: string;
	hasLivingCode: boolean;
	/**
	 * False when this person closed the code door and signs in with a password.
	 * The sheet routes them to the password step rather than asking for a code
	 * and then telling them it was wrong — which would be a lie.
	 */
	allowsCodeSignIn: boolean;
};

/**
 * Step 1 → 2 of lock-in: given a parish and a phone number, is there someone
 * in that register?
 *
 * Returns first name and last initial only — enough for someone to recognise
 * themselves, not enough to learn anything about a stranger. Scoped to a single
 * parish, so it cannot be walked across the platform, and rate limited per
 * device so it cannot be walked within one either.
 */
export async function lookupParishionerByPhone(
	organizationId: string,
	phone: string,
): Promise<ActionResponse<ParishionerPreview | null>> {
	try {
		const parsed = normaliseNgPhone(phone);
		if (!parsed.ok) {
			return {
				success: false,
				message:
					parsed.reason === "too-short" ?
						"That number looks too short. Nigerian mobile numbers have 11 digits."
					: parsed.reason === "too-long" ?
						"That number has too many digits."
					:	"Enter a Nigerian mobile number, like 0803 411 2233.",
			};
		}

		const ip = await requestIp();
		const verdict = await consumeAttempt(lookupKey(organizationId, ip), {
			limit: MAX_LOOKUPS,
			windowMinutes: 15,
			blockMinutes: 15,
		});

		if (!verdict.allowed) {
			return {
				success: false,
				message: "Too many tries. Wait a few minutes and try again.",
			};
		}

		const parishioner = await db.parishioner.findFirst({
			where: {
				organizationId,
				phoneE164: parsed.e164,
				deletedAt: null,
				isActive: true,
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				organizationId: true,
				organization: { select: { name: true } },
				user: { select: { allowCodeSignIn: true } },
				accessCodes: {
					where: {
						consumedAt: null,
						revokedAt: null,
						expiresAt: { gt: new Date() },
					},
					select: { id: true },
					take: 1,
				},
			},
		});

		if (!parishioner) {
			// Deliberately not an error: "we couldn't find you" is a normal,
			// expected outcome with its own screen and its own copy.
			return { success: true, message: "No match", data: null };
		}

		const initial = parishioner.lastName.trim().charAt(0).toUpperCase();

		return {
			success: true,
			message: "Found",
			data: {
				parishionerId: parishioner.id,
				displayName:
					initial ?
						`${parishioner.firstName} ${initial}.`
					:	parishioner.firstName,
				organizationId: parishioner.organizationId,
				organizationName: parishioner.organization.name,
				hasLivingCode: parishioner.accessCodes.length > 0,
				// No account yet means no preference expressed yet, and the
				// code path is how they get one.
				allowsCodeSignIn: parishioner.user?.allowCodeSignIn ?? true,
			},
		};
	} catch (error) {
		console.error("Failed to look up parishioner by phone:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}

/**
 * Step 3 of lock-in: exchange the code for a session.
 *
 * The actual credential check lives in the `parish-code` provider in
 * auth.config.ts — this wraps it so the UI gets a typed result and an attempt
 * counter it can show, rather than an opaque AuthError.
 */
export async function redeemAccessCode(input: {
	organizationId: string;
	parishionerId: string;
	phone: string;
	code: string;
}): Promise<ActionResponse<{ remaining: number } | null>> {
	try {
		const code = normaliseAccessCode(input.code);
		if (code.length !== ACCESS_CODE_LENGTH) {
			return { success: false, message: "Enter all six characters." };
		}

		const key = codeKey(input.parishionerId);
		const verdict = await consumeAttempt(key, {
			limit: MAX_CODE_ATTEMPTS,
			windowMinutes: 30,
			blockMinutes: 30,
		});

		if (!verdict.allowed) {
			const minutes =
				verdict.blockedUntil ?
					Math.max(
						1,
						Math.ceil(
							(verdict.blockedUntil.getTime() - Date.now()) / 60000,
						),
					)
				:	30;
			return {
				success: false,
				message: `Too many tries. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or ask the parish office for a new code.`,
				data: { remaining: 0 },
			};
		}

		await signIn("parish-code", {
			organizationId: input.organizationId,
			phone: input.phone,
			code,
			redirect: false,
		});

		await clearAttempts(key);
		return { success: true, message: "Signed in", data: null };
	} catch (error) {
		// signIn throws on a failed credential check. Everything the provider
		// rejects — wrong code, expired code, no code issued — lands here, and
		// they are deliberately not distinguished to the caller.
		const remaining = Math.max(0, MAX_CODE_ATTEMPTS - 1);
		if (error instanceof Error && error.name === "CredentialsSignin") {
			return {
				success: false,
				message: "That code didn't match.",
				data: { remaining },
			};
		}
		if (
			error instanceof Error &&
			error.message.includes("NEXT_REDIRECT")
		) {
			throw error;
		}
		console.error("Failed to redeem access code:", error);
		return {
			success: false,
			message: "That code didn't match.",
			data: { remaining },
		};
	}
}

export type IssuedCode = {
	parishionerId: string;
	parishionerName: string;
	/** The plaintext. Shown once, never stored, never returned again. */
	code: string;
	expiresAt: Date;
};

/**
 * Issue a fresh one-time code for a parishioner.
 *
 * Only a bcrypt hash is written. The plaintext returned here is the only copy
 * that will ever exist — the staff member reads it out and it is gone. Issuing
 * a new code revokes any outstanding one, so a code read out last week cannot
 * still be floating around.
 */
export async function issueAccessCode(
	parishionerId: string,
): Promise<ActionResponse<IssuedCode>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}
		if (!canManageParishioners(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to issue access codes",
			};
		}

		const parishioner = await db.parishioner.findFirst({
			where: {
				id: parishionerId,
				organizationId: session.user.organizationId,
				deletedAt: null,
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				phoneE164: true,
				organizationId: true,
				user: { select: { allowCodeSignIn: true } },
			},
		});

		if (!parishioner) {
			return { success: false, message: "Parishioner not found" };
		}

		if (parishioner.user && !parishioner.user.allowCodeSignIn) {
			return {
				success: false,
				message: `${parishioner.firstName} turned off code sign-in and uses a password instead, so a code won't work. If they've lost access, restore code sign-in for them first.`,
			};
		}

		if (!parishioner.phoneE164) {
			return {
				success: false,
				message:
					"This person has no usable phone number on record. Add one before issuing a code — lock-in starts with the phone number.",
			};
		}

		const code = generateAccessCode();
		const codeHash = await bcrypt.hash(code, 10);
		const expiresAt = accessCodeExpiry();

		await db.$transaction([
			db.parishAccessCode.updateMany({
				where: {
					parishionerId: parishioner.id,
					consumedAt: null,
					revokedAt: null,
				},
				data: { revokedAt: new Date() },
			}),
			db.parishAccessCode.create({
				data: {
					organizationId: parishioner.organizationId,
					parishionerId: parishioner.id,
					codeHash,
					issuedById: session.user.id,
					expiresAt,
				},
			}),
			db.auditLog.create({
				data: {
					action: "CREATE",
					entityType: "ParishAccessCode",
					entityId: parishioner.id,
					performedBy: session.user.id,
					details: {
						parishionerName: `${parishioner.firstName} ${parishioner.lastName}`,
						expiresAt: expiresAt.toISOString(),
					},
				},
			}),
		]);

		// The counter belongs to the old code, not the person.
		await clearAttempts(codeKey(parishioner.id));

		revalidatePath(`/parishioners/${parishioner.id}`);

		return {
			success: true,
			message: "Access code issued",
			data: {
				parishionerId: parishioner.id,
				parishionerName: `${parishioner.firstName} ${parishioner.lastName}`,
				code,
				expiresAt,
			},
		};
	} catch (error) {
		console.error("Failed to issue access code:", error);
		return { success: false, message: "Failed to issue access code" };
	}
}

/**
 * Issue codes for everyone in the register who can receive one, for printing
 * and handing out at Mass. Same guarantees as single issuance: each plaintext
 * is returned exactly once, to this caller, and never stored.
 */
export async function batchIssueAccessCodes(): Promise<
	ActionResponse<IssuedCode[]>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}
		if (!canManageParishioners(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to issue access codes",
			};
		}

		const parishioners = await db.parishioner.findMany({
			where: {
				organizationId: session.user.organizationId,
				deletedAt: null,
				isActive: true,
				phoneE164: { not: null },
				// Skip anyone who closed the code door — printing them a slip
				// that cannot work helps nobody.
				OR: [{ user: null }, { user: { allowCodeSignIn: true } }],
			},
			select: { id: true, firstName: true, lastName: true },
			orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
		});

		if (parishioners.length === 0) {
			return {
				success: false,
				message:
					"Nobody in this register has a usable phone number yet. Import or correct phone numbers first.",
			};
		}

		const expiresAt = accessCodeExpiry();
		const issued: IssuedCode[] = [];

		for (const parishioner of parishioners) {
			const code = generateAccessCode();
			const codeHash = await bcrypt.hash(code, 10);

			await db.$transaction([
				db.parishAccessCode.updateMany({
					where: {
						parishionerId: parishioner.id,
						consumedAt: null,
						revokedAt: null,
					},
					data: { revokedAt: new Date() },
				}),
				db.parishAccessCode.create({
					data: {
						organizationId: session.user.organizationId,
						parishionerId: parishioner.id,
						codeHash,
						issuedById: session.user.id,
						expiresAt,
					},
				}),
			]);

			issued.push({
				parishionerId: parishioner.id,
				parishionerName: `${parishioner.firstName} ${parishioner.lastName}`,
				code,
				expiresAt,
			});
		}

		await db.auditLog.create({
			data: {
				action: "CREATE",
				entityType: "ParishAccessCode",
				entityId: session.user.organizationId,
				performedBy: session.user.id,
				details: {
					batch: true,
					count: issued.length,
					expiresAt: expiresAt.toISOString(),
				},
			},
		});

		return {
			success: true,
			message: `Issued ${issued.length} codes`,
			data: issued,
		};
	} catch (error) {
		console.error("Failed to batch issue access codes:", error);
		return { success: false, message: "Failed to issue access codes" };
	}
}
