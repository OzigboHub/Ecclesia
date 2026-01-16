'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
	createMassIntentionSchema,
	updateMassIntentionSchema,
} from '@/lib/validators/mass-intention.schema';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import { isFeatureEnabled } from '@/lib/features';

type MassIntentionWithRelations = Prisma.MassIntentionGetPayload<{
	include: {
		parishioner: true;
		organization: true;
	};
}>;

// ============================================
// READ OPERATIONS
// ============================================

export async function getMassIntentions(): Promise<
	ActionResponse<MassIntentionWithRelations[]>
> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Check feature toggle
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableMassIntentions'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Mass intentions feature is not enabled',
			};
		}

		const massIntentions = await db.massIntention.findMany({
			where: { organizationId: session.user.organizationId },
			include: {
				parishioner: true,
				organization: true,
			},
			orderBy: { massDate: 'asc' },
		});

		return {
			success: true,
			message: 'Mass intentions retrieved successfully',
			data: massIntentions,
		};
	} catch (error) {
		console.error('Failed to get mass intentions:', error);
		return {
			success: false,
			message: 'Failed to retrieve mass intentions',
		};
	}
}

export async function getMassIntention(
	id: string
): Promise<ActionResponse<MassIntentionWithRelations>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		const massIntention = await db.massIntention.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
			include: {
				parishioner: true,
				organization: true,
			},
		});

		if (!massIntention) {
			return { success: false, message: 'Mass intention not found' };
		}

		return {
			success: true,
			message: 'Mass intention retrieved successfully',
			data: massIntention,
		};
	} catch (error) {
		console.error('Failed to get mass intention:', error);
		return { success: false, message: 'Failed to retrieve mass intention' };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createMassIntention(
	formData: unknown
): Promise<ActionResponse<MassIntentionWithRelations>> {
	try {
		// Authentication
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Feature toggle check
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableMassIntentions'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Mass intentions feature is not enabled',
			};
		}

		// Validation with Zod
		const parsed = createMassIntentionSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		const {
			intention,
			intentionType,
			massDate,
			parishionerId,
			stipend,
			requestedBy,
			contactEmail,
			contactPhone,
			notes,
		} = parsed.data;

		// Use transaction to create both intention and optional payment
		const massIntention = await db.$transaction(async (tx) => {
			// 1. Create mass intention
			const createdIntention = await tx.massIntention.create({
				data: {
					intention,
					intentionType,
					massDate: new Date(massDate),
					organizationId: session.user.organizationId,
					requestedBy,
					contactEmail: contactEmail || null,
					contactPhone: contactPhone || null,
					notes: notes || null,
					...(parishionerId && { parishionerId }),
				},
				include: {
					parishioner: true,
					organization: true,
				},
			});

			// 2. Auto-create payment if stipend provided (MAS-004: Payment Integration)
			if (stipend && stipend > 0) {
				// Generate receipt number
				const year = new Date().getFullYear();
				const prefix = `RCP-${year}`;
				const lastPayment = await tx.payment.findFirst({
					where: {
						organizationId: session.user.organizationId,
						receiptNumber: { startsWith: prefix },
					},
					orderBy: { receiptNumber: 'desc' },
					select: { receiptNumber: true },
				});

				let nextNumber = 1;
				if (lastPayment?.receiptNumber) {
					const lastNum = parseInt(
						lastPayment.receiptNumber.split('-').pop() || '0'
					);
					nextNumber = lastNum + 1;
				}
				const receiptNumber = `${prefix}-${nextNumber
					.toString()
					.padStart(6, '0')}`;

				// Create payment record linked to intention
				await tx.payment.create({
					data: {
						amount: stipend,
						currency: 'NGN',
						purpose: 'MASS_INTENTION',
						paymentMethod: 'CASH', // Default to cash for mass stipends
						paymentStatus: 'COMPLETED',
						receiptNumber,
						payerName: requestedBy,
						...(contactEmail && { payerEmail: contactEmail }),
						massIntentionId: createdIntention.id,
						organizationId: session.user.organizationId,
						recordedById: session.user.id,
						notes: `Stipend for mass intention: ${intention.substring(
							0,
							50
						)}...`,
					},
				});
			}

			return createdIntention;
		});

		revalidatePath('/dashboard/mass-intentions');
		revalidatePath('/dashboard/payments');

		return {
			success: true,
			message:
				'Mass intention scheduled successfully' +
				(stipend && stipend > 0
					? ` and payment recorded (₦${stipend.toLocaleString(
							'en-NG'
					  )})`
					: ''),
			data: massIntention,
		};
	} catch (error) {
		console.error('Failed to create mass intention:', error);
		return { success: false, message: 'Failed to schedule mass intention' };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateMassIntention(
	id: string,
	formData: unknown
): Promise<ActionResponse<MassIntentionWithRelations>> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Authorization - staff roles can update mass intentions
		const allowedRoles = [
			'SUPER_ADMIN',
			'PARISH_ADMIN',
			'PARISH_SECRETARY',
			'PARISH_STAFF',
		];
		if (!allowedRoles.includes(session.user.role)) {
			return {
				success: false,
				message: 'You do not have permission to update mass intentions',
			};
		}

		// Validation
		const parsed = updateMassIntentionSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Verify ownership
		const existing = await db.massIntention.findFirst({
			where: { id, organizationId: session.user.organizationId },
		});
		if (!existing) {
			return { success: false, message: 'Mass intention not found' };
		}

		// Build update data
		const updateData: Prisma.MassIntentionUpdateInput = {};

		if (parsed.data.intention !== undefined)
			updateData.intention = parsed.data.intention;
		if (parsed.data.intentionType !== undefined)
			updateData.intentionType = parsed.data.intentionType;
		if (parsed.data.requestedBy !== undefined)
			updateData.requestedBy = parsed.data.requestedBy;
		if (parsed.data.contactEmail !== undefined)
			updateData.contactEmail = parsed.data.contactEmail;
		if (parsed.data.contactPhone !== undefined)
			updateData.contactPhone = parsed.data.contactPhone;
		if (parsed.data.stipend !== undefined)
			updateData.stipend = parsed.data.stipend;
		if (parsed.data.notes !== undefined)
			updateData.notes = parsed.data.notes;

		// Handle date field
		if (parsed.data.massDate) {
			updateData.massDate = new Date(parsed.data.massDate);
		}

		// Handle parishioner relation
		if (parsed.data.parishionerId !== undefined) {
			if (parsed.data.parishionerId) {
				updateData.parishioner = {
					connect: { id: parsed.data.parishionerId },
				};
			} else {
				updateData.parishioner = { disconnect: true };
			}
		}

		// Update
		const massIntention = await db.massIntention.update({
			where: { id },
			data: updateData,
			include: {
				parishioner: true,
				organization: true,
			},
		});

		revalidatePath('/dashboard/mass-intentions');
		revalidatePath(`/dashboard/mass-intentions/${id}`);

		return {
			success: true,
			message: 'Mass intention updated successfully',
			data: massIntention,
		};
	} catch (error) {
		console.error('Failed to update mass intention:', error);
		return { success: false, message: 'Failed to update mass intention' };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

export async function deleteMassIntention(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only admins can delete
		if (!['SUPER_ADMIN', 'PARISH_ADMIN'].includes(session.user.role)) {
			return {
				success: false,
				message: 'You do not have permission to delete mass intentions',
			};
		}

		// Verify ownership
		const existing = await db.massIntention.findFirst({
			where: { id, organizationId: session.user.organizationId },
		});
		if (!existing) {
			return { success: false, message: 'Mass intention not found' };
		}

		await db.massIntention.delete({ where: { id } });

		revalidatePath('/dashboard/mass-intentions');

		return {
			success: true,
			message: 'Mass intention deleted successfully',
		};
	} catch (error) {
		console.error('Failed to delete mass intention:', error);
		return { success: false, message: 'Failed to delete mass intention' };
	}
}
