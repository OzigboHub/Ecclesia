/**
 * Read-only session diagnostic.
 *
 *   pnpm tsx scripts/inspect-sessions.ts [email]
 *
 * Answers the question "did single-session revocation actually happen at the
 * database level?" without a browser in the way. Run it straight after a login
 * or an E2E run: if activeSessionId points at the newest token and every older
 * one is revoked, the sign-in path is doing its job and any surviving browser
 * session is a problem further downstream.
 */

import "dotenv/config";
import db from "../lib/db";

const email = process.argv[2] ?? "admin@ecclesialight.com";

async function main() {
	const user = await db.user.findUnique({
		where: { email },
		select: {
			id: true,
			role: true,
			activeSessionId: true,
			twoFactorEnabled: true,
			sessionVersion: true,
		},
	});

	if (!user) {
		console.log(`\n  No user with email ${email}. Is the database seeded?\n`);
		return;
	}

	console.log("");
	console.log("  email             ", email);
	console.log("  role              ", user.role);
	console.log("  twoFactorEnabled  ", user.twoFactorEnabled);
	console.log("  sessionVersion    ", user.sessionVersion);
	console.log("  activeSessionId   ", user.activeSessionId ?? "(null)");

	const sessions = await db.userSession.findMany({
		where: { userId: user.id },
		select: {
			tokenId: true,
			revokedAt: true,
			lastSeenAt: true,
			createdAt: true,
			expiresAt: true,
			authMethod: true,
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	console.log("");
	console.log("  sessions, newest first:");
	if (sessions.length === 0) console.log("    (none)");

	for (const s of sessions) {
		const idle = Math.round((Date.now() - s.lastSeenAt.getTime()) / 60000);
		console.log(
			[
				"   ",
				s.tokenId.slice(0, 8),
				s.authMethod.padEnd(12),
				s.revokedAt ? "REVOKED" : "live   ",
				`idle ${String(idle).padStart(3)}m`,
				s.expiresAt <= new Date() ? "EXPIRED" : "       ",
				s.tokenId === user.activeSessionId ? "<-- activeSessionId" : "",
			].join(" "),
		);
	}

	const live = sessions.filter(
		(s) => !s.revokedAt && s.expiresAt > new Date(),
	);

	console.log("");
	console.log(`  ${live.length} live of ${sessions.length} shown.`);

	// The invariant for staff: exactly one live session, and activeSessionId
	// points at it. Parishioners are expected to hold several.
	if (user.role !== "PARISHIONER") {
		if (live.length > 1) {
			console.log(
				"  ⚠ More than one live session for a staff account — single-session",
			);
			console.log("    enforcement did not revoke on the most recent sign-in.");
		} else if (live.length === 1 && live[0].tokenId !== user.activeSessionId) {
			console.log("  ⚠ activeSessionId does not point at the one live session.");
		} else if (live.length === 1) {
			console.log("  ✓ Exactly one live session, and it is the active one.");
		}
	}
	console.log("");
}

main()
	.catch((error) => {
		console.log("\n  Could not reach the database:", error.message, "\n");
	})
	.finally(() => process.exit(0));
