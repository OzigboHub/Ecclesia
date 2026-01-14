import db from '@/lib/db';
import type { OrganizationFeatureSettings } from '@prisma/client';

/**
 * Feature names that can be toggled
 */
export type FeatureName = keyof Omit<
	OrganizationFeatureSettings,
	'id' | 'organizationId' | 'createdAt' | 'updatedAt'
>;

/**
 * Feature categories for grouping in UI
 */
export const featureCategories = {
	core: {
		label: 'Core Features',
		description: 'Essential parish management features',
		features: [
			'enableParishionerManagement',
			'enableSacramentalRecords',
			'enableFinancialManagement',
		] as FeatureName[],
	},
	payments: {
		label: 'Payment Features',
		description: 'Financial transaction management',
		features: [
			'enableOfferings',
			'enableTithes',
			'enableDonationCampaigns',
			'enableCustomDonationTypes',
			'enableMonthlyTracking',
		] as FeatureName[],
	},
	spiritual: {
		label: 'Spiritual Features',
		description: 'Mass intentions and appointments',
		features: [
			'enableMassIntentions',
			'enableAppointments',
			'enableConfessionBooking',
		] as FeatureName[],
	},
	communication: {
		label: 'Communication Features',
		description: 'Notifications and streaming',
		features: [
			'enableLiveStreaming',
			'enableAnnouncements',
			'enableSMSNotifications',
			'enableEmailNotifications',
		] as FeatureName[],
	},
	organization: {
		label: 'Organization Features',
		description: 'Groups and events management',
		features: [
			'enablePiousOrganizations',
			'enableEventManagement',
		] as FeatureName[],
	},
	advanced: {
		label: 'Advanced Features',
		description: 'Premium and advanced capabilities',
		features: [
			'enableOnlinePayments',
			'enableRecurringDonations',
			'enableMobileApp',
			'enablePublicWebsite',
		] as FeatureName[],
	},
} as const;

/**
 * Feature display names for UI
 */
export const featureLabels: Record<FeatureName, string> = {
	enableParishionerManagement: 'Parishioner Management',
	enableSacramentalRecords: 'Sacramental Records',
	enableFinancialManagement: 'Financial Management',
	enableOfferings: 'Offerings',
	enableTithes: 'Tithes',
	enableDonationCampaigns: 'Donation Campaigns',
	enableCustomDonationTypes: 'Custom Donation Types',
	enableMonthlyTracking: 'Monthly Tracking',
	enableMassIntentions: 'Mass Intentions',
	enableAppointments: 'Appointments',
	enableConfessionBooking: 'Confession Booking',
	enableLiveStreaming: 'Live Streaming',
	enableAnnouncements: 'Announcements',
	enableSMSNotifications: 'SMS Notifications',
	enableEmailNotifications: 'Email Notifications',
	enablePiousOrganizations: 'Pious Organizations',
	enableEventManagement: 'Event Management',
	enableOnlinePayments: 'Online Payments',
	enableRecurringDonations: 'Recurring Donations',
	enableMobileApp: 'Mobile App',
	enablePublicWebsite: 'Public Website',
};

/**
 * Feature descriptions for UI
 */
export const featureDescriptions: Record<FeatureName, string> = {
	enableParishionerManagement: 'Manage parishioner profiles and records',
	enableSacramentalRecords: 'Track baptisms, confirmations, marriages, etc.',
	enableFinancialManagement: 'Record and track all financial transactions',
	enableOfferings: 'Accept and track weekly offerings',
	enableTithes: 'Track member tithe payments',
	enableDonationCampaigns: 'Create and manage fundraising campaigns',
	enableCustomDonationTypes: 'Define custom donation categories',
	enableMonthlyTracking: 'Track payments by month for reporting',
	enableMassIntentions: 'Accept mass intention requests',
	enableAppointments: 'Schedule appointments with clergy',
	enableConfessionBooking: 'Allow confession time booking',
	enableLiveStreaming: 'Stream masses and events live',
	enableAnnouncements: 'Post announcements for parishioners',
	enableSMSNotifications: 'Send SMS notifications to members',
	enableEmailNotifications: 'Send email notifications to members',
	enablePiousOrganizations: 'Manage parish groups and societies',
	enableEventManagement: 'Create and manage parish events',
	enableOnlinePayments: 'Accept payments via payment gateway',
	enableRecurringDonations: 'Set up recurring donation schedules',
	enableMobileApp: 'Enable mobile app access for members',
	enablePublicWebsite: 'Show a public website for the parish',
};

