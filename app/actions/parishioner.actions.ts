'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
	createParishionerSchema,
	updateParishionerSchema,
} from '@/lib/validators/parishioner.schema';
import type { ActionResponse } from '@/types';
import type { Parishioner } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Type for parishioner with relations
type ParishionerWithRelations = Prisma.ParishionerGetPayload<{
	include: {
		organization: true;
		sacraments: true;
		payments: true;
	};
}>;

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all parishioners for the current organization
 */
export async function getParishioners(): Promise<
	ActionResponse<Parishioner[]>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Check if feature is enabled
		const settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId: session.user.organizationId },
		});

		if (!settings?.enableParishionerManagement) {
			return {
				success: false,
				message:
					'Parishioner management is not enabled for your organization',
			};
		}

		const parishioners = await db.parishioner.findMany({
			where: {
				organizationId: session.user.organizationId,
				isActive: true,
			},
			orderBy: { lastName: 'asc' },
		});

		return {
			success: true,
			message: 'Parishioners retrieved successfully',
			data: parishioners,
		};
	} catch (error) {
		console.error('Failed to get parishioners:', error);
		return { success: false, message: 'Failed to retrieve parishioners' };
	}
}

/**
 * Get a single parishioner by ID
 */
export async function getParishioner(
	id: string
): Promise<ActionResponse<ParishionerWithRelations>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const parishioner = await db.parishioner.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
				isActive: true,
			},
			include: {
				organization: true,
				sacraments: {
					orderBy: { dateReceived: 'desc' },
				},
				payments: {
					orderBy: { createdAt: 'desc' },
					take: 10, // Latest 10 payments
				},
			},
		});

		if (!parishioner) {
			return { success: false, message: 'Parishioner not found' };
		}

		return {
			success: true,
			message: 'Parishioner retrieved successfully',
			data: parishioner,
		};
	} catch (error) {
		console.error('Failed to get parishioner:', error);
		return { success: false, message: 'Failed to retrieve parishioner' };
	}
}

/**
 * Search parishioners
 */
export async function searchParishioners(
	searchTerm: string
): Promise<ActionResponse<Parishioner[]>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const parishioners = await db.parishioner.findMany({
			where: {
				organizationId: session.user.organizationId,
				isActive: true,
				OR: [
					{
						firstName: {
							contains: searchTerm,
							mode: 'insensitive',
						},
					},
					{ lastName: { contains: searchTerm, mode: 'insensitive' } },
					{ email: { contains: searchTerm, mode: 'insensitive' } },
					{ phone: { contains: searchTerm, mode: 'insensitive' } },
				],
			},
			orderBy: { lastName: 'asc' },
			take: 50,
		});

		return {
			success: true,
			message: `Found ${parishioners.length} parishioner(s)`,
			data: parishioners,
		};
	} catch (error) {
		console.error('Failed to search parishioners:', error);
		return { success: false, message: 'Failed to search parishioners' };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create a new parishioner
 */
export async function createParishioner(
	formData: unknown
): Promise<ActionResponse<Parishioner>> {
	try {
		// 1. Authentication
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// 2. Authorization
		const allowedRoles = [
			'SUPER_ADMIN',
			'PARISH_ADMIN',
			'PARISH_SECRETARY',
			'PARISH_STAFF',
			'OUTSTATION_ADMIN',
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// 3. Validation
		const parsed = createParishionerSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// 4. Feature toggle check
		const settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId: session.user.organizationId },
		});

		if (!settings?.enableParishionerManagement) {
			return {
				success: false,
				message: 'Parishioner management is not enabled',
			};
		}

		// 5. Check for duplicate email
		const existingParishioner = await db.parishioner.findFirst({
			where: {
				email: parsed.data.email,
				organizationId: session.user.organizationId,
			},
		});

		if (existingParishioner) {
			return {
				success: false,
				message: 'A parishioner with this email already exists',
			};
		}

		// 6. Create parishioner
		const parishioner = await db.parishioner.create({
			data: {
				...parsed.data,
				dateOfBirth: parsed.data.dateOfBirth
					? new Date(parsed.data.dateOfBirth)
					: null,
				organizationId: session.user.organizationId,
			},
		});

		// 7. Revalidate cache
		revalidatePath('/dashboard/parishioners');

		return {
			success: true,
			message: 'Parishioner created successfully',
			data: parishioner,
		};
	} catch (error) {
		console.error('Failed to create parishioner:', error);
		return { success: false, message: 'Failed to create parishioner' };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update an existing parishioner
 */
export async function updateParishioner(
	id: string,
	formData: unknown
): Promise<ActionResponse<Parishioner>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Authorization
		const allowedRoles = [
			'SUPER_ADMIN',
			'PARISH_ADMIN',
			'PARISH_SECRETARY',
			'PARISH_STAFF',
			'OUTSTATION_ADMIN',
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Validation
		const parsed = updateParishionerSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify ownership
		const existing = await db.parishioner.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
				isActive: true,
			},
		});

		if (!existing) {
			return { success: false, message: 'Parishioner not found' };
		}

		// Check for duplicate email (if email is being changed)
		if (parsed.data.email && parsed.data.email !== existing.email) {
			const duplicateEmail = await db.parishioner.findFirst({
				where: {
					email: parsed.data.email,
					organizationId: session.user.organizationId,
					id: { not: id },
				},
			});

			if (duplicateEmail) {
				return {
					success: false,
					message: 'A parishioner with this email already exists',
				};
			}
		}

		// Update
		const parishioner = await db.parishioner.update({
			where: { id },
			data: {
				...parsed.data,
				dateOfBirth:
					parsed.data.dateOfBirth !== undefined
						? parsed.data.dateOfBirth
							? new Date(parsed.data.dateOfBirth)
							: null
						: undefined,
			},
		});

		revalidatePath('/dashboard/parishioners');
		revalidatePath(`/dashboard/parishioners/${id}`);

		return {
			success: true,
			message: 'Parishioner updated successfully',
			data: parishioner,
		};
	} catch (error) {
		console.error('Failed to update parishioner:', error);
		return { success: false, message: 'Failed to update parishioner' };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a parishioner
 */
export async function deleteParishioner(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only admins can delete
		const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN'];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Verify ownership
		const existing = await db.parishioner.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: 'Parishioner not found' };
		}

		// Soft delete
		await db.parishioner.update({
			where: { id },
			data: {
				isActive: false,
				deletedAt: new Date(),
			},
		});

		revalidatePath('/dashboard/parishioners');

		return { success: true, message: 'Parishioner deleted successfully' };
	} catch (error) {
		console.error('Failed to delete parishioner:', error);
		return { success: false, message: 'Failed to delete parishioner' };
	}
}
