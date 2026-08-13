import db from "@/lib/db";
import { clearAttempts, consumeAttempt } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

/**
 * Re-prove the password before an action that lowers an account's security.
 *
 * A live session is not enough for these. The threat this guards is an
 * unlocked, borrowed or stolen phone that is already signed in — where the
 * attacker has the session but not the password. Without re-authentication,
 * two-factor and the closed code door can both be undone by whoever is holding
 * the handset, which makes the top of the security ladder decorative.
 *
 * Rate limited, because otherwise a stolen phone becomes an unlimited password
 * oracle: guess in the app, no lockout, no trace.
 */

const MAX_REAUTH_ATTEMPTS = 5;

export type ReauthResult =
	| { ok: true }
	| { ok: false; message: string };

export async function reauthenticate(
	userId: string,
	password: string | undefined | null,
): Promise<ReauthResult> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { password: true },
	});

	if (!user) return { ok: false, message: "Account not found" };

	// Nothing to prove against. Only reachable for accounts that never had a
	// password, which by construction cannot have two-factor or a closed code
	// door either — so there is no protection being bypassed here.
	if (!user.password) return { ok: true };

	if (!password) {
		return { ok: false, message: "Enter your password to confirm this." };
	}

	const key = `reauth:${userId}`;
	const verdict = await consumeAttempt(key, {
		limit: MAX_REAUTH_ATTEMPTS,
		windowMinutes: 15,
		blockMinutes: 15,
	});

	if (!verdict.allowed) {
		const minutes =
			verdict.blockedUntil ?
				Math.max(
					1,
					Math.ceil((verdict.blockedUntil.getTime() - Date.now()) / 60000),
				)
			:	15;
		return {
			ok: false,
			message: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
		};
	}

	const matches = await bcrypt.compare(password, user.password);
	if (!matches) {
		const left = verdict.remaining;
		return {
			ok: false,
			message:
				left > 0 ?
					`That password is wrong. ${left} ${left === 1 ? "try" : "tries"} left.`
				:	"That password is wrong.",
		};
	}

	await clearAttempts(key);
	return { ok: true };
}
