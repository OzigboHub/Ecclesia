'use client';

import * as React from 'react';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MassIntentionForm } from '@/components/forms/mass-intention-form';
import { cn } from '@/lib/utils';

// Mock data for mass intentions
const MOCK_INTENTIONS = [
	{
		id: '1',
		intention: 'For the eternal repose of the soul of Maria Santos',
		type: 'REQUIEM',
		requestedBy: 'Jose Santos',
		massDate: '2026-01-15',
		status: 'SCHEDULED',
		stipend: 5000,
	},
	{
		id: '2',
		intention: 'Special intention for the success of boards exams',
		type: 'SPECIAL_INTENTION',
		requestedBy: 'Clara Oswald',
		massDate: '2026-01-14',
		status: 'COMPLETED',
		stipend: 2000,
	},
	{
		id: '3',
		intention: 'Thanksgiving for safe travel and new job',
		type: 'THANKSGIVING',
		requestedBy: 'Robert Dow',
		massDate: '2026-01-20',
		status: 'SCHEDULED',
		stipend: 10000,
	},
	{
		id: '4',
		intention: 'In loving memory of John Wick on his 1st anniversary',
		type: 'REQUIEM',
		requestedBy: 'Helen Wick',
		massDate: '2026-01-16',
		status: 'SCHEDULED',
		stipend: 5000,
	},
];

export default function MassIntentionsPage() {
	const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);

	const handleSuccess = () => {
		setIsBookModalOpen(false);
		// Refresh the page data here when you have real data fetching
	};

	// Columns for the intentions table
	const columns = [
		{
			header: 'Mass Date',
			accessorKey: 'massDate',
			cell: (row: any) => (
				<div className='flex items-center gap-2'>
					<Calendar className='h-4 w-4 text-muted-foreground' />
					<span className='font-medium'>
						{new Date(row.massDate).toLocaleDateString()}
					</span>
				</div>
			),
		},
		{
			header: 'Intention',
			accessorKey: 'intention',
			cell: (row: any) => (
				<div
					className='max-w-xs truncate'
					title={row.intention}
				>
					{row.intention}
				</div>
			),
		},
		{
			header: 'Type',
			accessorKey: 'type',
			cell: (row: any) => (
				<span
					className={cn(
						'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
						row.type === 'REQUIEM'
							? 'bg-slate-100 text-slate-700'
							: row.type === 'THANKSGIVING'
							? 'bg-amber-100 text-amber-700'
							: 'bg-blue-100 text-blue-700'
					)}
				>
					{row.type.replace('_', ' ')}
				</span>
			),
		},
		{ header: 'Requested By', accessorKey: 'requestedBy' },
		{
			header: 'Stipend',
			accessorKey: 'stipend',
			cell: (row: any) =>
				row.stipend ? `₦${row.stipend.toLocaleString()}` : '-',
		},
		{
			header: 'Status',
			accessorKey: 'status',
			cell: (row: any) => (
				<div className='flex items-center gap-1.5'>
					{row.status === 'COMPLETED' ? (
						<CheckCircle2 className='h-4 w-4 text-green-500' />
					) : (
						<Clock className='h-4 w-4 text-amber-500' />
					)}
					<span
						className={cn(
							'text-xs font-medium',
							row.status === 'COMPLETED'
								? 'text-green-700'
								: 'text-amber-700'
						)}
					>
						{row.status}
					</span>
				</div>
			),
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold text-foreground'>
						Mass Intentions
					</h1>
					<p className='text-muted-foreground mt-1'>
						Schedule and manage mass offerings.
					</p>
				</div>
				<Button onClick={() => setIsBookModalOpen(true)}>
					<Plus className='mr-2 h-4 w-4' /> Book Intention
				</Button>
			</div>

			{/* Quick Summary Cards */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				<div className='bg-background border border-border rounded-lg p-4 shadow-sm'>
					<p className='text-xs font-medium text-muted-foreground uppercase'>
						Upcoming Today
					</p>
					<p className='text-2xl font-bold text-foreground'>3</p>
				</div>
				<div className='bg-background border border-border rounded-lg p-4 shadow-sm'>
					<p className='text-xs font-medium text-muted-foreground uppercase'>
						Scheduled This Week
					</p>
					<p className='text-2xl font-bold text-foreground'>24</p>
				</div>
				<div className='bg-background border border-border rounded-lg p-4 shadow-sm'>
					<p className='text-xs font-medium text-muted-foreground uppercase'>
						Requiem Masses
					</p>
					<p className='text-2xl font-bold text-slate-600'>8</p>
				</div>
				<div className='bg-background border border-border rounded-lg p-4 shadow-sm'>
					<p className='text-xs font-medium text-muted-foreground uppercase'>
						Thanksgiving
					</p>
					<p className='text-2xl font-bold text-amber-600'>12</p>
				</div>
			</div>

			{/* Table Section */}
			<div className='bg-background border border-border rounded-lg shadow-sm p-6'>
				<DataTable
					columns={columns}
					data={MOCK_INTENTIONS}
					isLoading={false}
					actions={(row) => (
						<div className='flex items-center justify-end'>
							<Button
								variant='ghost'
								size='sm'
								className='text-xs'
							>
								Edit
							</Button>
						</div>
					)}
				/>
			</div>

			{/* Booking Modal */}
			<Modal
				isOpen={isBookModalOpen}
				onClose={() => setIsBookModalOpen(false)}
				title='Book Mass Intention'
			>
				<MassIntentionForm onSuccess={handleSuccess} />
			</Modal>
		</div>
	);
}
