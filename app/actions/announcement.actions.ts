"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features.server";
import { HIDDEN_ORGANIZATION_NAMES } from "@/lib/organization-visibility";
import { sendAnnouncementNotifications } from "@/lib/notifications/announcements";
import {
	canApproveAnnouncements,
	canCreateSocietyAnnouncement,
	canManageSocieties,
} from "@/lib/permissions";
import {
	announcementFilterSchema,
	createAnnouncementSchema,
	updateAnnouncementSchema,
	type AnnouncementFilter,
} from "@/lib/validators/announcement.schema";
import type { ActionResponse } from "@/types";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type AnnouncementWithOrganization = Prisma.AnnouncementGetPayload<{
	select: {
		id: true;
		title: true;
		content: true;
		imageUrl: true;
		organizationId: true;
		targetLevels: true;
		isPublished: true;
		publishedAt: true;
		expiresAt: true;
		createdAt: true;
		updatedAt: true;
	};
}>;

/** Shape returned to unauthenticated callers — the feed and parish pages. */
export type PublicAnnouncement = {
	id: string;
	title: string;
	content: string;
	imageUrl: string | null;
	organizationId: string;
	organizationName: string;
	society: { id: string; name: string } | null;
	publishedAt: Date;
};

const activeAnnouncementWhere = (now: Date) =>
	({
		isPublished: true,
		AND: [
			{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
			{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
		],
	}) as Prisma.AnnouncementWhereInput;

export async function getAnnouncementsFiltered(
	query?: Partial<AnnouncementFilter>,
): Promise<
	ActionResponse<{
		announcements: AnnouncementWithOrganization[];
		total: number;
	}>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableAnnouncements",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Announcements feature is not enabled",
			};
		}

		const parsed = announcementFilterSchema.safeParse(query || {});
		if (!parsed.success) {
			return {
				success: false,
				message: "Invalid announcement filters",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const { page, limit, search, status } = parsed.data;
		const now = new Date();

		const filters: Prisma.AnnouncementWhereInput[] = [];
		if (search) {
			filters.push({
				OR: [
					{ title: { contains: search, mode: "insensitive" } },
					{ content: { contains: search, mode: "insensitive" } },
				],
			});
		}

		if (status === "draft") {
			filters.push({ isPublished: false });
		}

		if (status === "scheduled") {
			filters.push({ isPublished: true, publishedAt: { gt: now } });
		}

		if (status === "active") {
			filters.push(activeAnnouncementWhere(now));
		}

		const where: Prisma.AnnouncementWhereInput = {
			organizationId: session.user.organizationId,
			...(filters.length ? { AND: filters } : {}),
		};

		const [announcements, total] = await Promise.all([
			db.announcement.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			db.announcement.count({ where }),
		]);

		return {
			success: true,
			message: "Announcements retrieved successfully",
			data: { announcements, total },
		};
	} catch (error) {
		console.error("Failed to get announcements:", error);
		return {
			success: false,
			message: "Failed to retrieve announcements",
		};
	}
}

export async function getAnnouncement(
	id: string,
): Promise<ActionResponse<AnnouncementWithOrganization>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const announcement = await db.announcement.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!announcement) {
			return { success: false, message: "Announcement not found" };
		}

		return {
			success: true,
			message: "Announcement retrieved successfully",
			data: announcement,
		};
	} catch (error) {
		console.error("Failed to get announcement:", error);
		return { success: false, message: "Failed to retrieve announcement" };
	}
}

const ANNOUNCEMENT_WRITER_ROLES = [
	"SUPER_ADMIN",
	"PARISH_ADMIN",
	"PARISH_SECRETARY",
	"PARISH_STAFF",
	"OUTSTATION_ADMIN",
];

export async function createAnnouncement(
	formData: unknown,
): Promise<ActionResponse<AnnouncementWithOrganization>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!ANNOUNCEMENT_WRITER_ROLES.includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableAnnouncements",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Announcements feature is not enabled",
			};
		}

		const parsed = createAnnouncementSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const publishAt = parsed.data.publishAt ?? new Date();

		const announcement = await db.announcement.create({
			data: {
				title: parsed.data.title,
				content: parsed.data.content,
				imageUrl: parsed.data.imageUrl || null,
				organizationId: session.user.organizationId,
				targetLevels: ["PARISH", "OUTSTATION"],
				isPublished: true,
				publishedAt: publishAt,
				expiresAt: parsed.data.expiresAt ?? null,
			},
		});

		revalidatePath("/announcements");
		revalidatePath("/dashboard");

		const now = new Date();
		const shouldNotify =
			announcement.isPublished &&
			(!announcement.publishedAt || announcement.publishedAt <= now);
		if (shouldNotify) {
			await sendAnnouncementNotifications({
				id: announcement.id,
				title: announcement.title,
				content: announcement.content,
				imageUrl: announcement.imageUrl,
				organizationId: announcement.organizationId,
				organizationName: session.user.organizationName || "Parish",
			});
		}

		return {
			success: true,
			message: "Announcement created successfully",
			data: announcement,
		};
	} catch (error) {
		console.error("Failed to create announcement:", error);
		return { success: false, message: "Failed to create announcement" };
	}
}

