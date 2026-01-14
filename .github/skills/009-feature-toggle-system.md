# Skill: Feature Toggle System

## Metadata

-   **ID**: `ecclesia.features.toggle_system`
-   **Version**: 1.0.0
-   **Category**: Architecture
-   **Priority**: Critical

## Purpose

Control feature availability per organization using the `OrganizationFeatureSettings` model. Features must be gated BOTH server-side (in Server Actions) and client-side (in UI).

## When to Use

-   Before implementing any feature logic
-   Hiding/showing UI elements
-   Protecting API endpoints
-   Deciding which menu items to display

## Constraints

-   **Check feature toggles server-side** — never rely only on UI hiding
-   **Check feature toggles client-side** — don't show disabled features in UI
-   **Use `organizationId` from session** to fetch settings
-   **Cache feature settings** where appropriate
-   **Handle missing settings** with sensible defaults

## Feature Settings Schema

```prisma
model OrganizationFeatureSettings {
  id                        String       @id @default(uuid())
  organizationId            String       @unique
  organization              Organization @relation(...)

  // Core Features (default: true)
  enableParishionerManagement Boolean    @default(true)
  enableSacramentalRecords    Boolean    @default(true)
  enableFinancialManagement   Boolean    @default(true)

  // Payment Features (default: true)
  enableOfferings             Boolean    @default(true)
  enableTithes                Boolean    @default(true)
  enableDonationCampaigns     Boolean    @default(true)
  enableCustomDonationTypes   Boolean    @default(true)
  enableMonthlyTracking       Boolean    @default(true)

  // Spiritual Features (default: true)
  enableMassIntentions        Boolean    @default(true)
  enableAppointments          Boolean    @default(true)
  enableConfessionBooking     Boolean    @default(true)

  // Communication Features (mixed defaults)
  enableLiveStreaming         Boolean    @default(false)
  enableAnnouncements         Boolean    @default(true)
  enableSMSNotifications      Boolean    @default(false)
  enableEmailNotifications    Boolean    @default(true)

  // Organization Features (default: true)
  enablePiousOrganizations    Boolean    @default(true)
  enableEventManagement       Boolean    @default(true)

  // Advanced Features (default: false)
  enableOnlinePayments        Boolean    @default(false)
  enableRecurringDonations    Boolean    @default(false)
  enableMobileApp             Boolean    @default(false)
  enablePublicWebsite         Boolean    @default(true)
}
```

## Server-Side Feature Check

```tsx
// app/actions/mass-intention.actions.ts
'use server';

import { auth } from '@/auth';
import db from '@/lib/db';

export async function createMassIntention(data: unknown) {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	// ✅ Check feature toggle BEFORE any business logic
	const settings = await db.organizationFeatureSettings.findUnique({
		where: { organizationId: session.user.organizationId },
	});

	if (!settings?.enableMassIntentions) {
		return {
			success: false,
			message:
				'Mass intentions feature is not enabled for your organization',
		};
	}

	// Proceed with validation and creation...
	// ...
}
```

## Helper Function for Feature Checks

```tsx
// lib/features.ts
import db from '@/lib/db';
import type { OrganizationFeatureSettings } from '@prisma/client';

export type FeatureName = keyof Omit<
	OrganizationFeatureSettings,
	'id' | 'organizationId' | 'createdAt' | 'updatedAt'
>;

export async function getFeatureSettings(
	organizationId: string
): Promise<OrganizationFeatureSettings | null> {
	return db.organizationFeatureSettings.findUnique({
		where: { organizationId },
	});
}

export async function isFeatureEnabled(
	organizationId: string,
	feature: FeatureName
): Promise<boolean> {
	const settings = await getFeatureSettings(organizationId);

	// If no settings exist, use schema defaults
	if (!settings) {
		return getDefaultFeatureValue(feature);
	}

	return settings[feature];
}

// Default values matching schema
function getDefaultFeatureValue(feature: FeatureName): boolean {
	const defaultFalse: FeatureName[] = [
		'enableLiveStreaming',
		'enableSMSNotifications',
		'enableOnlinePayments',
		'enableRecurringDonations',
		'enableMobileApp',
	];
	return !defaultFalse.includes(feature);
}
```

## Usage in Server Actions

