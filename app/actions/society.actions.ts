'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
    createSocietySchema,
    updateSocietySchema,
    addMemberSchema,
    createMeetingSchema,
} from '@/lib/validators/society.schema';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import { isFeatureEnabled } from '@/lib/features.server';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SocietyWithRelations = Prisma.SocietyGetPayload<{
	include: {
		president: {
			select: {
				id: true;
				firstName: true;
				lastName: true;
			};
		};
		secretary: {
			select: {
				id: true;
				firstName: true;
				lastName: true;
			};
		};
		_count: {
			select: { members: true };
		};
	};
}>;

export type SocietyWithDetails = Prisma.SocietyGetPayload<{
	include: {
		president: true;
		secretary: true;
		members: {
			include: {
				parishioner: true;
			};
		};
		events: true;
	};
}>;

// ============================================
// READ OPERATIONS
// ============================================

export async function getSocieties(): Promise<
	ActionResponse<SocietyWithRelations[]>
> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableSocieties'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Societies feature is not enabled',
			};
		}

		const societies = await db.society.findMany({
			where: { organizationId: session.user.organizationId },
			include: {
				president: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				secretary: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				_count: {
					select: { members: true },
				},
			},
			orderBy: { name: 'asc' },
		});

		return {
			success: true,
			message: 'Societies retrieved successfully',
			data: societies,
		};
	} catch (error) {
		console.error('Failed to get societies:', error);
		return { success: false, message: 'Failed to retrieve societies' };
	}
}

export async function getSociety(
	id: string
): Promise<ActionResponse<SocietyWithDetails>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableSocieties'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Societies feature is not enabled',
			};
		}

		// Verify organization ownership with findFirst
		const society = await db.society.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId, // Organization scoping!
			},
			include: {
				president: true,
				secretary: true,
				members: {
					include: {
						parishioner: true,
					},
				},
				events: {
					orderBy: { startTime: 'asc' },
				},
			},
		});

		if (!society) {
			return { success: false, message: 'Society not found' };
		}

		return {
			success: true,
			message: 'Society retrieved successfully',
			data: society,
		};
	} catch (error) {
		console.error('Failed to get society:', error);
		return { success: false, message: 'Failed to retrieve society' };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createSociety(
	formData: unknown
): Promise<ActionResponse<SocietyWithRelations>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Authorization - only staff can create societies
		const allowedRoles = [
			'SUPER_ADMIN',
			'PARISH_ADMIN',
			'PARISH_SECRETARY',
			'PARISH_STAFF',
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableSocieties'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Societies feature is not enabled',
			};
		}

		// Validation
		const parsed = createSocietySchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const { presidentId, secretaryId, ...rest } = parsed.data;
		const data = {
			...rest,
			organizationId: session.user.organizationId,
			...(presidentId && { presidentId }),
			...(secretaryId && { secretaryId }),
		};

		const society = await db.society.create({
			data,
			include: {
				president: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				secretary: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				_count: {
					select: { members: true },
				},
			},
		});

		revalidatePath('/dashboard/societies');

		return {
			success: true,
			message: 'Society created successfully',
			data: society,
		};
	} catch (error) {
		console.error('Failed to create society:', error);
		return { success: false, message: 'Failed to create society' };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateSociety(
	id: string,
	formData: unknown
): Promise<ActionResponse<SocietyWithRelations>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Authorization
		const allowedRoles = [
			'SUPER_ADMIN',
			'PARISH_ADMIN',
			'PARISH_SECRETARY',
			'PARISH_STAFF',
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Validation
		const parsed = updateSocietySchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify ownership
		const existing = await db.society.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: 'Society not found' };
		}

		const society = await db.society.update({
			where: { id },
			data: parsed.data,
			include: {
				president: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				secretary: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
				_count: {
					select: { members: true },
				},
			},
		});

		revalidatePath(`/dashboard/societies/${id}`);
		revalidatePath('/dashboard/societies');

		return {
			success: true,
			message: 'Society updated successfully',
			data: society,
		};
	} catch (error) {
		console.error('Failed to update society:', error);
		return { success: false, message: 'Failed to update society' };
	}
}