export async function updateAnnouncement(
	id: string,
	formData: unknown,
): Promise<ActionResponse<AnnouncementWithOrganization>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!ANNOUNCEMENT_WRITER_ROLES.includes(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableAnnouncements",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Announcements feature is not enabled",
			};
		}

		const parsed = updateAnnouncementSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const existing = await db.announcement.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: "Announcement not found" };
		}

		const data: Prisma.AnnouncementUpdateInput = {};
		if (parsed.data.title) data.title = parsed.data.title;
		if (parsed.data.content) data.content = parsed.data.content;
		if (parsed.data.imageUrl !== undefined) {
			data.imageUrl = parsed.data.imageUrl || null;
		}
		if (parsed.data.publishAt !== undefined) {
			data.publishedAt = parsed.data.publishAt ?? null;
		}
		if (parsed.data.expiresAt !== undefined) {
			data.expiresAt = parsed.data.expiresAt ?? null;
		}
		if (parsed.data.isPublished !== undefined) {
			data.isPublished = parsed.data.isPublished;
			if (!parsed.data.isPublished) {
				data.publishedAt = null;
			} else if (!existing.publishedAt && !parsed.data.publishAt) {
				data.publishedAt = new Date();
			}
		}

		const announcement = await db.announcement.update({
			where: { id },
			data,
		});

		revalidatePath("/announcements");
		revalidatePath("/dashboard");

		const now = new Date();
		const previousPublishedAt = existing.publishedAt;
		const nextPublishedAt =
			data.publishedAt !== undefined ?
				data.publishedAt
			:	previousPublishedAt;
		const wasLive =
			existing.isPublished &&
			(!previousPublishedAt || previousPublishedAt <= now);
		const willBeLive =
			(data.isPublished ?? existing.isPublished) &&
			(!nextPublishedAt || nextPublishedAt <= now);
		if (!wasLive && willBeLive) {
			await sendAnnouncementNotifications({
				id: announcement.id,
				title: announcement.title,
				content: announcement.content,
				imageUrl: announcement.imageUrl,
				organizationId: announcement.organizationId,
				organizationName: session.user.organizationName || "Parish",
			});
		}

		return {
			success: true,
			message: "Announcement updated successfully",
			data: announcement,
		};
	} catch (error) {
		console.error("Failed to update announcement:", error);
		return { success: false, message: "Failed to update announcement" };
	}
}

const ANNOUNCEMENT_DELETE_ROLES = ["SUPER_ADMIN", "PARISH_ADMIN"];

export async function deleteAnnouncement(
	id: string,
): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!ANNOUNCEMENT_DELETE_ROLES.includes(session.user.role)) {
			return {
				success: false,
				message: "Only parish admins can delete announcements",
			};
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableAnnouncements",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Announcements feature is not enabled",
			};
		}

		const announcement = await db.announcement.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!announcement) {
			return { success: false, message: "Announcement not found" };
		}

		await db.announcement.delete({ where: { id } });

		revalidatePath("/announcements");
		revalidatePath("/dashboard");

		return {
			success: true,
			message: "Announcement deleted successfully",
			data: null,
		};
	} catch (error) {
		console.error("Failed to delete announcement:", error);
		return { success: false, message: "Failed to delete announcement" };
	}
}

export async function getActiveAnnouncementsForOrg(
	limit = 5,
): Promise<ActionResponse<AnnouncementWithOrganization[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableAnnouncements",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Announcements feature is not enabled",
			};
		}

		const now = new Date();

		const announcements = await db.announcement.findMany({
			where: {
				organizationId: session.user.organizationId,
				isPublished: true,
				OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
			},
			select: {
				id: true,
				title: true,
				content: true,
				imageUrl: true,
				organizationId: true,
				isPublished: true,
				publishedAt: true,
				expiresAt: true,
				createdAt: true,
				updatedAt: true,
				targetLevels: true,
			},
			orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
			take: limit,
		});

		return {
			success: true,
			message: "Announcements retrieved successfully",
			data: announcements,
		};
	} catch (error) {
		console.error("Failed to get active announcements:", error);
		return {
			success: false,
			message: "Failed to retrieve announcements",
		};
	}
}

