'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import {
	createPaymentSchema,
	updatePaymentSchema,
	paymentQuerySchema,
	type PaymentQuery,
} from '@/lib/validators/payment.schema';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';

// Type for payment with relations
type PaymentWithRelations = Prisma.PaymentGetPayload<{
	include: {
		parishioner: true;
		organization: true;
		recordedBy: true;
		massIntention: {
			include: {
				mass: true;
			};
		};
		donationCampaign: true;
	};
}>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a payment purpose is enabled for the organization
 */
async function checkFeatureEnabled(
	organizationId: string,
	purpose: string
): Promise<{ enabled: boolean; message?: string }> {
	const settings = await db.organizationFeatureSettings.findUnique({
		where: { organizationId },
	});

	if (!settings) {
		return { enabled: true }; // Default enabled if no settings
	}

	const featureMap: Record<string, boolean> = {
		OFFERING: settings.enableOfferings,
		TITHE: settings.enableTithes,
		MASS_INTENTION: settings.enableMassIntentions,
		DONATION_CAMPAIGN: settings.enableDonationCampaigns,
		CUSTOM_DONATION: settings.enableCustomDonationTypes,
	};

	if (purpose in featureMap && !featureMap[purpose]) {
		const purposeName = purpose
			.toLowerCase()
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (l) => l.toUpperCase());
		return {
			enabled: false,
			message: `${purposeName} payments are not enabled for your organization`,
		};
	}

	return { enabled: true };
}

/**
 * Generate unique receipt number
 */
async function generateReceiptNumber(organizationId: string): Promise<string> {
	const year = new Date().getFullYear();
	const prefix = `RCP-${year}`;

	// Get the last receipt number for this year
	const lastPayment = await db.payment.findFirst({
		where: {
			organizationId,
			receiptNumber: {
				startsWith: prefix,
			},
		},
		orderBy: {
			receiptNumber: 'desc',
		},
		select: {
			receiptNumber: true,
		},
	});

	let nextNumber = 1;
	if (lastPayment?.receiptNumber) {
		const lastNumber = parseInt(
			lastPayment.receiptNumber.split('-').pop() || '0'
		);
		nextNumber = lastNumber + 1;
	}

	return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
}

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all payments with filters and pagination
 */
export async function getPayments(
	query?: Partial<PaymentQuery>
): Promise<
	ActionResponse<{ payments: PaymentWithRelations[]; total: number }>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Check if financial management is enabled
		const settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId: session.user.organizationId },
		});
		if (!settings?.enableFinancialManagement) {
			return {
				success: false,
				message: 'Financial management is not enabled',
			};
		}

		// Parse and validate query
		const parsed = paymentQuerySchema.parse(query || {});
		const {
			page,
			limit,
			search,
			purpose,
			status,
			method,
			parishionerId,
			month,
			dateFrom,
			dateTo,
			sortBy,
			sortOrder,
		} = parsed;

		// Build where clause
		const where: Prisma.PaymentWhereInput = {
			organizationId: session.user.organizationId,
			...(purpose && { purpose }),
			...(status && { paymentStatus: status }),
			...(method && { paymentMethod: method }),
			...(parishionerId && { parishionerId }),
			...(month && { month }),
			...(search && {
				OR: [
					{ payerName: { contains: search, mode: 'insensitive' } },
					{
						transactionRef: {
							contains: search,
							mode: 'insensitive',
						},
					},
					{
						receiptNumber: {
							contains: search,
							mode: 'insensitive',
						},
					},
				],
			}),
			...(dateFrom &&
				dateTo && {
					paymentDate: {
						gte: dateFrom,
						lte: dateTo,
					},
				}),
		};

		// Execute queries in parallel
		const [payments, total] = await Promise.all([
			db.payment.findMany({
				where,
				include: {
					parishioner: true,
					organization: true,
					recordedBy: true,
					massIntention: {
						include: {
							mass: true,
						},
					},
					donationCampaign: true,
				},
				orderBy: { [sortBy]: sortOrder },
				skip: (page - 1) * limit,
				take: limit,
			}),
			db.payment.count({ where }),
		]);

		return {
			success: true,
			message: 'Payments retrieved successfully',
			data: {
				payments,
				total,
			},
		};
	} catch (error) {
		console.error('Failed to get payments:', error);
		return { success: false, message: 'Failed to retrieve payments' };
	}
}

