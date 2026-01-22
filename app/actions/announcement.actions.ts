'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
    announcementFilterSchema,
    createAnnouncementSchema,
    updateAnnouncementSchema,
    type AnnouncementFilter,
} from '@/lib/validators/announcement.schema';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import { isFeatureEnabled } from '@/lib/features.server';

type AnnouncementWithOrganization = Prisma.AnnouncementGetPayload<{
	include: {
		organization: {
			select: {
				id: true;
				name: true;
				level: true;
			};
		};
	};
}>;

const activeAnnouncementWhere = (now: Date) =>
	({
		isPublished: true,
		publishedAt: { lte: now },
		OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
	} satisfies Prisma.AnnouncementWhereInput);

export async function getAnnouncementsFiltered(
	query?: Partial<AnnouncementFilter>
): Promise<
	ActionResponse<{ announcements: AnnouncementWithOrganization[]; total: number }>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableAnnouncements'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Announcements feature is not enabled',
			};
		}

		const parsed = announcementFilterSchema.safeParse(query || {});
		if (!parsed.success) {
			return {
				success: false,
				message: 'Invalid announcement filters',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const { page, limit, search, status } = parsed.data;
		const now = new Date();

		const filters: Prisma.AnnouncementWhereInput[] = [];
		if (search) {
			filters.push({
				OR: [
					{ title: { contains: search, mode: 'insensitive' } },
					{ content: { contains: search, mode: 'insensitive' } },
				],
			});
		}

		if (status === 'draft') {
			filters.push({ isPublished: false });
		}

		if (status === 'scheduled') {
			filters.push({ isPublished: true, publishedAt: { gt: now } });
		}

		if (status === 'active') {
			filters.push(activeAnnouncementWhere(now));
		}

		if (status === 'expired') {
			filters.push({ isPublished: true, expiresAt: { lte: now } });
		}

		const where: Prisma.AnnouncementWhereInput = {
			organizationId: session.user.organizationId,
			...(filters.length ? { AND: filters } : {}),
		};

		const [announcements, total] = await Promise.all([
			db.announcement.findMany({
				where,
				include: {
					organization: {
						select: {
							id: true,
							name: true,
							level: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * limit,
				take: limit,
			}),
			db.announcement.count({ where }),
		]);

		return {
			success: true,
			message: 'Announcements retrieved successfully',
			data: { announcements, total },
		};
	} catch (error) {
		console.error('Failed to get announcements:', error);
		return {
			success: false,
			message: 'Failed to retrieve announcements',
		};
	}
}

export async function getAnnouncement(
	id: string
): Promise<ActionResponse<AnnouncementWithOrganization>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const announcement = await db.announcement.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						level: true,
					},
				},
			},
		});

		if (!announcement) {
			return { success: false, message: 'Announcement not found' };
		}

		return {
			success: true,
			message: 'Announcement retrieved successfully',
			data: announcement,
		};
	} catch (error) {
		console.error('Failed to get announcement:', error);
		return { success: false, message: 'Failed to retrieve announcement' };
	}
}

export async function createAnnouncement(
	formData: unknown
): Promise<ActionResponse<AnnouncementWithOrganization>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableAnnouncements'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Announcements feature is not enabled',
			};
		}

		const parsed = createAnnouncementSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const publishAt = parsed.data.publishAt ?? new Date();

		const announcement = await db.announcement.create({
			data: {
				title: parsed.data.title,
				content: parsed.data.content,
				targetLevels: parsed.data.targetLevels,
				organizationId: session.user.organizationId,
				isPublished: true,
				publishedAt: publishAt,
				expiresAt: parsed.data.expiresAt ?? null,
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						level: true,
					},
				},
			},
		});

		revalidatePath('/dashboard/announcements');
		revalidatePath('/dashboard');

		return {
			success: true,
			message: 'Announcement created successfully',
			data: announcement,
		};
	} catch (error) {
		console.error('Failed to create announcement:', error);
		return { success: false, message: 'Failed to create announcement' };
	}
}

export async function updateAnnouncement(
	id: string,
	formData: unknown
): Promise<ActionResponse<AnnouncementWithOrganization>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableAnnouncements'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Announcements feature is not enabled',
			};
		}

		const parsed = updateAnnouncementSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
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
			return { success: false, message: 'Announcement not found' };
		}

		const data: Prisma.AnnouncementUpdateInput = {};
		if (parsed.data.title) data.title = parsed.data.title;
		if (parsed.data.content) data.content = parsed.data.content;
		if (parsed.data.targetLevels) data.targetLevels = parsed.data.targetLevels;
		if (parsed.data.publishAt !== undefined) {
			data.publishedAt = parsed.data.publishAt ?? null;
		}
		if (parsed.data.expiresAt !== undefined) {
			data.expiresAt = parsed.data.expiresAt;
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
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						level: true,
					},
				},
			},
		});

		revalidatePath('/dashboard/announcements');
		revalidatePath('/dashboard');
		revalidatePath('/announcements');

		return {
			success: true,
			message: 'Announcement updated successfully',
			data: announcement,
		};
	} catch (error) {
		console.error('Failed to update announcement:', error);
		return { success: false, message: 'Failed to update announcement' };
	}
}

export async function deleteAnnouncement(
	id: string
): Promise<ActionResponse<null>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableAnnouncements'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Announcements feature is not enabled',
			};
		}

		const announcement = await db.announcement.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!announcement) {
			return { success: false, message: 'Announcement not found' };
		}

		await db.announcement.delete({ where: { id } });

		revalidatePath('/dashboard/announcements');
		revalidatePath('/dashboard');

		return {
			success: true,
			message: 'Announcement deleted successfully',
			data: null,
		};
	} catch (error) {
		console.error('Failed to delete announcement:', error);
		return { success: false, message: 'Failed to delete announcement' };
	}
}

export async function getActiveAnnouncementsForOrg(
	limit = 5
): Promise<ActionResponse<AnnouncementWithOrganization[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableAnnouncements'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Announcements feature is not enabled',
			};
		}

		const organization = await db.organization.findUnique({
			where: { id: session.user.organizationId },
			select: { level: true },
		});

		if (!organization) {
			return { success: false, message: 'Organization not found' };
		}

		const now = new Date();
		const announcements = await db.announcement.findMany({
			where: {
				organizationId: session.user.organizationId,
				targetLevels: { has: organization.level },
				...activeAnnouncementWhere(now),
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						level: true,
					},
				},
			},
			orderBy: { publishedAt: 'desc' },
			take: limit,
		});

		return {
			success: true,
			message: 'Announcements retrieved successfully',
			data: announcements,
		};
	} catch (error) {
		console.error('Failed to get active announcements:', error);
		return {
			success: false,
			message: 'Failed to retrieve announcements',
		};
	}
}

export async function getPublicAnnouncements(): Promise<
	ActionResponse<AnnouncementWithOrganization[]>
> {
	try {
		const now = new Date();
		const announcements = await db.announcement.findMany({
			where: {
				...activeAnnouncementWhere(now),
				organization: {
					featureSettings: {
						is: {
							enableAnnouncements: true,
							enablePublicWebsite: true,
						},
					},
				},
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						level: true,
					},
				},
			},
			orderBy: { publishedAt: 'desc' },
		});

		return {
			success: true,
			message: 'Public announcements retrieved successfully',
			data: announcements,
		};
	} catch (error) {
		console.error('Failed to get public announcements:', error);
		return {
			success: false,
			message: 'Failed to retrieve announcements',
		};
	}
}
