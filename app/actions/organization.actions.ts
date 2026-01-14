'use server';

import { auth } from '@/auth';
import db from '@/lib/db';
import type { ActionResponse } from '@/types';
import type { OrganizationFeatureSettings } from '@prisma/client';
import type { FeatureName } from '@/lib/features';
import { featureDependencies } from '@/lib/features';

/**
 * Get organization feature settings for the current user's organization
 */
export async function getOrganizationFeatures(): Promise<
	ActionResponse<OrganizationFeatureSettings>
> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: 'Unauthorized' };
		}

		let settings = await db.organizationFeatureSettings.findUnique({
			where: { organizationId: session.user.organizationId },
		});

		// Create default settings if they don't exist
		if (!settings) {
			settings = await db.organizationFeatureSettings.create({
				data: { organizationId: session.user.organizationId },
			});
		}

		return {
			success: true,
			message: 'Feature settings retrieved',
			data: settings,
		};
	} catch (error) {
		console.error('Get organization features error:', error);
		return { success: false, message: 'Failed to fetch feature settings' };
	}
}

/**
 * Update organization feature settings (Admin only)
 */
export async function updateOrganizationFeatures(
	updates: Partial<Record<FeatureName, boolean>>
): Promise<ActionResponse<OrganizationFeatureSettings>> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only admins can update feature settings
		const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN'];
		if (!allowedRoles.includes(session.user.role)) {
			return {
				success: false,
				message:
					'You do not have permission to update feature settings',
			};
		}

		// Validate feature dependencies
		for (const [feature, enabled] of Object.entries(updates)) {
			if (enabled) {
				const dependencies =
					featureDependencies[feature as FeatureName] || [];
				for (const dep of dependencies) {
					// Check if dependency is being enabled in this update or already enabled
					const depEnabled =
						updates[dep] ??
						(await isFeatureCurrentlyEnabled(
							session.user.organizationId,
							dep
						));
					if (!depEnabled) {
						return {
							success: false,
							message: `Cannot enable ${feature} without enabling ${dep} first`,
						};
					}
				}
			}
		}

		// Ensure settings exist
		await db.organizationFeatureSettings.upsert({
			where: { organizationId: session.user.organizationId },
			create: { organizationId: session.user.organizationId },
			update: {},
		});

		// Update settings
		const settings = await db.organizationFeatureSettings.update({
			where: { organizationId: session.user.organizationId },
			data: updates,
		});

		return {
			success: true,
			message: 'Feature settings updated successfully',
			data: settings,
		};
	} catch (error) {
		console.error('Update organization features error:', error);
		return { success: false, message: 'Failed to update feature settings' };
	}
}

/**
 * Toggle a single feature (Admin only)
 */
export async function toggleFeature(
	feature: FeatureName,
	enabled: boolean
): Promise<ActionResponse<OrganizationFeatureSettings>> {
	return updateOrganizationFeatures({ [feature]: enabled });
}

/**
 * Get current organization details
 */
export async function getCurrentOrganization(): Promise<
	ActionResponse<{
		id: string;
		name: string;
		level: string;
		address: string | null;
		phone: string | null;
		email: string | null;
	}>
> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: 'Unauthorized' };
		}

		const organization = await db.organization.findUnique({
			where: { id: session.user.organizationId },
			select: {
				id: true,
				name: true,
				level: true,
				address: true,
				contactEmail: true,
				contactPhone: true,
			},
		});

		if (!organization) {
			return { success: false, message: 'Organization not found' };
		}

		return {
			success: true,
			message: 'Organization retrieved',
			data: {
				id: organization.id,
				name: organization.name,
				level: organization.level,
				address: organization.address,
				phone: organization.contactPhone,
				email: organization.contactEmail,
			},
		};
	} catch (error) {
		console.error('Get current organization error:', error);
		return { success: false, message: 'Failed to fetch organization' };
	}
}

/**
 * Update organization details (Admin only)
 */
export async function updateOrganization(data: {
	name?: string;
	address?: string;
	phone?: string;
	email?: string;
}): Promise<ActionResponse> {
	try {
		const session = await auth();
		if (!session?.user?.organizationId) {
			return { success: false, message: 'Unauthorized' };
		}

		// Only admins can update organization
		const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN'];
		if (!allowedRoles.includes(session.user.role)) {
			return {
				success: false,
				message:
					'You do not have permission to update organization details',
			};
		}

		// Map to actual database field names
		const updateData: Record<string, string | undefined> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.address !== undefined) updateData.address = data.address;
		if (data.phone !== undefined) updateData.contactPhone = data.phone;
		if (data.email !== undefined) updateData.contactEmail = data.email;

		await db.organization.update({
			where: { id: session.user.organizationId },
			data: updateData,
		});

		return {
			success: true,
			message: 'Organization updated successfully',
		};
	} catch (error) {
		console.error('Update organization error:', error);
		return { success: false, message: 'Failed to update organization' };
	}
}

// Helper function
async function isFeatureCurrentlyEnabled(
	organizationId: string,
	feature: FeatureName
): Promise<boolean> {
	const settings = await db.organizationFeatureSettings.findUnique({
		where: { organizationId },
	});
	return settings?.[feature] ?? false;
}
