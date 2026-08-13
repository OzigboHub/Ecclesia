import db from "@/lib/db";
import { createHash } from "node:crypto";

/**
 * Durable attempt counters, backed by AuthAttemptBucket.
 *
 * Both code-entry paths need this and both run on serverless request handlers,
 * so an in-memory counter would reset on every cold start — which is to say it
 * would not be a rate limit at all.
 */

export type RateLimitVerdict = {
	allowed: boolean;
	/** Attempts left in the current window, floored at zero. */
	remaining: number;
	/** Set when the caller is inside a cool-down. */
	blockedUntil: Date | null;
};

/** Hash IP addresses before they become part of a key — no raw IPs at rest. */
export function hashIp(ip: string | null | undefined): string {
	if (!ip) return "unknown";
	return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function gateKey(organizationId: string, ip: string | null): string {
	return `gate:${organizationId}:${hashIp(ip)}`;
}

export function lookupKey(organizationId: string, ip: string | null): string {
	return `lookup:${organizationId}:${hashIp(ip)}`;
}

export function codeKey(parishionerId: string): string {
	return `code:${parishionerId}`;
}

/**
 * Record an attempt and say whether it may proceed.
 *
 * Call this *before* doing the work, so a caller cannot burn through the limit
 * by racing. The window slides: it resets only once `resetAt` has passed.
 */
export async function consumeAttempt(
	key: string,
	options: { limit: number; windowMinutes: number; blockMinutes: number },
): Promise<RateLimitVerdict> {
	const now = new Date();
	const bucket = await db.authAttemptBucket.findUnique({ where: { key } });

	if (bucket?.blockedUntil && bucket.blockedUntil > now) {
		return { allowed: false, remaining: 0, blockedUntil: bucket.blockedUntil };
	}

	// No bucket, or the window has rolled over — start fresh.
	if (!bucket || bucket.resetAt <= now) {
		const resetAt = new Date(now.getTime() + options.windowMinutes * 60_000);
		await db.authAttemptBucket.upsert({
			where: { key },
			create: { key, count: 1, resetAt, blockedUntil: null },
			update: { count: 1, resetAt, blockedUntil: null },
		});
		return { allowed: true, remaining: options.limit - 1, blockedUntil: null };
	}

	const count = bucket.count + 1;

	if (count > options.limit) {
		const blockedUntil = new Date(now.getTime() + options.blockMinutes * 60_000);
		await db.authAttemptBucket.update({
			where: { key },
			data: { count, blockedUntil },
		});
		return { allowed: false, remaining: 0, blockedUntil };
	}

	await db.authAttemptBucket.update({ where: { key }, data: { count } });
	return {
		allowed: true,
		remaining: Math.max(0, options.limit - count),
		blockedUntil: null,
	};
}

/** Clear the counter after a success, so one bad day doesn't linger. */
export async function clearAttempts(key: string): Promise<void> {
	await db.authAttemptBucket.deleteMany({ where: { key } });
}

/** Read the current state without recording an attempt. */
export async function peekAttempts(
	key: string,
	limit: number,
): Promise<RateLimitVerdict> {
	const now = new Date();
	const bucket = await db.authAttemptBucket.findUnique({ where: { key } });

	if (!bucket || bucket.resetAt <= now) {
		return { allowed: true, remaining: limit, blockedUntil: null };
	}
	if (bucket.blockedUntil && bucket.blockedUntil > now) {
		return { allowed: false, remaining: 0, blockedUntil: bucket.blockedUntil };
	}
	return {
		allowed: bucket.count < limit,
		remaining: Math.max(0, limit - bucket.count),
		blockedUntil: null,
	};
}
