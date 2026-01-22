'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    featureCategories,
    featureLabels,
    featureDescriptions,
    FeatureName,
} from '@/lib/features';
import { updateOrganizationFeatures } from '@/app/actions/organization.actions';

interface FeatureToggleClientProps {
	organizationId: string;
	initialSettings: any;
}

export function FeatureToggleClient({
	organizationId,
	initialSettings,
}: FeatureToggleClientProps) {
	const [settings, setSettings] = useState(initialSettings);
	const [isPending, startTransition] = useTransition();

	// Note: updateOrganizationFeatures currently uses session ID.
	// We need to update it to accept an organizationId for super admins.
	// I'll update the server action next.

	const handleToggle = (feature: FeatureName, checked: boolean) => {
		startTransition(async () => {
			try {
				const result = await updateOrganizationFeatures(
					{ [feature]: checked },
					organizationId
				);

				if (result.success) {
					setSettings((prev: any) => ({ ...prev, [feature]: checked }));
					toast.success(`${featureLabels[feature]} updated`);
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				toast.error('Failed to update feature');
			}
		});
	};

	return (
		<div className='space-y-8'>
			{Object.entries(featureCategories).map(([category, { label, description, features }]) => (
				<div key={category} className='space-y-4'>
					<div>
						<h3 className='text-lg font-medium'>{label}</h3>
						<p className='text-sm text-muted-foreground'>{description}</p>
					</div>
					<div className='grid gap-4 md:grid-cols-2'>
						{features.map((feature) => (
							<div
								key={feature}
								className='flex items-center justify-between p-4 rounded-lg border bg-card'
							>
								<div className='space-y-1 pr-4'>
									<Label
										htmlFor={feature}
										className='cursor-pointer text-sm font-semibold'
									>
										{featureLabels[feature]}
									</Label>
									<p className='text-xs text-muted-foreground'>
										{featureDescriptions[feature]}
									</p>
								</div>
								<Switch
									id={feature}
									checked={settings[feature] ?? false}
									onCheckedChange={(checked) =>
										handleToggle(feature as FeatureName, checked)
									}
									disabled={isPending}
								/>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
