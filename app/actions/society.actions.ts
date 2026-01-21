'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
	createsocietySchema,
	updatesocietySchema,
	addMemberSchema,
	createMeetingSchema,
} from '@/lib/validators/pious-organization.schema';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import { isFeatureEnabled } from '@/lib/features';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type societyWithRelations = Prisma.societyGetPayload<{
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

export type societyWithDetails = Prisma.societyGetPayload<{
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

export async function getsocietys(): Promise<
	ActionResponse<societyWithRelations[]>
> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enablesocietys'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Pious Organizations feature is not enabled',
			};
		}

		const organizations = await db.society.findMany({
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
			message: 'Organizations retrieved successfully',
			data: organizations,
		};
	} catch (error) {
		console.error('Failed to get pious organizations:', error);
		return { success: false, message: 'Failed to retrieve organizations' };
	}
}

export async function getsociety(
	id: string
): Promise<ActionResponse<societyWithDetails>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enablesocietys'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Pious Organizations feature is not enabled',
			};
		}

		// Verify organization ownership with findFirst
		const organization = await db.society.findFirst({
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

		if (!organization) {
			return { success: false, message: 'Organization not found' };
		}

		return {
			success: true,
			message: 'Organization retrieved successfully',
			data: organization,
		};
	} catch (error) {
		console.error('Failed to get pious organization:', error);
		return { success: false, message: 'Failed to retrieve organization' };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createsociety(
	formData: unknown
): Promise<ActionResponse<societyWithRelations>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Authorization - only staff can create organizations
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
			'enablesocietys'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Pious Organizations feature is not enabled',
			};
		}

		// Validation
		const parsed = createsocietySchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const organization = await db.society.create({
			data: {
				...parsed.data,
				organizationId: session.user.organizationId,
			},
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

		revalidatePath('/dashboard/organizations');

		return {
			success: true,
			message: 'Organization created successfully',
			data: organization,
		};
	} catch (error) {
		console.error('Failed to create pious organization:', error);
		return { success: false, message: 'Failed to create organization' };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updatesociety(
	id: string,
	formData: unknown
): Promise<ActionResponse<societyWithRelations>> {
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
		const parsed = updatesocietySchema.safeParse(formData);
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
			return { success: false, message: 'Organization not found' };
		}

		const organization = await db.society.update({
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

		revalidatePath(`/dashboard/organizations/${id}`);
		revalidatePath('/dashboard/organizations');

		return {
			success: true,
			message: 'Organization updated successfully',
			data: organization,
		};
	} catch (error) {
		console.error('Failed to update pious organization:', error);
		return { success: false, message: 'Failed to update organization' };
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
		const organization = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!organization) {
			return { success: false, message: 'Organization not found' };
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
				message: 'Parishioner is already a member of this organization',
			};
		}

		await db.societyMembership.create({
			data: {
				societyId,
				parishionerId: parsed.data.parishionerId,
				role: parsed.data.role,
			},
		});

		revalidatePath(`/dashboard/organizations/${societyId}`);

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
		const organization = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!organization) {
			return { success: false, message: 'Organization not found' };
		}

		await db.societyMembership.delete({
			where: {
				parishionerId_societyId: {
					parishionerId,
					societyId,
				},
			},
		});

		revalidatePath(`/dashboard/organizations/${societyId}`);

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
		const organization = await db.society.findFirst({
			where: {
				id: societyId,
				organizationId: session.user.organizationId,
			},
		});

		if (!organization) {
			return { success: false, message: 'Organization not found' };
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

		revalidatePath(`/dashboard/organizations/${societyId}`);

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

export async function deletesociety(
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
			return { success: false, message: 'Organization not found' };
		}

		// Delete memberships first (cascade might handle this)
		await db.societyMembership.deleteMany({
			where: { societyId: id },
		});

		await db.society.delete({ where: { id } });

		revalidatePath('/dashboard/organizations');

		return {
			success: true,
			message: 'Organization deleted successfully',
		};
	} catch (error) {
		console.error('Failed to delete pious organization:', error);
		return { success: false, message: 'Failed to delete organization' };
	}
}
