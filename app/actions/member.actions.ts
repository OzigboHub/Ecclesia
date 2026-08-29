"use server";

import { auth, signOut } from "@/auth";
import { reauthenticate } from "@/lib/auth/reauthenticate";
import db from "@/lib/db";
import type { ActionResponse } from "@/types";
import { revalidatePath } from "next/cache";

/**
 * The signed-in member surface: profile, giving, societies, devices.
 *
 * Everything here is scoped to the session's own parishioner record. A member
 * can see their own history and nobody else's, which is the whole difference
 * between this and the console.
 */

export type MemberProfile = {
	name: string;
	initials: string;
	photoUrl: string | null;
	organizationName: string;
	societies: { id: string; name: string; role: string }[];
	intentions: { id: string; intention: string; status: string; date: Date }[];
	appointments: { id: string; purpose: string; date: Date; status: string }[];
	givenThisYear: number;
};

export async function getMemberProfile(): Promise<
	ActionResponse<MemberProfile | null>
> {
	try {
		const session = await auth();
		if (!session?.user?.parishionerId) {
			return { success: true, message: "Not a member", data: null };
		}

		const parishionerId = session.user.parishionerId;
		const yearStart = new Date(new Date().getFullYear(), 0, 1);

		const [parishioner, memberships, intentions, appointments, given] =
			await Promise.all([
				db.parishioner.findUnique({
					where: { id: parishionerId },
					select: {
						firstName: true,
						lastName: true,
						photoUrl: true,
						organization: { select: { name: true } },
					},
				}),
				db.societyMembership.findMany({
					where: { parishionerId },
					select: {
						role: true,
						society: { select: { id: true, name: true } },
					},
				}),
				db.massIntention.findMany({
					where: { parishionerId },
					select: {
						id: true,
						intention: true,
						status: true,
						mass: { select: { date: true } },
					},
					orderBy: { createdAt: "desc" },
					take: 5,
				}),
				db.appointment.findMany({
					where: { parishionerId },
					select: {
						id: true,
						title: true,
						status: true,
						startTime: true,
					},
					orderBy: { startTime: "desc" },
					take: 5,
				}),
				db.payment.aggregate({
					where: {
						parishionerId,
						paymentStatus: "COMPLETED",
						paymentDate: { gte: yearStart },
					},
					_sum: { amount: true },
				}),
			]);

		if (!parishioner) {
			return { success: true, message: "Not a member", data: null };
		}

		return {
			success: true,
			message: "Profile retrieved",
			data: {
				name: `${parishioner.firstName} ${parishioner.lastName}`,
				initials:
					`${parishioner.firstName.charAt(0)}${parishioner.lastName.charAt(0)}`.toUpperCase(),
				photoUrl: parishioner.photoUrl,
				organizationName: parishioner.organization.name,
				societies: memberships.map((m) => ({
					id: m.society.id,
					name: m.society.name,
					role: m.role,
				})),
				intentions: intentions.map((i) => ({
					id: i.id,
					intention: i.intention,
					status: i.status,
					date: i.mass.date,
				})),
				appointments: appointments.map((a) => ({
					id: a.id,
					purpose: a.title,
					status: a.status,
					date: a.startTime,
				})),
				givenThisYear: given._sum.amount ?? 0,
			},
		};
	} catch (error) {
		console.error("Failed to load member profile:", error);
		return { success: false, message: "Failed to load your profile" };
	}
}

export type GivingEntry = {
	id: string;
	amount: number;
	purpose: string;
	campaignName: string | null;
	date: Date;
	status: string;
	receiptNumber: string | null;
};

export async function getMemberGiving(): Promise<
	ActionResponse<GivingEntry[]>
> {
	try {
		const session = await auth();
		if (!session?.user?.parishionerId) {
			return { success: true, message: "Not a member", data: [] };
		}

		const payments = await db.payment.findMany({
			where: { parishionerId: session.user.parishionerId },
			select: {
				id: true,
				amount: true,
				purpose: true,
				paymentDate: true,
				paymentStatus: true,
				receiptNumber: true,
				donationCampaign: { select: { name: true } },
			},
			orderBy: { paymentDate: "desc" },
			take: 60,
		});

		return {
			success: true,
			message: "Giving history retrieved",
			data: payments.map((payment) => ({
				id: payment.id,
				amount: payment.amount,
				purpose: payment.purpose,
				campaignName: payment.donationCampaign?.name ?? null,
				date: payment.paymentDate,
				status: payment.paymentStatus,
				receiptNumber: payment.receiptNumber,
			})),
		};
	} catch (error) {
		console.error("Failed to load giving history:", error);
		return {
			success: false,
			message: "Failed to load your giving history",
			data: [],
		};
	}
}

export type MemberDevice = {
	tokenId: string;
	label: string;
	lastSeenAt: Date;
	createdAt: Date;
	isCurrent: boolean;
};

/**
 * Devices bound to this account.
 *
 * Only parish-code sessions appear: a console login is a different thing with
 * different rules, and mixing them here would suggest a member can sign a
 * staff session out, which they cannot.
 */
export async function getMemberDevices(): Promise<
	ActionResponse<MemberDevice[]>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized", data: [] };
		}

		const sessions = await db.userSession.findMany({
			where: {
				userId: session.user.id,
				authMethod: "parish-code",
				revokedAt: null,
				expiresAt: { gt: new Date() },
			},
			select: {
				tokenId: true,
				deviceLabel: true,
				lastSeenAt: true,
				createdAt: true,
			},
			orderBy: { lastSeenAt: "desc" },
		});

		return {
			success: true,
			message: "Devices retrieved",
			data: sessions.map((s) => ({
				tokenId: s.tokenId,
				label: s.deviceLabel ?? "Unknown device",
				lastSeenAt: s.lastSeenAt,
				createdAt: s.createdAt,
				isCurrent: s.tokenId === session.user.sessionId,
			})),
		};
	} catch (error) {
		console.error("Failed to load devices:", error);
		return { success: false, message: "Failed to load your devices", data: [] };
	}
}

/**
 * Sign a device out.
 *
 * Signing out the device in your hand needs nothing — making it hard to leave
 * is hostile, and it is the one thing somebody on a borrowed phone urgently
 * wants to do. Signing out a *different* device needs the password, because
 * otherwise whoever is holding an unlocked, already-signed-in handset can strand
 * the real owner on every device they own.
 *
 * Accounts with no password set — anyone still at rung 0 — pass straight
 * through, since there is nothing to prove against and a parish code is their
 * way back in regardless.
 */
export async function revokeDevice(
	tokenId: string,
	password?: string,
): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const isCurrentDevice = tokenId === session.user.sessionId;

		if (!isCurrentDevice) {
			const reauth = await reauthenticate(session.user.id, password);
			if (!reauth.ok) {
				return { success: false, message: reauth.message };
			}
		}

		// Scoped to the caller's own sessions — a token id alone is not
		// authority to revoke anything.
		const result = await db.userSession.updateMany({
			where: { tokenId, userId: session.user.id, revokedAt: null },
			data: { revokedAt: new Date() },
		});

		if (result.count === 0) {
			return { success: false, message: "That device is already signed out" };
		}

		if (isCurrentDevice) {
			// Signing out the device you are holding. Drop the cookie too,
			// otherwise the page would keep rendering as signed in until the
			// next JWT check.
			await signOut({ redirectTo: "/feed" });
		}

		revalidatePath("/me/devices");
		return { success: true, message: "Device signed out", data: null };
	} catch (error) {
		console.error("Failed to revoke device:", error);
		return { success: false, message: "Failed to sign that device out" };
	}
}