/**
 * Get a single payment by ID
 */
export async function getPayment(
	id: string
): Promise<ActionResponse<PaymentWithRelations>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const payment = await db.payment.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
			include: {
				parishioner: true,
				organization: true,
				recordedBy: true,
				massIntention: {
					include: {
						mass: true,
					},
				},
				donationCampaign: true,
			},
		});

		if (!payment) {
			return { success: false, message: 'Payment not found' };
		}

		return {
			success: true,
			message: 'Payment retrieved successfully',
			data: payment,
		};
	} catch (error) {
		console.error('Failed to get payment:', error);
		return { success: false, message: 'Failed to retrieve payment' };
	}
}

/**
 * Get payment statistics for dashboard
 */
export async function getPaymentStats(): Promise<
	ActionResponse<{
		totalAmount: number;
		totalCount: number;
		byPurpose: Record<string, number>;
		byMonth: Record<number, number>;
		recentPayments: PaymentWithRelations[];
	}>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const currentYear = new Date().getFullYear();
		const yearStart = new Date(currentYear, 0, 1);

		// Get total amount and count
		const [totalStats, byPurpose, byMonth, recentPayments] =
			await Promise.all([
				db.payment.aggregate({
					where: {
						organizationId: session.user.organizationId,
						paymentStatus: 'COMPLETED',
						paymentDate: { gte: yearStart },
					},
					_sum: { amount: true },
					_count: true,
				}),
				db.payment.groupBy({
					by: ['purpose'],
					where: {
						organizationId: session.user.organizationId,
						paymentStatus: 'COMPLETED',
						paymentDate: { gte: yearStart },
					},
					_sum: { amount: true },
				}),
				db.payment.groupBy({
					by: ['month'],
					where: {
						organizationId: session.user.organizationId,
						paymentStatus: 'COMPLETED',
						purpose: 'OFFERING',
						paymentDate: { gte: yearStart },
					},
					_sum: { amount: true },
				}),
				db.payment.findMany({
					where: {
						organizationId: session.user.organizationId,
					},
					include: {
						parishioner: true,
						organization: true,
						recordedBy: true,
						massIntention: {
							include: {
								mass: true,
							},
						},
						donationCampaign: true,
					},
					orderBy: { createdAt: 'desc' },
					take: 10,
				}),
			]);

		const byPurposeMap: Record<string, number> = {};
		byPurpose.forEach((item) => {
			byPurposeMap[item.purpose] = item._sum.amount || 0;
		});

		const byMonthMap: Record<number, number> = {};
		byMonth.forEach((item) => {
			if (item.month) {
				byMonthMap[item.month] = item._sum.amount || 0;
			}
		});

		return {
			success: true,
			message: 'Payment statistics retrieved',
			data: {
				totalAmount: totalStats._sum.amount || 0,
				totalCount: totalStats._count,
				byPurpose: byPurposeMap,
				byMonth: byMonthMap,
				recentPayments,
			},
		};
	} catch (error) {
		console.error('Failed to get payment stats:', error);
		return { success: false, message: 'Failed to retrieve statistics' };
	}
}

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Record a new payment
 */
