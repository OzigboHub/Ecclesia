import { sendParishEventNotification } from "@/lib/notifications/parish-events";

export type AnnouncementNotificationInput = {
	id: string;
	title: string;
	content: string;
	imageUrl: string | null;
	organizationId: string;
	organizationName: string;
};

export async function sendAnnouncementNotifications(
	announcement: AnnouncementNotificationInput,
) {
	try {
		const body = `A new parish announcement is available:\n\n${announcement.content}`;

		await sendParishEventNotification({
			organizationId: announcement.organizationId,
			organizationName: announcement.organizationName,
			audience: "ALL_ORG_USERS",
			title: `New announcement from ${announcement.organizationName}`,
			body,
			url: "/announcements",
			imageUrl: announcement.imageUrl,
		});
	} catch (error) {
		console.error("Failed to send announcement notifications:", error);
	}
}
