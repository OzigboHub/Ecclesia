import db from '@/lib/db';
import type { OrganizationFeatureSettings } from '@prisma/client';
import type { FeatureName } from './features';

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
	// Import default values from the client-safe features file
	const { getDefaultFeatureValue } = await import('./features');

	const settings = await getFeatureSettings(organizationId);

	if (!settings) {
		return getDefaultFeatureValue(feature);
	}

	return settings[feature] as boolean;
}

/**
 * Check if multiple features are enabled
 */
export async function areFeaturesEnabled(
	organizationId: string,
	features: FeatureName[]
): Promise<Record<FeatureName, boolean>> {
	const { getDefaultFeatureValue } = await import('./features');
	const settings = await getFeatureSettings(organizationId);

	const result = {} as Record<FeatureName, boolean>;
	for (const feature of features) {
		result[feature] = settings
			? (settings[feature] as boolean)
			: getDefaultFeatureValue(feature);
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
	const { featureDependencies, getDefaultFeatureValue } = await import('./features');
	const dependencies = featureDependencies[feature] || [];

	if (dependencies.length === 0) {
		return { allowed: true, missingDependencies: [] };
	}

	const settings = await getFeatureSettings(organizationId);
	const missingDependencies = dependencies.filter(
		(dep) => !(settings?.[dep] ?? getDefaultFeatureValue(dep))
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