/**
 * Published, unexpired, approved announcements for anyone — no session.
 *
 * This previously returned a hard-coded empty array to keep builds green on
 * deployments whose database predated some announcement columns. That made the
 * richest source of feed content invisible to every visitor. The query now runs
 * for real, and the catch below preserves the original safety property: a
 * database that cannot answer degrades to an empty feed section rather than
 * taking the page down.
 *
 * `organizationId` is a plain scalar on Announcement — there is no Prisma
 * relation to Organization — so parish names are resolved by a second keyed
 * lookup rather than an include.
 */
export async function getPublicAnnouncements(
	options: { organizationId?: string; limit?: number } = {},
): Promise<ActionResponse<PublicAnnouncement[]>> {
	const { organizationId, limit = 20 } = options;

	try {
		const now = new Date();

		const announcements = await db.announcement.findMany({
			where: {
				...(organizationId ? { organizationId } : {}),
				isPublished: true,
				approvalStatus: "APPROVED",
				OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
			},
			select: {
				id: true,
				title: true,
				content: true,
				imageUrl: true,
				organizationId: true,
				societyId: true,
				publishedAt: true,
				createdAt: true,
				society: { select: { id: true, name: true } },
			},
			orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
			take: limit,
		});

		if (announcements.length === 0) {
			return { success: true, message: "No announcements", data: [] };
		}

		const organizations = await db.organization.findMany({
			where: {
				id: { in: [...new Set(announcements.map((a) => a.organizationId))] },
				name: { notIn: HIDDEN_ORGANIZATION_NAMES },
			},
			select: { id: true, name: true },
		});
		const orgNames = new Map(organizations.map((o) => [o.id, o.name]));

		const data: PublicAnnouncement[] = announcements
			// Drop anything whose parish is hidden from public listings.
			.filter((a) => orgNames.has(a.organizationId))
			.map((a) => ({
				id: a.id,
				title: a.title,
				content: a.content,
				imageUrl: a.imageUrl,
				organizationId: a.organizationId,
				organizationName: orgNames.get(a.organizationId) ?? "",
				society: a.society,
				publishedAt: a.publishedAt ?? a.createdAt,
			}));

		return {
			success: true,
			message: "Announcements retrieved",
			data,
		};
	} catch (error) {
		console.error("Failed to get public announcements:", error);
		return {
			success: false,
			message: "Failed to retrieve announcements",
			data: [],
		};
	}
}

// ============================================
// SOCIETY HEAD ANNOUNCEMENT MANAGEMENT
// ============================================

type SocietyAnnouncementItem = {
	id: string;
	title: string;
	content: string;
	imageUrl: string | null;
	isPublished: boolean;
	publishedAt: Date | null;
	expiresAt: Date | null;
	createdAt: Date;
	approvalStatus: string;
	rejectionReason: string | null;
	societyId: string | null;
};

/**
 * Create an announcement on behalf of a society (requires admin approval)
 */
export async function createSocietyAnnouncement(
	societyId: string,
	formData: unknown,
): Promise<ActionResponse<SocietyAnnouncementItem>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canCreateSocietyAnnouncement(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			"enableAnnouncements",
		);
		if (!enabled) {
			return {
				success: false,
				message: "Announcements feature is not enabled",
			};
		}

		const parishionerId = session.user.parishionerId ?? null;
		if (!parishionerId) {
			return {
				success: false,
				message: "You are not a leader of this society",
			};
		}

		// Verify user is leader of this society
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
				OR: [
					{ presidentId: parishionerId },
					{ secretaryId: parishionerId },
				],
			},
		});

		if (!society) {
			return {
				success: false,
				message: "You are not a leader of this society",
			};
		}

		const parsed = createAnnouncementSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: "Validation failed",
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const announcement = await db.announcement.create({
			data: {
				title: parsed.data.title,
				content: parsed.data.content,
				imageUrl: parsed.data.imageUrl || null,
				organizationId: session.user.organizationId,
				targetLevels: ["PARISH", "OUTSTATION"],
				isPublished: false,
				approvalStatus: "PENDING_APPROVAL",
				createdById: session.user.id,
				societyId,
				expiresAt: parsed.data.expiresAt ?? null,
			},
		});

		revalidatePath("/announcements");
		revalidatePath(`/dashboard/societies/${societyId}/manage`);

		return {
			success: true,
			message: "Announcement submitted for approval",
			data: announcement,
		};
	} catch (error) {
		console.error("Failed to create society announcement:", error);
		return { success: false, message: "Failed to create announcement" };
	}
}