export async function createPayment(
	formData: unknown
): Promise<ActionResponse<PaymentWithRelations>> {
	try {
		// 1. Authentication
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// 2. Authorization - check role
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
		const parsed = createPaymentSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Please check your input and try again',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// 4. Feature toggle check
		const featureCheck = await checkFeatureEnabled(
			session.user.organizationId,
			parsed.data.purpose
		);
		if (!featureCheck.enabled) {
			return { success: false, message: featureCheck.message! };
		}

		// 5. Generate receipt number
		const receiptNumber = await generateReceiptNumber(
			session.user.organizationId
		);

		// 6. Create payment
		const payment = await db.payment.create({
			data: {
				...parsed.data,
				currency: 'NGN',
				paymentStatus: 'COMPLETED', // Manual payments are immediately completed
				receiptNumber,
				organizationId: session.user.organizationId,
				recordedById: session.user.id,
			},
			include: {
				parishioner: true,
				organization: true,
				recordedBy: true,
				massIntention: {
					include: {
						mass: true,
					},
				},
				donationCampaign: true,
			},
		});

		// 7. Revalidate cache
		revalidatePath('/dashboard/payments');
		if (parsed.data.parishionerId) {
			revalidatePath(
				`/dashboard/parishioners/${parsed.data.parishionerId}`
			);
		}

		return {
			success: true,
			message: `Payment recorded successfully. Receipt: ${receiptNumber}`,
			data: payment,
		};
	} catch (error) {
		console.error('Failed to create payment:', error);
		return { success: false, message: 'Failed to record payment' };
	}
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update a payment (only pending payments can be edited)
 */
export async function updatePayment(
	id: string,
	formData: unknown
): Promise<ActionResponse<PaymentWithRelations>> {
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
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Validation
		const parsed = updatePaymentSchema.safeParse(formData);
		if (!parsed.success) {
			return {
				success: false,
				message: 'Validation failed',
				errors: parsed.error.flatten().fieldErrors,
			};
		}

		// Check if payment exists and belongs to organization
		const existing = await db.payment.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: 'Payment not found' };
		}

		// Only pending payments can be edited
		if (existing.paymentStatus !== 'PENDING') {
			return {
				success: false,
				message: 'Only pending payments can be edited',
			};
		}

		// Update payment
		const payment = await db.payment.update({
			where: { id },
			data: parsed.data,
			include: {
				parishioner: true,
				organization: true,
				recordedBy: true,
				massIntention: {
					include: {
						mass: true,
					},
				},
				donationCampaign: true,
			},
		});

		revalidatePath('/dashboard/payments');
		revalidatePath(`/dashboard/payments/${id}`);

		return {
			success: true,
			message: 'Payment updated successfully',
			data: payment,
		};
	} catch (error) {
		console.error('Failed to update payment:', error);
		return { success: false, message: 'Failed to update payment' };
	}
}

/**
 * Mark a payment as completed
 */
export async function completePayment(
	id: string
): Promise<ActionResponse<PaymentWithRelations>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const allowedRoles = [
			'SUPER_ADMIN',
			'PARISH_ADMIN',
			'PARISH_SECRETARY',
		];
		if (!allowedRoles.includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		const existing = await db.payment.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: 'Payment not found' };
		}

		if (existing.paymentStatus === 'COMPLETED') {
			return { success: false, message: 'Payment already completed' };
		}

		const payment = await db.payment.update({
			where: { id },
			data: { paymentStatus: 'COMPLETED' },
			include: {
				parishioner: true,
				organization: true,
				recordedBy: true,
				massIntention: {
					include: {
						mass: true,
					},
				},
				donationCampaign: true,
			},
		});

		revalidatePath('/dashboard/payments');

		return {
			success: true,
			message: 'Payment marked as completed',
			data: payment,
		};
	} catch (error) {
		console.error('Failed to complete payment:', error);
		return { success: false, message: 'Failed to complete payment' };
	}
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a payment (only admins, only pending payments)
 */
export async function deletePayment(id: string): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only admins can delete
		if (!['SUPER_ADMIN', 'PARISH_ADMIN'].includes(session.user.role)) {
			return { success: false, message: 'Permission denied' };
		}

		// Verify ownership
		const existing = await db.payment.findFirst({
			where: {
				id,
				organizationId: session.user.organizationId,
			},
		});

		if (!existing) {
			return { success: false, message: 'Payment not found' };
		}

		// Only pending or failed payments can be deleted
		if (!['PENDING', 'FAILED'].includes(existing.paymentStatus)) {
			return {
				success: false,
				message: 'Only pending or failed payments can be deleted',
			};
		}

		await db.payment.delete({ where: { id } });

		revalidatePath('/dashboard/payments');

		return { success: true, message: 'Payment deleted successfully' };
	} catch (error) {
		console.error('Failed to delete payment:', error);
		return { success: false, message: 'Failed to delete payment' };
	}
}
