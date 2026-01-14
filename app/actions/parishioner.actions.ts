'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
	createParishionerSchema,
	updateParishionerSchema,
	csvParishionerSchema,
	type CsvParishionerInput,
	type CsvImportResult,
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

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Bulk delete parishioners
 */
export async function bulkDeleteParishioners(
	ids: string[]
): Promise<ActionResponse> {
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

		if (!ids || ids.length === 0) {
			return { success: false, message: 'No parishioners selected' };
		}

		// Verify all parishioners belong to user's organization
		const existing = await db.parishioner.findMany({
			where: {
				id: { in: ids },
				organizationId: session.user.organizationId,
			},
		});

		if (existing.length !== ids.length) {
			return {
				success: false,
				message: 'Some parishioners not found or access denied',
			};
		}

		// Bulk soft delete
		await db.parishioner.updateMany({
			where: {
				id: { in: ids },
			},
			data: {
				isActive: false,
				deletedAt: new Date(),
			},
		});

		revalidatePath('/dashboard/parishioners');

		return {
			success: true,
			message: `Successfully deleted ${ids.length} parishioner(s)`,
		};
	} catch (error) {
		console.error('Failed to bulk delete parishioners:', error);
		return { success: false, message: 'Failed to delete parishioners' };
	}
}

/**
 * Bulk export parishioners to CSV
 */
export async function exportParishioners(
	ids?: string[]
): Promise<ActionResponse<string>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Get parishioners (all or selected)
		const where: Prisma.ParishionerWhereInput = {
			organizationId: session.user.organizationId,
			isActive: true,
			...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
		};

		const parishioners = await db.parishioner.findMany({
			where,
			orderBy: { lastName: 'asc' },
		});

		if (parishioners.length === 0) {
			return { success: false, message: 'No parishioners to export' };
		}

		// Generate CSV
		const headers = [
			'First Name',
			'Last Name',
			'Email',
			'Phone',
			'Gender',
			'Marital Status',
			'Date of Birth',
			'Address',
			'Occupation',
			'Created At',
		];

		const rows = parishioners.map((p) => [
			p.firstName,
			p.lastName,
			p.email || '',
			p.phone || '',
			p.gender || '',
			p.maritalStatus || '',
			p.dateOfBirth
				? new Date(p.dateOfBirth).toISOString().split('T')[0]
				: '',
			p.address || '',
			p.occupation || '',
			new Date(p.createdAt).toISOString(),
		]);

		const csv = [
			headers.join(','),
			...rows.map((row) =>
				row
					.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`)
					.join(',')
			),
		].join('\n');

		return {
			success: true,
			message: `Exported ${parishioners.length} parishioner(s)`,
			data: csv,
		};
	} catch (error) {
		console.error('Failed to export parishioners:', error);
		return { success: false, message: 'Failed to export parishioners' };
	}
}

// ============================================
// CSV IMPORT
// ============================================

/**
 * Import parishioners from CSV data
 */
export async function importParishionersFromCSV(
	csvData: CsvParishionerInput[]
): Promise<ActionResponse<CsvImportResult>> {
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

		// Feature toggle check
		const settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId: session.user.organizationId },
		});

		if (!settings?.enableParishionerManagement) {
			return {
				success: false,
				message: 'Parishioner management is not enabled',
			};
		}

		const result: CsvImportResult = {
			total: csvData.length,
			successful: 0,
			failed: 0,
			errors: [],
		};

		// Process each row
		for (let i = 0; i < csvData.length; i++) {
			try {
				const row = csvData[i];

				// Validate row
				const parsed = csvParishionerSchema.safeParse(row);
				if (!parsed.success) {
					result.failed++;
					result.errors.push({
						row: i + 2, // +2 because row 1 is header, array is 0-indexed
						email: row.email,
						error: parsed.error.issues[0].message,
					});
					continue;
				}

				// Check for duplicate email
				if (parsed.data.email) {
					const existing = await db.parishioner.findFirst({
						where: {
							email: parsed.data.email,
							organizationId: session.user.organizationId,
						},
					});

					if (existing) {
						result.failed++;
						result.errors.push({
							row: i + 2,
							email: parsed.data.email,
							error: 'Email already exists',
						});
						continue;
					}
				}

				// Create parishioner
				await db.parishioner.create({
					data: {
						...parsed.data,
						dateOfBirth: parsed.data.dateOfBirth
							? new Date(parsed.data.dateOfBirth)
							: null,
						organizationId: session.user.organizationId,
					},
				});

				result.successful++;
			} catch (error) {
				result.failed++;
				result.errors.push({
					row: i + 2,
					email: csvData[i]?.email,
					error:
						error instanceof Error
							? error.message
							: 'Unknown error',
				});
			}
		}

		revalidatePath('/dashboard/parishioners');

		return {
			success: true,
			message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
			data: result,
		};
	} catch (error) {
		console.error('Failed to import parishioners:', error);
		return { success: false, message: 'Failed to import parishioners' };
	}
}

// ============================================
// PHOTO UPLOAD
// ============================================

/**
 * Update parishioner photo
 */
export async function updateParishionerPhoto(
	id: string,
	photoUrl: string
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

		// Update photo
		const parishioner = await db.parishioner.update({
			where: { id },
			data: { photoUrl },
		});

		revalidatePath('/dashboard/parishioners');
		revalidatePath(`/dashboard/parishioners/${id}`);

		return {
			success: true,
			message: 'Photo updated successfully',
			data: parishioner,
		};
	} catch (error) {
		console.error('Failed to update photo:', error);
		return { success: false, message: 'Failed to update photo' };
	}
}
