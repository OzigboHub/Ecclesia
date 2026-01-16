'use server';

import { auth } from '@/auth';
import db from '@/lib/db';
import type { ActionResponse } from '@/types';

export interface SystemMetrics {
	totalOrganizations: number;
	totalParishes: number;
	totalOutstations: number;
	totalUsers: number;
	activeUsers: number;
	totalParishioners: number;
	totalPayments: number;
	totalPaymentAmount: number;
	totalMassIntentions: number;
	totalAppointments: number;
	averageUsersPerOrg: number;
}

/**
 * Get system-wide metrics (SUPER_ADMIN only)
 */
export async function getSystemMetrics(): Promise<
	ActionResponse<SystemMetrics>
> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only super admins can view system metrics
		if (session.user.role !== 'SUPER_ADMIN') {
			return {
				success: false,
				message: 'Only super admins can view system metrics',
			};
		}

		// Fetch all metrics in parallel
		const [
			totalUsers,
			activeUsers,
			totalParishes,
			totalOutstations,
			totalParishioners,
			totalPayments,
			totalMassIntentions,
			totalAppointments,
		] = await Promise.all([
			// Users
			db.user.count(),
			db.user.count({ where: { isActive: true } }),
			// Organizations
			db.organization.count({ where: { level: 'PARISH' } }),
			db.organization.count({ where: { level: 'OUTSTATION' } }),
			// Parishioners
			db.parishioner.count(),
			// Payments
			db.payment.count(),
			// Mass Intentions
			db.massIntention.count(),
			// Appointments
			db.appointment.count(),
		]);

		// Calculate total payment amount
		const paymentAgg = await db.payment.aggregate({
			_sum: { amount: true },
		});

		const totalPaymentAmount = paymentAgg._sum.amount ?? 0;
		const totalOrganizations = totalParishes + totalOutstations;
		const averageUsersPerOrg =
			totalOrganizations > 0
				? Math.round(totalUsers / totalOrganizations)
				: 0;

		const metrics: SystemMetrics = {
			totalOrganizations,
			totalParishes,
			totalOutstations,
			totalUsers,
			activeUsers,
			totalParishioners,
			totalPayments,
			totalPaymentAmount,
			totalMassIntentions,
			totalAppointments,
			averageUsersPerOrg,
		};

		return {
			success: true,
			message: 'System metrics retrieved',
			data: metrics,
		};
	} catch (error) {
		console.error('Failed to get system metrics:', error);
		return { success: false, message: 'Failed to retrieve system metrics' };
	}
}
