"use server";

import { startTwoFactorChallengeFor } from "@/app/actions/auth.actions";
import { auth, signIn } from "@/auth";
import db from "@/lib/db";
import { renderBrandedEmailTemplate } from "@/lib/notifications/email-template";
import { reauthenticate } from "@/lib/auth/reauthenticate";
import { canManageParishioners } from "@/lib/permissions";
import { clearAttempts, consumeAttempt } from "@/lib/rate-limit";
import {
	memberLoginSchema,
	setPasswordSchema,
} from "@/lib/validators/security.schema";
import type { ActionResponse } from "@/types";
import type { TwoFactorMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

/**
 * The security ladder.
 *
 *   rung 0   phone + one-time code          (parishioner default)
 *   rung 1   + email and password
 *   rung 2   + two-factor
 *   rung 3   + code sign-in switched off
 *
 * A role decides the minimum rung an account must reach. It never decides the
 * maximum — everything here is available to any signed-in account, and every
 * action is scoped to the caller's own record.
 */

const VERIFICATION_TTL_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;

function hashOtp(code: string): string {
	return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

/** Six digits from a CSPRNG. This is a credential, however short-lived. */
function generateOtp(): string {
	return crypto.randomInt(100000, 1000000).toString();
}

async function sendVerificationEmail(to: string, code: string) {
	if (!process.env.RESEND_API_KEY) {
		return {
			success: false,
			message:
				"Email isn't configured on this deployment, so we can't send a code.",
		} as const;
	}

	try {
		const resend = new Resend(process.env.RESEND_API_KEY);
		const fromName = process.env.RESEND_FROM_NAME?.trim() || "Ecclesia";

		const { error } = await resend.emails.send({
			from: `${fromName} <support@ecclesialight.com>`,
			to,
			subject: "Confirm your email address",
			html: renderBrandedEmailTemplate({
				title: "Confirm your email address",
				message: `Enter this code in Ecclesia to confirm this address:\n\n${code}\n\nIt expires in ${VERIFICATION_TTL_MINUTES} minutes.`,
				footerNote:
					"If you didn't ask for this, you can ignore this email. Nothing changes until the code is entered.",
			}),
		});

		if (error) {
			console.error("Failed to send verification email:", error);
			return { success: false, message: "We couldn't send that email." } as const;
		}
		return { success: true } as const;
	} catch (error) {
		console.error("Verification email error:", error);
		return { success: false, message: "We couldn't send that email." } as const;
	}
}

export type SecurityStatus = {
	email: string | null;
	emailVerified: boolean;
	hasPassword: boolean;
	twoFactorEnabled: boolean;
	twoFactorMethod: TwoFactorMethod | null;
	allowCodeSignIn: boolean;
	/** Whether rung 3 is reachable right now, and if not, what's missing. */
	canDisableCodeSignIn: boolean;
	blockedBecause: string | null;
	/** Staff never had the code door; the row is hidden for them. */
	codeSignInApplies: boolean;
};

/** One call renders the whole ladder. */
export async function getSecurityStatus(): Promise<
	ActionResponse<SecurityStatus>
> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: {
				email: true,
				password: true,
				emailVerifiedAt: true,
				twoFactorEnabled: true,
				twoFactorMethod: true,
				allowCodeSignIn: true,
				role: true,
			},
		});

		if (!user) return { success: false, message: "Account not found" };

		const emailVerified = Boolean(user.emailVerifiedAt);
		const hasPassword = Boolean(user.password);
		const codeSignInApplies = user.role === "PARISHIONER";

		const blockedBecause =
			!hasPassword ? "Set a password first."
			: !emailVerified ? "Confirm your email address first."
			: !user.twoFactorEnabled ? "Turn on two-factor first."
			: null;

		return {
			success: true,
			message: "Security status",
			data: {
				email: user.email,
				emailVerified,
				hasPassword,
				twoFactorEnabled: user.twoFactorEnabled,
				twoFactorMethod: user.twoFactorMethod,
				allowCodeSignIn: user.allowCodeSignIn,
				canDisableCodeSignIn: blockedBecause === null,
				blockedBecause,
				codeSignInApplies,
			},
		};
	} catch (error) {
		console.error("Failed to load security status:", error);
		return { success: false, message: "Failed to load your security settings" };
	}
}

