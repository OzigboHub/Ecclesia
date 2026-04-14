'use client';

import { cn } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

type PaymentRow = {
	id: string;
	receiptNumber: string | null;
	payerName: string;
	parishioner?: { firstName: string; lastName: string } | null;
	onBehalfOf: string | null;
	purpose: string;
	month: number | null;
	amount: number;
	paymentMethod: string;
	paymentDate: string | Date;
	paymentStatus: string;
};

function getMonthName(month: number): string {
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	return months[month - 1] || '';
}

const columns = [
	{
		header: 'Receipt',
		accessorKey: 'receiptNumber',
		cell: (row: PaymentRow) => (
			<span className='font-mono text-xs text-muted-foreground'>
				{row.receiptNumber || '-'}
			</span>
		),
	},
	{
		header: 'Payer',
		accessorKey: 'payerName',
		cell: (row: PaymentRow) => (
			<div>
				<div className='font-medium text-foreground'>
					{row.payerName}
				</div>
				{row.parishioner && (
					<div className='text-xs text-muted-foreground'>
						{row.parishioner.firstName} {row.parishioner.lastName}
					</div>
				)}
				{row.onBehalfOf && (
					<div className='text-xs text-muted-foreground'>
						On behalf of: {row.onBehalfOf}
					</div>
				)}
			</div>
		),
	},
	{
		header: 'Purpose',
		accessorKey: 'purpose',
		cell: (row: PaymentRow) => (
			<span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground'>
				{row.purpose.replace(/_/g, ' ')}
				{row.month && ` (${getMonthName(row.month)})`}
			</span>
		),
	},
	{
		header: 'Amount',
		accessorKey: 'amount',
		cell: (row: PaymentRow) => (
			<span className='font-bold text-foreground'>
				{new Intl.NumberFormat('en-NG', {
					style: 'currency',
					currency: 'NGN',
				}).format(row.amount)}
			</span>
		),
	},
	{
		header: 'Method',
		accessorKey: 'paymentMethod',
		cell: (row: PaymentRow) => (
			<span className='text-muted-foreground text-xs'>
				{row.paymentMethod.replace(/_/g, ' ')}
			</span>
		),
	},
	{
		header: 'Date',
		accessorKey: 'paymentDate',
		cell: (row: PaymentRow) =>
			new Date(row.paymentDate).toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			}),
	},
	{
		header: 'Status',
		accessorKey: 'paymentStatus',
		cell: (row: PaymentRow) => (
			<span
				className={cn(
					'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
					row.paymentStatus === 'COMPLETED' &&
						'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
					row.paymentStatus === 'PENDING' &&
						'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
					row.paymentStatus === 'FAILED' &&
						'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
					row.paymentStatus === 'REFUNDED' &&
						'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
				)}
			>
				{row.paymentStatus}
			</span>
		),
	},
];

export function DashboardPaymentsTable({
	payments,
}: {
	payments: PaymentRow[];
}) {
	if (payments.length === 0) {
		return (
			<div className='text-center py-12'>
				<p className='text-muted-foreground'>
					No payments recorded yet
				</p>
				<Button asChild className='mt-4'>
					<Link href='/payments/new'>
						<Plus className='mr-2 h-4 w-4' /> Record First Payment
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<DataTable
			columns={columns}
			data={payments}
			isLoading={false}
			actions={(row) => (
				<div className='flex items-center justify-end gap-2'>
					<Button
						variant='ghost'
						size='sm'
						className='text-xs'
						asChild
					>
						<Link href={`/dashboard/payments/${row.id}`}>
							View
						</Link>
					</Button>
				</div>
			)}
		/>
	);
}