```tsx
// app/actions/payment.actions.ts
import { auth } from '@/auth';
import { isFeatureEnabled } from '@/lib/features';

export async function createPayment(data: unknown) {
	const session = await auth();
	if (!session) {
		return { success: false, message: 'Unauthorized' };
	}

	const { purpose } = data as { purpose: string };

	// Check feature based on payment purpose
	if (purpose === 'OFFERING') {
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableOfferings'
		);
		if (!enabled) {
			return { success: false, message: 'Offerings feature is disabled' };
		}
	}

	if (purpose === 'TITHE') {
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableTithes'
		);
		if (!enabled) {
			return { success: false, message: 'Tithes feature is disabled' };
		}
	}

	if (purpose === 'DONATION_CAMPAIGN') {
		const enabled = await isFeatureEnabled(
			session.user.organizationId,
			'enableDonationCampaigns'
		);
		if (!enabled) {
			return {
				success: false,
				message: 'Donation campaigns feature is disabled',
			};
		}
	}

	// ... proceed with payment creation
}
```

## Client-Side Feature Check (UI)

```tsx
// components/layout/sidebar.tsx
'use client';

import { useFeatureSettings } from '@/hooks/use-feature-settings';

const allNavigation = [
	{
		name: 'Dashboard',
		href: '/dashboard',
		icon: LayoutDashboard,
		feature: null,
	},
	{
		name: 'Parishioners',
		href: '/dashboard/parishioners',
		icon: Users,
		feature: 'enableParishionerManagement',
	},
	{
		name: 'Payments',
		href: '/dashboard/payments',
		icon: DollarSign,
		feature: 'enableFinancialManagement',
	},
	{
		name: 'Mass Intentions',
		href: '/dashboard/mass-intentions',
		icon: Church,
		feature: 'enableMassIntentions',
	},
	{
		name: 'Appointments',
		href: '/dashboard/appointments',
		icon: Calendar,
		feature: 'enableAppointments',
	},
	{
		name: 'Organizations',
		href: '/dashboard/organizations',
		icon: UsersRound,
		feature: 'enablePiousOrganizations',
	},
	{
		name: 'Live Streams',
		href: '/dashboard/live-streams',
		icon: Video,
		feature: 'enableLiveStreaming',
	},
	{
		name: 'Events',
		href: '/dashboard/events',
		icon: CalendarDays,
		feature: 'enableEventManagement',
	},
] as const;

export function Sidebar() {
	const { settings, isLoading } = useFeatureSettings();

	// Filter navigation based on enabled features
	const navigation = allNavigation.filter((item) => {
		if (item.feature === null) return true; // Always show (e.g., Dashboard)
		if (isLoading || !settings) return false; // Hide while loading
		return settings[item.feature];
	});

	return (
		<nav>
			{navigation.map((item) => (
				<Link
					key={item.name}
					href={item.href}
				>
					<item.icon />
					{item.name}
				</Link>
			))}
		</nav>
	);
}
```

## Feature Settings Hook

```tsx
// hooks/use-feature-settings.ts
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { OrganizationFeatureSettings } from '@prisma/client';
import { getOrganizationFeatures } from '@/app/actions/organization.actions';

export function useFeatureSettings() {
	const { data: session } = useSession();
	const [settings, setSettings] =
		useState<OrganizationFeatureSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!session?.user?.organizationId) {
			setIsLoading(false);
			return;
		}

		async function fetchSettings() {
			const result = await getOrganizationFeatures();
			if (result.success && result.data) {
				setSettings(result.data);
			}
			setIsLoading(false);
		}

		fetchSettings();
	}, [session?.user?.organizationId]);

	const isFeatureEnabled = (feature: keyof OrganizationFeatureSettings) => {
		if (!settings) return false;
		return settings[feature] as boolean;
	};

	return { settings, isLoading, isFeatureEnabled };
}
```

## Conditional Rendering in Pages

