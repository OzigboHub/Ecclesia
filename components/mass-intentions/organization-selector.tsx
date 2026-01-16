'use client';

import { useCallback, useTransition } from 'react';
import { getUserOrganizationHierarchy } from '@/app/actions/organization.actions';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Organization {
	id: string;
	name: string;
	level: string;
}

interface OrganizationSelectorProps {
	value: string;
	onChange: (organizationId: string) => void;
}

export function OrganizationSelector({
	value,
	onChange,
}: OrganizationSelectorProps) {
	const [isPending, startTransition] = useTransition();
	const [myOrganization, setMyOrganization] = useState<Organization | null>(
		null
	);
	const [outstations, setOutstations] = useState<Organization[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const handleDefaultValue = useCallback(
		(defaultOrgId: string) => {
			if (!value) {
				onChange(defaultOrgId);
			}
		},
		[value, onChange]
	);

	useEffect(() => {
		startTransition(async () => {
			setIsLoading(true);
			const result = await getUserOrganizationHierarchy();

			if (result.success && result.data) {
				setMyOrganization(result.data.myOrganization);
				setOutstations(result.data.outstations);
				handleDefaultValue(result.data.myOrganization.id);
			}
			setIsLoading(false);
		});
	}, [handleDefaultValue]);

	if (isLoading) {
		return (
			<div className='space-y-2'>
				<Label>Parish / Outstation</Label>
				<div className='h-10 bg-muted animate-pulse rounded-md' />
			</div>
		);
	}

	if (!myOrganization) {
		return null;
	}

	return (
		<div className='space-y-2'>
			<Label className='flex items-center gap-2'>
				<Building2 className='h-4 w-4' />
				Select Parish / Outstation
			</Label>
			<Select
				value={value || myOrganization.id}
				onValueChange={onChange}
				disabled={isPending}
			>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Select organization' />
				</SelectTrigger>
				<SelectContent>
					{/* My Parish */}
					<SelectItem value={myOrganization.id}>
						<div className='flex items-center gap-2'>
							<span className='font-semibold'>
								{myOrganization.name}
							</span>
							<span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
								My Parish
							</span>
						</div>
					</SelectItem>

					{/* Outstations */}
					{outstations.length > 0 && (
						<>
							{outstations.map((outstation) => (
								<SelectItem
									key={outstation.id}
									value={outstation.id}
								>
									<div className='flex items-center gap-2'>
										<span>{outstation.name}</span>
										<span className='text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'>
											Outstation
										</span>
									</div>
								</SelectItem>
							))}
						</>
					)}
				</SelectContent>
			</Select>
		</div>
	);
}
