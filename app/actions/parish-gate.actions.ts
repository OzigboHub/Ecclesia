"use server";

import { auth } from "@/auth";
import { ACCESS_CODE_LENGTH, normaliseAccessCode } from "@/lib/access-code";
import db from "@/lib/db";
import {
	GATE_COOKIE_MAX_AGE,
	createGatePass,
	gateCookieName,
	verifyGatePass,
} from "@/lib/parish-gate";
import { canEditOrganizationProfile } from "@/lib/permissions";
import { clearAttempts, consumeAttempt, gateKey } from "@/lib/rate-limit";
import type { ActionResponse } from "@/types";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

const MAX_GATE_ATTEMPTS = 5;

async function requestIp(): Promise<string | null> {
	const h = await headers();
	const forwarded = h.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
	return h.get("x-real-ip");
}

export type GateStatus = {
	/** Whether this parish gates its timeline at all. */
	required: boolean;
	/** Whether this device has already been let through. */
	unlocked: boolean;
	organizationId: string;
	organizationName: string;
	contactPhone: string | null;
};

/**
 * What the feed needs to know before rendering a parish: is there a door, and
 * is this device already through it?
 */
export async function getGateStatus(
	organizationId: string,
): Promise<ActionResponse<GateStatus>> {
	try {
		const organization = await db.organization.findUnique({
			where: { id: organizationId },
			select: {
				id: true,
				name: true,
				contactPhone: true,
				featureSettings: { select: { requireGateCode: true } },
				gateCode: { select: { isActive: true } },
			},
		});

		if (!organization) {
			return { success: false, message: "Parish not found" };
		}

		// A parish that turned the setting on but never set a code is not
		// actually gated — otherwise it would be unreachable by anyone.
		const required =
			Boolean(organization.featureSettings?.requireGateCode) &&
			Boolean(organization.gateCode?.isActive);

		const store = await cookies();
		const unlocked =
			!required ||
			verifyGatePass(
				organizationId,
				store.get(gateCookieName(organizationId))?.value,
			);

		return {
			success: true,
			message: "Gate status",
			data: {
				required,
				unlocked,
				organizationId: organization.id,
				organizationName: organization.name,
				contactPhone: organization.contactPhone,
			},
		};
	} catch (error) {
		console.error("Failed to read gate status:", error);
		return { success: false, message: "Failed to read gate status" };
	}
}

/**
 * Try a parish's shared code. On success this device is remembered for six
 * months; the visitor never sees this screen again on this phone.
 */
export async function verifyGateCode(
	organizationId: string,
	code: string,
): Promise<ActionResponse<{ remaining: number } | null>> {
	try {
		const entered = normaliseAccessCode(code);
		if (entered.length !== ACCESS_CODE_LENGTH) {
			return { success: false, message: "Enter all six characters." };
		}

		const ip = await requestIp();
		const key = gateKey(organizationId, ip);
		const verdict = await consumeAttempt(key, {
			limit: MAX_GATE_ATTEMPTS,
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
				message: `Too many tries. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or ask at the parish office.`,
				data: { remaining: 0 },
			};
		}

		const gate = await db.parishGateCode.findUnique({
			where: { organizationId },
			select: { codeHash: true, isActive: true },
		});

		if (!gate || !gate.isActive) {
			// No gate to pass. Treat as open rather than as a failure.
			return { success: true, message: "Open", data: null };
		}

		const matches = await bcrypt.compare(entered, gate.codeHash);
		if (!matches) {
			return {
				success: false,
				message: "That code isn't right.",
				data: { remaining: verdict.remaining },
			};
		}

		const store = await cookies();
		store.set(gateCookieName(organizationId), createGatePass(organizationId), {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: GATE_COOKIE_MAX_AGE,
			path: "/",
		});

		await clearAttempts(key);

		return { success: true, message: "Unlocked", data: null };
	} catch (error) {
		console.error("Failed to verify gate code:", error);
		return { success: false, message: "Something went wrong. Try again." };
	}
}

/**
 * Set or rotate a parish's gate code. Rotating does not sign existing devices
 * out — they hold a signed pass, not the code itself — which is the intended
 * behaviour: rotating stops new people getting in, it does not punish the
 * congregation.
 */
export async function setGateCode(
	code: string,
): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}
		if (!canEditOrganizationProfile(session.user.role)) {
			return {
				success: false,
				message: "You do not have permission to change the parish code",
			};
		}

		const entered = normaliseAccessCode(code);
		if (entered.length !== ACCESS_CODE_LENGTH) {
			return {
				success: false,
				message: `The parish code must be ${ACCESS_CODE_LENGTH} characters.`,
			};
		}

		const codeHash = await bcrypt.hash(entered, 10);
		const organizationId = session.user.organizationId;

		// Both halves, in one transaction. getGateStatus requires the feature
		// flag *and* an active code — setting only the code would leave the
		// gate silently inert, which looks exactly like a broken feature.
		await db.$transaction([
			db.parishGateCode.upsert({
				where: { organizationId },
				create: {
					organizationId,
					codeHash,
					isActive: true,
					updatedById: session.user.id,
				},
				update: {
					codeHash,
					isActive: true,
					updatedById: session.user.id,
				},
			}),
			db.organizationFeatureSettings.upsert({
				where: { organizationId },
				create: { organizationId, requireGateCode: true },
				update: { requireGateCode: true },
			}),
		]);

		await db.auditLog.create({
			data: {
				action: "UPDATE",
				entityType: "ParishGateCode",
				entityId: organizationId,
				performedBy: session.user.id,
				details: { rotated: true },
			},
		});

		revalidatePath("/organization");
		return { success: true, message: "Parish code updated", data: null };
	} catch (error) {
		console.error("Failed to set gate code:", error);
		return { success: false, message: "Failed to set the parish code" };
	}
}

/** Turn the gate off without deleting the code. */
export async function disableGateCode(): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}
		if (!canEditOrganizationProfile(session.user.role)) {
			return { success: false, message: "You do not have permission" };
		}

		// Keep the stored code so turning the gate back on doesn't force the
		// parish to invent and redistribute a new one.
		await db.$transaction([
			db.parishGateCode.updateMany({
				where: { organizationId: session.user.organizationId },
				data: { isActive: false },
			}),
			db.organizationFeatureSettings.updateMany({
				where: { organizationId: session.user.organizationId },
				data: { requireGateCode: false },
			}),
		]);

		revalidatePath("/organization");
		return { success: true, message: "Parish code disabled", data: null };
	} catch (error) {
		console.error("Failed to disable gate code:", error);
		return { success: false, message: "Failed to disable the parish code" };
	}
}