/**
 * Rung 1: give the account an email and a password.
 *
 * Also handles changing an existing one, in which case the current password is
 * required. Changing the address always clears verification — the new one has
 * not proved anything yet.
 */
export async function setMemberPassword(input: {
	email: string;
	password: string;
	confirmPassword: string;
	currentPassword?: string;
}): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const parsed = setPasswordSchema.safeParse(input);
		if (!parsed.success) {
			return {
				success: false,
				message: parsed.error.issues[0]?.message ?? "Check those details",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const email = parsed.data.email.toLowerCase().trim();

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, email: true, password: true, emailVerifiedAt: true },
		});

		if (!user) return { success: false, message: "Account not found" };

		// Changing an existing password requires proving you know it. Setting
		// one for the first time cannot — there is nothing to prove yet, and
		// the session itself is the authorisation.
		if (user.password) {
			if (!parsed.data.currentPassword) {
				return {
					success: false,
					message: "Enter your current password to change it.",
				};
			}
			const matches = await bcrypt.compare(
				parsed.data.currentPassword,
				user.password,
			);
			if (!matches) {
				return { success: false, message: "That current password is wrong." };
			}
		}

		// The column is unique. Checking explicitly turns a raw P2002 — which
		// would surface as "something went wrong" — into something a person can
		// act on.
		const taken = await db.user.findUnique({
			where: { email },
			select: { id: true },
		});
		if (taken && taken.id !== user.id) {
			return {
				success: false,
				message:
					"That email is already used by another account. Try a different one.",
			};
		}

		const emailChanged = user.email?.toLowerCase() !== email;

		await db.$transaction([
			db.user.update({
				where: { id: user.id },
				data: {
					email,
					password: await bcrypt.hash(parsed.data.password, 10),
					// A new address has proved nothing yet.
					...(emailChanged ? { emailVerifiedAt: null } : {}),
				},
			}),
			db.auditLog.create({
				data: {
					action: "PASSWORD_CHANGE",
					entityType: "Auth",
					entityId: user.id,
					performedBy: user.id,
					details: {
						setByMember: true,
						firstTime: !user.password,
						emailChanged,
					},
				},
			}),
		]);

		if (emailChanged) {
			// Any code in flight was addressed to the old email.
			await db.emailVerificationToken.deleteMany({
				where: { userId: user.id, consumedAt: null },
			});
		}

		revalidatePath("/me/security");
		return {
			success: true,
			message:
				user.password ? "Password updated" : "Password set — you can now sign in with it",
			data: null,
		};
	} catch (error) {
		console.error("Failed to set member password:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}

/** Send a confirmation code to the address on the account. */
export async function sendEmailVerification(): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, email: true, emailVerifiedAt: true },
		});

		if (!user?.email) {
			return {
				success: false,
				message: "Add an email address to this account first.",
			};
		}
		if (user.emailVerifiedAt) {
			return { success: true, message: "Already confirmed", data: null };
		}

		const verdict = await consumeAttempt(`verify-email:${user.id}`, {
			limit: 5,
			windowMinutes: 30,
			blockMinutes: 30,
		});
		if (!verdict.allowed) {
			return {
				success: false,
				message: "Too many codes requested. Try again in half an hour.",
			};
		}

		const code = generateOtp();

		// One live code at a time, so an old one can't be replayed.
		await db.emailVerificationToken.deleteMany({
			where: { userId: user.id, consumedAt: null },
		});
		await db.emailVerificationToken.create({
			data: {
				userId: user.id,
				email: user.email,
				codeHash: hashOtp(code),
				expiresAt: new Date(
					Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000,
				),
			},
		});

		const sent = await sendVerificationEmail(user.email, code);
		if (!sent.success) {
			// Don't leave a live token behind for an email that never arrived.
			await db.emailVerificationToken.deleteMany({
				where: { userId: user.id, consumedAt: null },
			});
			return { success: false, message: sent.message };
		}

		return { success: true, message: "Code sent — check your email", data: null };
	} catch (error) {
		console.error("Failed to send email verification:", error);
		return { success: false, message: "We couldn't send that code." };
	}
}