/**
 * Get announcements created by a society
 */
export async function getSocietyAnnouncements(
	societyId: string,
): Promise<ActionResponse<SocietyAnnouncementItem[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
			select: { presidentId: true, secretaryId: true },
		});

		if (!society) {
			return { success: false, message: "Society not found" };
		}

		const parishionerId = session.user.parishionerId ?? null;
		const isSocietyLeader =
			parishionerId !== null &&
			(society.presidentId === parishionerId ||
				society.secretaryId === parishionerId);

		if (!canManageSocieties(session.user.role) && !isSocietyLeader) {
			return { success: false, message: "Permission denied" };
		}

		const announcements = await db.announcement.findMany({
			where: {
				societyId,
				organizationId: session.user.organizationId,
			},
			select: {
				id: true,
				title: true,
				content: true,
				imageUrl: true,
				isPublished: true,
				publishedAt: true,
				expiresAt: true,
				createdAt: true,
				approvalStatus: true,
				rejectionReason: true,
				societyId: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return {
			success: true,
			message: "Society announcements retrieved",
			data: announcements,
		};
	} catch (error) {
		console.error("Failed to get society announcements:", error);
		return { success: false, message: "Failed to retrieve announcements" };
	}
}

/**
 * Approve a society announcement (Admin/Secretary only)
 */
export async function approveSocietyAnnouncement(
	id: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canApproveAnnouncements(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const announcement = await db.announcement.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
				approvalStatus: "PENDING_APPROVAL",
			},
		});

		if (!announcement) {
			return {
				success: false,
				message: "Announcement not found or already reviewed",
			};
		}

		await db.announcement.update({
			where: { id },
			data: {
				approvalStatus: "APPROVED",
				isPublished: true,
				publishedAt: new Date(),
				reviewedById: session.user.id,
				reviewedAt: new Date(),
			},
		});

		revalidatePath("/announcements");
		revalidatePath("/dashboard");
		if (announcement.societyId) {
			revalidatePath(
				`/dashboard/societies/${announcement.societyId}/manage`,
			);
		}

		await sendAnnouncementNotifications({
			id: announcement.id,
			title: announcement.title,
			content: announcement.content,
			imageUrl: announcement.imageUrl,
			organizationId: announcement.organizationId,
			organizationName: session.user.organizationName || "Parish",
		});

		return {
			success: true,
			message: "Announcement approved and published",
		};
	} catch (error) {
		console.error("Failed to approve announcement:", error);
		return { success: false, message: "Failed to approve announcement" };
	}
}

/**
 * Reject a society announcement (Admin/Secretary only)
 */
export async function rejectSocietyAnnouncement(
	id: string,
	reason?: string,
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canApproveAnnouncements(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const announcement = await db.announcement.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
				approvalStatus: "PENDING_APPROVAL",
			},
		});

		if (!announcement) {
			return {
				success: false,
				message: "Announcement not found or already reviewed",
			};
		}

		await db.announcement.update({
			where: { id },
			data: {
				approvalStatus: "REJECTED",
				isPublished: false,
				reviewedById: session.user.id,
				reviewedAt: new Date(),
				rejectionReason: reason || null,
			},
		});

		revalidatePath("/announcements");
		if (announcement.societyId) {
			revalidatePath(
				`/dashboard/societies/${announcement.societyId}/manage`,
			);
		}

		return { success: true, message: "Announcement rejected" };
	} catch (error) {
		console.error("Failed to reject announcement:", error);
		return { success: false, message: "Failed to reject announcement" };
	}
}

/**
 * Get all pending announcements for admin review
 */
export async function getPendingAnnouncements(): Promise<
	ActionResponse<SocietyAnnouncementItem[]>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (!canApproveAnnouncements(session.user.role)) {
			return { success: false, message: "Permission denied" };
		}

		const announcements = await db.announcement.findMany({
			where: {
				organizationId: session.user.organizationId,
				approvalStatus: "PENDING_APPROVAL",
			},
			select: {
				id: true,
				title: true,
				content: true,
				imageUrl: true,
				isPublished: true,
				publishedAt: true,
				expiresAt: true,
				createdAt: true,
				approvalStatus: true,
				rejectionReason: true,
				societyId: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return {
			success: true,
			message: "Pending announcements retrieved",
			data: announcements,
		};
	} catch (error) {
		console.error("Failed to get pending announcements:", error);
		return {
			success: false,
			message: "Failed to retrieve pending announcements",
		};
	}
}
