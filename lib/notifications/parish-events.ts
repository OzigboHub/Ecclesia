import type { Prisma, UserRole } from "@prisma/client";
import { Resend } from "resend";
import webpush from "web-push";

import db from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features.server";
import { renderBrandedEmailTemplate } from "@/lib/notifications/email-template";

const DEFAULT_FROM_EMAIL = "support@ecclesialight.com";
const DEFAULT_FROM_NAME = "Ecclesia";

const ADMIN_SECRETARY_ROLES: UserRole[] = ["PARISH_ADMIN", "PARISH_SECRETARY"];
const PARISHIONER_ROLE: UserRole = "PARISHIONER";

type NotificationAudience =
	| "ALL_ORG_USERS"
	| "PARISH_ADMIN_AND_SECRETARY"
	| "PARISHIONERS";

export type ParishEventNotificationInput = {
	organizationId: string;
	organizationName: string;
	audience: NotificationAudience;
	targetUserIds?: string[];
	excludeUserIds?: string[];
	title: string;
	body: string;
	url: string;
	imageUrl?: string | null;
};

let vapidConfigured = false;

function getMailSender() {
	const fromAddress =
		process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
	const fromName = process.env.RESEND_FROM_NAME?.trim() || DEFAULT_FROM_NAME;
	return `${fromName} <${fromAddress}>`;
}

function ensureVapidConfigured() {
	if (vapidConfigured) return true;

	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	const subject =
		process.env.VAPID_SUBJECT?.trim() ||
		`mailto:${process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL}`;

	if (!publicKey || !privateKey) {
		return false;
	}

	webpush.setVapidDetails(subject, publicKey, privateKey);
	vapidConfigured = true;
	return true;
}

async function getAudienceUsers(input: ParishEventNotificationInput) {
	const where: Prisma.UserWhereInput = {
		organizationId: input.organizationId,
		isActive: true,
	};

	if (input.audience === "PARISH_ADMIN_AND_SECRETARY") {
		where.role = { in: [...ADMIN_SECRETARY_ROLES] };
	} else if (input.audience === "PARISHIONERS") {
		where.role = PARISHIONER_ROLE;
	}

	if (input.targetUserIds && input.targetUserIds.length > 0) {
		where.id = { in: input.targetUserIds };
	}

	if (input.excludeUserIds && input.excludeUserIds.length > 0) {
		where.NOT = {
			id: { in: input.excludeUserIds },
		};
	}

	return db.user.findMany({
		where,
		select: {
			id: true,
			email: true,
		},
	});
}

async function sendParishEventEmails(input: ParishEventNotificationInput) {
	const emailEnabled = await isFeatureEnabled(
		input.organizationId,
		"enableEmailNotifications",
	);
	if (!emailEnabled) return;

	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured - event email skipped");
		return;
	}

	const users = await getAudienceUsers(input);
	if (users.length === 0) return;

	const resend = new Resend(process.env.RESEND_API_KEY);
	const sender = getMailSender();

	const html = renderBrandedEmailTemplate({
		title: input.title,
		message: `${input.organizationName}\n\n${input.body}`,
		ctaLabel: "Open in Ecclesia",
		ctaUrl: input.url,
	});

	const chunkSize = 20;
	for (let i = 0; i < users.length; i += chunkSize) {
		const chunk = users.slice(i, i + chunkSize);
		await Promise.allSettled(
			chunk.map((user) =>
				resend.emails.send({
					from: sender,
					to: user.email,
					subject: input.title,
					html,
				}),
			),
		);
	}
}

async function sendParishEventPush(input: ParishEventNotificationInput) {
	const isConfigured = ensureVapidConfigured();
	if (!isConfigured) {
		console.warn("VAPID keys not configured - push notifications skipped");
		return;
	}

	const users = await getAudienceUsers(input);
	if (users.length === 0) return;
	const userIds = users.map((user) => user.id);

	const subscriptions = await db.pushSubscription.findMany({
		where: {
			organizationId: input.organizationId,
			userId: { in: userIds },
		},
		select: {
			id: true,
			endpoint: true,
			p256dh: true,
			auth: true,
		},
	});

	if (subscriptions.length === 0) return;

	const pushBody =
		input.body.length > 180 ? `${input.body.slice(0, 177)}...` : input.body;

	const payload = JSON.stringify({
		title: input.title,
		body: pushBody,
		url: input.url,
		imageUrl: input.imageUrl ?? null,
	});

	const toRemove: string[] = [];

	await Promise.allSettled(
		subscriptions.map(async (subscription) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: subscription.endpoint,
						keys: {
							p256dh: subscription.p256dh,
							auth: subscription.auth,
						},
					},
					payload,
				);
			} catch (error: any) {
				const statusCode = error?.statusCode as number | undefined;
				if (statusCode === 404 || statusCode === 410) {
					toRemove.push(subscription.id);
				} else {
					console.error("Failed to send push notification:", error);
				}
			}
		}),
	);

	if (toRemove.length > 0) {
		await db.pushSubscription.deleteMany({
			where: { id: { in: toRemove } },
		});
	}
}

export async function sendParishEventNotification(
	input: ParishEventNotificationInput,
) {
	try {
		await Promise.all([
			sendParishEventEmails(input),
			sendParishEventPush(input),
		]);
	} catch (error) {
		console.error("Failed to send parish event notifications:", error);
	}
}