/**
 * Default feature values (matching schema defaults)
 */
const defaultFeatureValues: Record<FeatureName, boolean> = {
	enableParishionerManagement: true,
	enableSacramentalRecords: true,
	enableFinancialManagement: true,
	enableOfferings: true,
	enableTithes: true,
	enableDonationCampaigns: true,
	enableCustomDonationTypes: true,
	enableMonthlyTracking: true,
	enableMassIntentions: true,
	enableAppointments: true,
	enableConfessionBooking: true,
	enableLiveStreaming: false,
	enableAnnouncements: true,
	enableSMSNotifications: false,
	enableEmailNotifications: true,
	enablePiousOrganizations: true,
	enableEventManagement: true,
	enableOnlinePayments: false,
	enableRecurringDonations: false,
	enableMobileApp: false,
	enablePublicWebsite: true,
};

/**
 * Feature dependencies - some features require others to be enabled
 */
export const featureDependencies: Partial<Record<FeatureName, FeatureName[]>> =
	{
		enableMassIntentions: ['enableFinancialManagement'],
		enableOfferings: ['enableFinancialManagement'],
		enableTithes: ['enableFinancialManagement'],
		enableDonationCampaigns: ['enableFinancialManagement'],
		enableCustomDonationTypes: ['enableFinancialManagement'],
		enableMonthlyTracking: ['enableFinancialManagement'],
		enableOnlinePayments: ['enableFinancialManagement'],
		enableRecurringDonations: [
			'enableFinancialManagement',
			'enableOnlinePayments',
		],
		enableConfessionBooking: ['enableAppointments'],
	};

/**
 * Get feature settings for an organization
 */
export async function getFeatureSettings(
	organizationId: string
): Promise<OrganizationFeatureSettings | null> {
	return db.organizationFeatureSettings.findUnique({
		where: { organizationId },
	});
}

/**
 * Get feature settings or create with defaults if not exists
 */
export async function getOrCreateFeatureSettings(
	organizationId: string
): Promise<OrganizationFeatureSettings> {
	const existing = await db.organizationFeatureSettings.findUnique({
		where: { organizationId },
	});

	if (existing) return existing;

	return db.organizationFeatureSettings.create({
		data: { organizationId },
	});
}

/**
 * Check if a specific feature is enabled for an organization
 */
export async function isFeatureEnabled(
	organizationId: string,
	feature: FeatureName
): Promise<boolean> {
	const settings = await getFeatureSettings(organizationId);

	if (!settings) {
		return defaultFeatureValues[feature];
	}

	return settings[feature];
}

/**
 * Check if multiple features are enabled
 */
export async function areFeaturesEnabled(
	organizationId: string,
	features: FeatureName[]
): Promise<Record<FeatureName, boolean>> {
	const settings = await getFeatureSettings(organizationId);

	const result = {} as Record<FeatureName, boolean>;
	for (const feature of features) {
		result[feature] = settings
			? settings[feature]
			: defaultFeatureValues[feature];
	}

	return result;
}

/**
 * Check if a feature can be enabled (all dependencies met)
 */
export async function canEnableFeature(
	organizationId: string,
	feature: FeatureName
): Promise<{ allowed: boolean; missingDependencies: FeatureName[] }> {
	const dependencies = featureDependencies[feature] || [];

	if (dependencies.length === 0) {
		return { allowed: true, missingDependencies: [] };
	}

	const settings = await getFeatureSettings(organizationId);
	const missingDependencies = dependencies.filter(
		(dep) => !(settings?.[dep] ?? defaultFeatureValues[dep])
	);

	return {
		allowed: missingDependencies.length === 0,
		missingDependencies,
	};
}

/**
 * Update feature settings for an organization
 */
export async function updateFeatureSettings(
	organizationId: string,
	updates: Partial<Record<FeatureName, boolean>>
): Promise<OrganizationFeatureSettings> {
	// Ensure settings exist
	await getOrCreateFeatureSettings(organizationId);

	return db.organizationFeatureSettings.update({
		where: { organizationId },
		data: updates,
	});
}

/**
 * Get the default value for a feature
 */
export function getDefaultFeatureValue(feature: FeatureName): boolean {
	return defaultFeatureValues[feature];
}

/**
 * Get all feature names
 */
export function getAllFeatureNames(): FeatureName[] {
	return Object.keys(defaultFeatureValues) as FeatureName[];
}
