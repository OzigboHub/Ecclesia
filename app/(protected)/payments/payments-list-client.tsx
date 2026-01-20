'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface PaymentsListClientProps {
	searchParams?: { [key: string]: string | undefined };
}

export default function PaymentsListClient({
	searchParams = {},
}: PaymentsListClientProps) {
	const router = useRouter();
	const params = useSearchParams();

	// Filter state
	const [search, setSearch] = React.useState(searchParams.search || '');
	const [statusFilter, setStatusFilter] = React.useState(
		searchParams.status || 'all'
	);
	const [purposeFilter, setPurposeFilter] = React.useState(
		searchParams.purpose || 'all'
	);
	const [methodFilter, setMethodFilter] = React.useState(
		searchParams.method || 'all'
	);

	// Update URL when filters change
	const updateFilters = React.useCallback(() => {
		const newParams = new URLSearchParams();
		if (search) newParams.set('search', search);
		if (statusFilter !== 'all') newParams.set('status', statusFilter);
		if (purposeFilter !== 'all') newParams.set('purpose', purposeFilter);
		if (methodFilter !== 'all') newParams.set('method', methodFilter);
		router.push(`/dashboard/payments?${newParams.toString()}`);
	}, [search, statusFilter, purposeFilter, methodFilter, router]);

	// Debounce search
	React.useEffect(() => {
		const timer = setTimeout(() => {
			updateFilters();
		}, 500);
		return () => clearTimeout(timer);
	}, [search, updateFilters]);

	React.useEffect(() => {
		updateFilters();
	}, [statusFilter, purposeFilter, methodFilter, updateFilters]);

	const hasActiveFilters =
		search || statusFilter !== 'all' || purposeFilter !== 'all' || methodFilter !== 'all';

	return (
		<div className='bg-background border border-border rounded-lg shadow-sm p-4 mb-6'>
			<div className='flex flex-col gap-4 md:flex-row md:items-center'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						type='search'
						placeholder='Search payments by name, receipt number...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className='pl-10'
					/>
				</div>

				<div className='flex gap-2 flex-wrap'>
					<Select
						value={statusFilter}
						onValueChange={setStatusFilter}
					>
						<SelectTrigger className='w-[140px]'>
							<SelectValue placeholder='Status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Status</SelectItem>
							<SelectItem value='COMPLETED'>Completed</SelectItem>
							<SelectItem value='PENDING'>Pending</SelectItem>
							<SelectItem value='FAILED'>Failed</SelectItem>
							<SelectItem value='REFUNDED'>Refunded</SelectItem>
						</SelectContent>
					</Select>

					<Select
						value={purposeFilter}
						onValueChange={setPurposeFilter}
					>
						<SelectTrigger className='w-[160px]'>
							<SelectValue placeholder='Purpose' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Purposes</SelectItem>
							<SelectItem value='OFFERING'>Offering</SelectItem>
							<SelectItem value='TITHE'>Tithe</SelectItem>
							<SelectItem value='MASS_INTENTION'>Mass Intention</SelectItem>
							<SelectItem value='DONATION_CAMPAIGN'>
								Donation Campaign
							</SelectItem>
							<SelectItem value='CUSTOM_DONATION'>
								Custom Donation
							</SelectItem>
							<SelectItem value='OTHER'>Other</SelectItem>
						</SelectContent>
					</Select>

					<Select
						value={methodFilter}
						onValueChange={setMethodFilter}
					>
						<SelectTrigger className='w-[150px]'>
							<SelectValue placeholder='Method' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Methods</SelectItem>
							<SelectItem value='CASH'>Cash</SelectItem>
							<SelectItem value='BANK_TRANSFER'>Bank Transfer</SelectItem>
							<SelectItem value='CARD'>Card</SelectItem>
							<SelectItem value='MOBILE_MONEY'>Mobile Money</SelectItem>
							<SelectItem value='CHECK'>Check</SelectItem>
						</SelectContent>
					</Select>

					{hasActiveFilters && (
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								setSearch('');
								setStatusFilter('all');
								setPurposeFilter('all');
								setMethodFilter('all');
								router.push('/dashboard/payments');
							}}
						>
							Clear
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