```tsx
// app/dashboard/mass-intentions/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isFeatureEnabled } from '@/lib/features';
import { MassIntentionList } from '@/components/features/mass-intentions/mass-intention-list';

export default async function MassIntentionsPage() {
	const session = await auth();
	if (!session) redirect('/auth/login');

	// ✅ Server-side feature check
	const enabled = await isFeatureEnabled(
		session.user.organizationId,
		'enableMassIntentions'
	);

	if (!enabled) {
		return (
			<div className='flex flex-col items-center justify-center py-12'>
				<h2 className='text-xl font-semibold'>Feature Not Available</h2>
				<p className='text-muted-foreground mt-2'>
					Mass intentions are not enabled for your organization.
				</p>
				<p className='text-sm text-muted-foreground mt-1'>
					Contact your parish administrator to enable this feature.
				</p>
			</div>
		);
	}

	// Feature is enabled, render normally
	return <MassIntentionList />;
}
```

## Feature-Gated Form Fields

```tsx
// components/forms/payment-form.tsx
'use client';

import { useFeatureSettings } from '@/hooks/use-feature-settings';

export function PaymentForm() {
	const { isFeatureEnabled, isLoading } = useFeatureSettings();

	// Build payment purpose options based on enabled features
	const purposeOptions = [
		{ value: 'OTHER', label: 'Other', enabled: true },
		{
			value: 'OFFERING',
			label: 'Offering',
			enabled: isFeatureEnabled('enableOfferings'),
		},
		{
			value: 'TITHE',
			label: 'Tithe',
			enabled: isFeatureEnabled('enableTithes'),
		},
		{
			value: 'MASS_INTENTION',
			label: 'Mass Intention',
			enabled: isFeatureEnabled('enableMassIntentions'),
		},
		{
			value: 'DONATION_CAMPAIGN',
			label: 'Campaign Donation',
			enabled: isFeatureEnabled('enableDonationCampaigns'),
		},
	].filter((option) => option.enabled);

	return (
		<form>
			<Select name='purpose'>
				{purposeOptions.map((option) => (
					<option
						key={option.value}
						value={option.value}
					>
						{option.label}
					</option>
				))}
			</Select>
		</form>
	);
}
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Only client-side check (can be bypassed)
'use client'
export function ProtectedFeature() {
  const { isFeatureEnabled } = useFeatureSettings()
  if (!isFeatureEnabled('enableMassIntentions')) return null
  return <MassIntentionForm />  // Server Action still needs to check!
}

// ❌ WRONG: Hardcoded feature check
if (organizationId === 'special-org-id') {
  // Allow feature
}

// ❌ WRONG: Not handling missing settings
const settings = await db.organizationFeatureSettings.findUnique({...})
if (settings.enableMassIntentions) {  // Error if settings is null!
  // ...
}

// ✅ CORRECT: Handle missing settings
const settings = await db.organizationFeatureSettings.findUnique({...})
if (settings?.enableMassIntentions) {
  // ...
}
```

## Feature Dependencies

Some features have dependencies that must also be enabled:

```tsx
// lib/features.ts
export const featureDependencies: Record<FeatureName, FeatureName[]> = {
	enableMassIntentions: ['enableFinancialManagement'], // Mass intentions need payments
	enableOnlinePayments: ['enableFinancialManagement'],
	enableDonationCampaigns: ['enableFinancialManagement'],
	enableConfessionBooking: ['enableAppointments'],
	// ... etc
};

export async function canEnableFeature(
	organizationId: string,
	feature: FeatureName
): Promise<{ allowed: boolean; missingDependencies: FeatureName[] }> {
	const dependencies = featureDependencies[feature] || [];
	const settings = await getFeatureSettings(organizationId);

	const missingDependencies = dependencies.filter((dep) => !settings?.[dep]);

	return {
		allowed: missingDependencies.length === 0,
		missingDependencies,
	};
}
```

## Testing Checklist

-   [ ] Feature check exists in Server Action
-   [ ] Feature check exists in UI (hide menu items, etc.)
-   [ ] Missing settings handled gracefully
-   [ ] Dependencies checked when enabling features
-   [ ] Error messages are user-friendly
-   [ ] Admin can toggle features in settings

## Related Skills

-   `ecclesia.tenancy.organization_scoping`
-   `ecclesia.actions.server_actions_pattern`
-   `ecclesia.ui.conditional_rendering`

## References

-   [prisma/schema.prisma](../../prisma/schema.prisma) - OrganizationFeatureSettings model
-   [docs/feature_toggled_guide.md](../../docs/feature_toggled_guide.md)
-   [docs/prd.md](../../docs/prd.md) - Section 3.2.2 Feature Toggle Management
