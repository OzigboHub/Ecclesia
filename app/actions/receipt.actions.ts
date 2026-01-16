'use server';

import { auth } from '@/auth';
import db from '@/lib/db';
import type { ActionResponse } from '@/types';

/**
 * Get payment receipt data for PDF generation
 * This is a helper action that retrieves formatted payment data for receipt generation
 */
export async function getPaymentReceiptData(
	paymentId: string
): Promise<ActionResponse<ReceiptData>> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		const payment = await db.payment.findFirst({
			where: {
				id: paymentId,
				organizationId: session.user.organizationId,
			},
			include: {
				organization: true,
				parishioner: true,
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

		// Format receipt data
		const receiptData: ReceiptData = {
			receiptNumber: payment.receiptNumber || 'N/A',
			organizationName: payment.organization.name,
			organizationAddress: payment.organization.address || '',
			organizationPhone: payment.organization.contactPhone || '',
			paymentDate: new Date(payment.paymentDate).toLocaleDateString(
				'en-NG',
				{
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				}
			),
			payerName: payment.payerName,
			payerEmail: payment.payerEmail || '',
			payerPhone: payment.payerPhone || '',
			amount: payment.amount,
			currency: 'NGN',
			purpose: payment.purpose.replace(/_/g, ' '),
			paymentMethod: payment.paymentMethod.replace(/_/g, ' '),
			transactionRef: payment.transactionRef || '',
			status: payment.paymentStatus,
			notes: payment.notes || '',
			recordedByName: `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}`,
			recordedAt: new Date(payment.createdAt).toLocaleDateString(
				'en-NG',
				{
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				}
			),
			parishionerName: payment.parishioner
				? `${payment.parishioner.firstName} ${payment.parishioner.lastName}`
				: null,
			massIntention: payment.massIntention
				? {
						type: payment.massIntention.intentionType,
						intention: payment.massIntention.intention,
						requestedDate: payment.massIntention.mass
							? new Date(
									payment.massIntention.mass.date
							  ).toLocaleDateString('en-NG')
							: 'Not scheduled',
				  }
				: null,
			campaignName: payment.donationCampaign?.name || null,
		};

		return {
			success: true,
			message: 'Receipt data retrieved successfully',
			data: receiptData,
		};
	} catch (error) {
		console.error('Failed to get receipt data:', error);
		return { success: false, message: 'Failed to retrieve receipt data' };
	}
}

export interface ReceiptData {
	receiptNumber: string;
	organizationName: string;
	organizationAddress: string;
	organizationPhone: string;
	paymentDate: string;
	payerName: string;
	payerEmail: string;
	payerPhone: string;
	amount: number;
	currency: string;
	purpose: string;
	paymentMethod: string;
	transactionRef: string;
	status: string;
	notes: string;
	recordedByName: string;
	recordedAt: string;
	parishionerName: string | null;
	massIntention: {
		type: string;
		intention: string;
		requestedDate: string;
	} | null;
	campaignName: string | null;
}