// ============================================
// MEMBER OPERATIONS
// ============================================

export async function addMember(
	societyId: string,
	formData: unknown
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Validation
		const parsed = addMemberSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify organization ownership
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!society) {
			return { success: false, message: 'Society not found' };
		}

		// Check if member already exists
		const existingMember = await db.societyMembership.findUnique({
			where: {
				parishionerId_societyId: {
					parishionerId: parsed.data.parishionerId,
					societyId,
				},
			},
		});

		if (existingMember) {
			return {
				success: false,
				message: 'Parishioner is already a member of this society',
			};
		}

		await db.societyMembership.create({
			data: {
				societyId,
				parishionerId: parsed.data.parishionerId,
				role: parsed.data.role,
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}`);

		return {
			success: true,
			message: 'Member added successfully',
		};
	} catch (error) {
		console.error('Failed to add member:', error);
		return { success: false, message: 'Failed to add member' };
	}
}

export async function removeMember(
	societyId: string,
	parishionerId: string
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Verify organization ownership
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!society) {
			return { success: false, message: 'Society not found' };
		}

		await db.societyMembership.delete({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}`);

		return {
			success: true,
			message: 'Member removed successfully',
		};
	} catch (error) {
		console.error('Failed to remove member:', error);
		return { success: false, message: 'Failed to remove member' };
	}
}

// ============================================
// EVENT/MEETING OPERATIONS
// ============================================

export async function createMeeting(
	societyId: string,
	formData: unknown
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Validation
		const parsed = createMeetingSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify organization ownership
		const society = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!society) {
			return { success: false, message: 'Society not found' };
		}

		await db.event.create({
			data: {
				title: parsed.data.title,
				startTime: parsed.data.startTime,
				endTime: parsed.data.endTime,
				description: parsed.data.description,
				location: parsed.data.location,
				organizationId: session.user.organizationId,
				societyId,
				type: 'MEETING',
				status: 'SCHEDULED',
			},
		});

		revalidatePath(`/dashboard/societies/${societyId}`);

		return {
			success: true,
			message: 'Meeting scheduled successfully',
		};
	} catch (error) {
		console.error('Failed to create meeting:', error);
		return { success: false, message: 'Failed to schedule meeting' };
	}
}

export async function markAttendance(
	eventId: string,
	parishionerId: string,
	status: string
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Verify event belongs to user's organization
		const event = await db.event.findFirst({
			where: {
				id: eventId,
				organizationId: session.user.organizationId,
			},
		});

		if (!event) {
			return { success: false, message: 'Event not found' };
		}

		await db.eventAttendance.upsert({
			where: {
				eventId_parishionerId: {
					eventId,
					parishionerId,
				},
			},
			create: {
				eventId,
				parishionerId,
				status,
			},
			update: {
				status,
			},
		});

		return {
			success: true,
			message: 'Attendance marked successfully',
		};
	} catch (error) {
		console.error('Failed to mark attendance:', error);
		return { success: false, message: 'Failed to mark attendance' };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function deleteSociety(
	id: string
): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only admins can delete
		if (!['SUPER_ADMIN', 'PARISH_ADMIN'].includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Verify ownership
		const existing = await db.society.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: 'Society not found' };
		}

		// Delete memberships first (cascade might handle this)
		await db.societyMembership.deleteMany({
			where: { societyId: id },
		});

		await db.society.delete({ where: { id } });

		revalidatePath('/dashboard/societies');

		return {
			success: true,
			message: 'Society deleted successfully',
		};
	} catch (error) {
		console.error('Failed to delete society:', error);
		return { success: false, message: 'Failed to delete society' };
	}
}
