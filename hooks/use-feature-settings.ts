'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { OrganizationFeatureSettings } from '@prisma/client';
import type { FeatureName } from '@/lib/features';
import { getOrganizationFeatures } from '@/app/actions/organization.actions';

interface UseFeatureSettingsReturn {
	settings: OrganizationFeatureSettings | null;
	isLoading: boolean;
	error: string | null;
	isFeatureEnabled: (feature: FeatureName) => boolean;
	refetch: () => Promise<void>;
}

/**
 * Hook to access feature settings for the current organization
 */
export function useFeatureSettings(): UseFeatureSettingsReturn {
	const { data: session, status } = useSession();
	const [settings, setSettings] =
		useState<OrganizationFeatureSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSettings = useCallback(async () => {
		if (!session?.user?.organizationId) {
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			setError(null);
			const result = await getOrganizationFeatures();

			if (result.success && result.data) {
				setSettings(result.data);
			} else {
				setError(result.message || 'Failed to load feature settings');
			}
		} catch (err) {
			setError('An error occurred while loading feature settings');
			console.error('Feature settings fetch error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [session?.user?.organizationId]);

	useEffect(() => {
		if (status === 'loading') return;
		fetchSettings();
	}, [status, fetchSettings]);

	const isFeatureEnabled = useCallback(
		(feature: FeatureName): boolean => {
			if (!settings) return false;
			return settings[feature] as boolean;
		},
		[settings]
	);

	return {
		settings,
		isLoading,
		error,
		isFeatureEnabled,
		refetch: fetchSettings,
	};
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeature(feature: FeatureName): {
	enabled: boolean;
	isLoading: boolean;
} {
	const { isFeatureEnabled, isLoading } = useFeatureSettings();

	return {
		enabled: isFeatureEnabled(feature),
		isLoading,
	};
}

/**
 * Hook to check multiple features at once
 */
export function useFeatures(features: FeatureName[]): {
	enabledFeatures: Record<FeatureName, boolean>;
	isLoading: boolean;
	allEnabled: boolean;
	anyEnabled: boolean;
} {
	const { isFeatureEnabled, isLoading } = useFeatureSettings();

	const enabledFeatures = features.reduce(
		(acc, feature) => ({
			...acc,
			[feature]: isFeatureEnabled(feature),
		}),
		{} as Record<FeatureName, boolean>
	);

	const allEnabled = features.every((f) => enabledFeatures[f]);
	const anyEnabled = features.some((f) => enabledFeatures[f]);

	return {
		enabledFeatures,
		isLoading,
		allEnabled,
		anyEnabled,
	};
}