export async function confirmEmailVerification(
	code: string,
): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, email: true },
		});
		if (!user?.email) {
			return { success: false, message: "No email on this account" };
		}

		const token = await db.emailVerificationToken.findFirst({
			where: { userId: user.id, consumedAt: null },
			orderBy: { createdAt: "desc" },
		});

		if (!token) {
			return { success: false, message: "Ask for a new code." };
		}
		if (token.expiresAt <= new Date()) {
			return { success: false, message: "That code expired. Ask for a new one." };
		}
		if (token.attempts >= MAX_VERIFICATION_ATTEMPTS) {
			return { success: false, message: "Too many tries. Ask for a new code." };
		}
		// The address moved after the code was sent, so it proves nothing about
		// the address now on file.
		if (token.email.toLowerCase() !== user.email.toLowerCase()) {
			return {
				success: false,
				message: "Your email changed since that code was sent. Ask for a new one.",
			};
		}

		if (token.codeHash !== hashOtp(code)) {
			await db.emailVerificationToken.update({
				where: { id: token.id },
				data: { attempts: { increment: 1 } },
			});
			return { success: false, message: "That code didn't match." };
		}

		await db.$transaction([
			db.emailVerificationToken.update({
				where: { id: token.id },
				data: { consumedAt: new Date() },
			}),
			db.user.update({
				where: { id: user.id },
				data: { emailVerifiedAt: new Date() },
			}),
		]);

		await clearAttempts(`verify-email:${user.id}`);
		revalidatePath("/me/security");

		return { success: true, message: "Email confirmed", data: null };
	} catch (error) {
		console.error("Failed to confirm email:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}

/**
 * Rung 3: close or reopen the parish-code door.
 *
 * Closing requires the three rungs below it. Reopening is always *possible* —
 * a ladder you can climb but not descend is a trap — but it needs the password,
 * so a borrowed handset with a live session cannot quietly widen the door back
 * out. Somebody who has genuinely lost everything goes through the parish
 * office instead, via restoreCodeSignIn below.
 */
export async function setCodeSignIn(
	enabled: boolean,
	password?: string,
): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, message: "Unauthorized" };
		}

		// Reopening the code door is a downgrade — it makes a code from the
		// parish office enough to sign in again — so it needs the password.
		// Closing it is an upgrade and needs nothing beyond the rungs below.
		if (enabled) {
			const reauth = await reauthenticate(session.user.id, password);
			if (!reauth.ok) {
				return { success: false, message: reauth.message };
			}
		}

		if (!enabled) {
			const status = await getSecurityStatus();
			if (!status.success || !status.data) {
				return { success: false, message: "Couldn't check your settings" };
			}
			if (!status.data.canDisableCodeSignIn) {
				return {
					success: false,
					message:
						status.data.blockedBecause ??
						"You can't turn this off yet.",
				};
			}
		}

		await db.$transaction([
			db.user.update({
				where: { id: session.user.id },
				data: { allowCodeSignIn: enabled },
			}),
			db.auditLog.create({
				data: {
					action: "PERMISSION_CHANGE",
					entityType: "Auth",
					entityId: session.user.id,
					performedBy: session.user.id,
					details: { allowCodeSignIn: enabled, byMember: true },
				},
			}),
		]);

		revalidatePath("/me/security");
		return {
			success: true,
			message:
				enabled ?
					"Code sign-in is back on"
				:	"Code sign-in is off — your password is now the only way in",
			data: null,
		};
	} catch (error) {
		console.error("Failed to change code sign-in:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}

/**
 * The safety valve: a parish admin puts the code door back for somebody who
 * lost their password and can't reach their email either.
 *
 * This is ordinary account recovery. Without it, rung 3 plus a dead mailbox is
 * a permanent lockout — and the mailbox on a parish register is frequently one
 * somebody typed in years ago.
 */
export async function restoreCodeSignIn(
	parishionerId: string,
): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user) return { success: false, message: "Unauthorized" };
		if (!canManageParishioners(session.user.role)) {
			return { success: false, message: "Permission denied" };
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
				userId: true,
			},
		});

		if (!parishioner?.userId) {
			return {
				success: false,
				message: "This person has no account to restore.",
			};
		}

		await db.$transaction([
			db.user.update({
				where: { id: parishioner.userId },
				data: { allowCodeSignIn: true },
			}),
			db.auditLog.create({
				data: {
					action: "PERMISSION_CHANGE",
					entityType: "Auth",
					entityId: parishioner.userId,
					performedBy: session.user.id,
					details: {
						allowCodeSignIn: true,
						restoredByStaff: true,
						parishionerName: `${parishioner.firstName} ${parishioner.lastName}`,
					},
				},
			}),
		]);

		revalidatePath(`/parishioners/${parishioner.id}`);
		return {
			success: true,
			message: "Code sign-in restored. You can issue a code now.",
			data: null,
		};
	} catch (error) {
		console.error("Failed to restore code sign-in:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}

export type MemberLoginResult =
	| { outcome: "signed-in" }
	/** Two-factor is on. The sheet shows the challenge as its next step. */
	| { outcome: "two-factor"; challengeToken: string; method: TwoFactorMethod };

/**
 * Password sign-in from inside the feed's lock-in sheet.
 *
 * Deliberately not a redirect to /auth/login: that page is console-styled,
 * lands on /dashboard, and would lose the action the person was in the middle
 * of. This keeps them in the sheet so the pending action still replays.
 *
 * Two-factor is honoured here exactly as it is on the console — the challenge
 * comes back to the caller and the sheet renders it as one more step.
 */
export async function memberPasswordSignIn(input: {
	email: string;
	password: string;
}): Promise<ActionResponse<MemberLoginResult>> {
	try {
		const parsed = memberLoginSchema.safeParse(input);
		if (!parsed.success) {
			return {
				success: false,
				message: parsed.error.issues[0]?.message ?? "Check those details",
			};
		}

		const email = parsed.data.email.toLowerCase().trim();

		const user = await db.user.findUnique({
			where: { email },
			select: {
				id: true,
				password: true,
				isActive: true,
				lockedUntil: true,
				twoFactorEnabled: true,
				twoFactorMethod: true,
			},
		});

		// One message for every failure mode below, so this cannot be used to
		// discover which addresses have accounts.
		const generic = "That email and password don't match." as const;

		if (!user?.password || !user.isActive) {
			return { success: false, message: generic };
		}
		if (user.lockedUntil && user.lockedUntil > new Date()) {
			return {
				success: false,
				message: "Too many attempts. Try again in a little while.",
			};
		}

		const matches = await bcrypt.compare(parsed.data.password, user.password);
		if (!matches) {
			return { success: false, message: generic };
		}

		if (user.twoFactorEnabled && user.twoFactorMethod) {
			const challenge = await startTwoFactorChallengeFor(user.id);
			if (!challenge.success || !challenge.data) {
				return { success: false, message: challenge.message };
			}
			return {
				success: true,
				message: "Two-factor required",
				data: {
					outcome: "two-factor",
					challengeToken: challenge.data.challengeToken,
					method: challenge.data.method,
				},
			};
		}

		await signIn("credentials", {
			email,
			password: parsed.data.password,
			redirect: false,
		});

		return {
			success: true,
			message: "Signed in",
			data: { outcome: "signed-in" },
		};
	} catch (error) {
		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
			throw error;
		}
		console.error("Member password sign-in failed:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}
