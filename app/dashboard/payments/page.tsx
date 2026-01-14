import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Plus, Download } from 'lucide-react';
import { getPayments, getPaymentStats } from '@/app/actions/payment.actions';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default async function PaymentsPage({
	searchParams: searchParamsPromise,
}: {
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const session = await auth();
	if (!session?.user) redirect('/auth/login');

	// Await searchParams in Next.js 16
	const searchParams = await searchParamsPromise;

	// Fetch payments and stats
	const [paymentsResult, statsResult] = await Promise.all([
		getPayments({
			page: searchParams.page ? parseInt(searchParams.page) : 1,
			limit: 20,
			search: searchParams.search,
			purpose: searchParams.purpose as any,
			status: searchParams.status as any,
		}),
		getPaymentStats(),
	]);

	if (!paymentsResult.success || !statsResult.success) {
		return (
			<div className='space-y-6'>
				<h1 className='text-3xl font-bold'>Payments</h1>
				<div className='rounded-lg border bg-card p-6'>
					<p className='text-destructive'>
						{paymentsResult.message || statsResult.message}
					</p>
				</div>
			</div>
		);
	}

	const { payments, total } = paymentsResult.data!;
	const stats = statsResult.data!;

	// Calculate today's revenue (from stats)
	const todayRevenue = payments
		.filter((p) => {
			const paymentDate = new Date(p.paymentDate);
			const today = new Date();
			return (
				p.paymentStatus === 'COMPLETED' &&
				paymentDate.toDateString() === today.toDateString()
			);
		})
		.reduce((sum, p) => sum + p.amount, 0);

	const pendingCount = payments.filter(
		(p) => p.paymentStatus === 'PENDING'
	).length;

	// Columns for the payments table
	const columns = [
		{
			header: 'Receipt',
			accessorKey: 'receiptNumber',
			cell: (row: (typeof payments)[0]) => (
				<span className='font-mono text-xs text-muted-foreground'>
					{row.receiptNumber || '-'}
				</span>
			),
		},
		{
			header: 'Payer',
			accessorKey: 'payerName',
			cell: (row: (typeof payments)[0]) => (
				<div>
					<div className='font-medium text-foreground'>
						{row.payerName}
					</div>
					{row.parishioner && (
						<div className='text-xs text-muted-foreground'>
							{row.parishioner.firstName}{' '}
							{row.parishioner.lastName}
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
			cell: (row: (typeof payments)[0]) => (
				<span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground'>
					{row.purpose.replace(/_/g, ' ')}
					{row.month && ` (${getMonthName(row.month)})`}
				</span>
			),
		},
		{
			header: 'Amount',
			accessorKey: 'amount',
			cell: (row: (typeof payments)[0]) => (
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
			cell: (row: (typeof payments)[0]) => (
				<span className='text-muted-foreground text-xs'>
					{row.paymentMethod.replace(/_/g, ' ')}
				</span>
			),
		},
		{
			header: 'Date',
			accessorKey: 'paymentDate',
			cell: (row: (typeof payments)[0]) =>
				new Date(row.paymentDate).toLocaleDateString('en-GB', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
				}),
		},
		{
			header: 'Status',
			accessorKey: 'paymentStatus',
			cell: (row: (typeof payments)[0]) => (
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

	return (
		<div className='space-y-6'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold text-foreground'>
						Payments
					</h1>
					<p className='text-muted-foreground mt-1'>
						Track offerings, tithes, and donations.
					</p>
				</div>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						asChild
					>
						<a href='/api/payments/export'>
							<Download className='mr-2 h-4 w-4' /> Export
						</a>
					</Button>
					<Button asChild>
						<Link href='/dashboard/payments/new'>
							<Plus className='mr-2 h-4 w-4' /> Record Payment
						</Link>
					</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
				<div className='bg-background border border-border rounded-lg p-4 shadow-sm'>
					<p className='text-xs font-medium text-muted-foreground uppercase'>
						Today's Revenue
					</p>
					<p className='text-2xl font-bold text-foreground'>
						{new Intl.NumberFormat('en-NG', {
							style: 'currency',
							currency: 'NGN',
						}).format(todayRevenue)}
					</p>
				</div>
				<div className='bg-background border border-border rounded-lg p-4 shadow-sm'>
					<p className='text-xs font-medium text-muted-foreground uppercase'>
						Year Total ({new Date().getFullYear()})
					</p>
					<p className='text-2xl font-bold text-foreground'>
						{new Intl.NumberFormat('en-NG', {
							style: 'currency',
							currency: 'NGN',
						}).format(stats.totalAmount)}
					</p>
					<p className='text-xs text-muted-foreground mt-1'>
						{stats.totalCount} payments
					</p>
				</div>
				<div className='bg-background border border-border rounded-lg p-4 shadow-sm'>
					<p className='text-xs font-medium text-muted-foreground uppercase'>
						Pending Payments
					</p>
					<p className='text-2xl font-bold text-yellow-600'>
						{pendingCount}
					</p>
				</div>
			</div>

			{/* Table Section */}
			<div className='bg-background border border-border rounded-lg shadow-sm p-6'>
				{payments.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-muted-foreground'>
							No payments recorded yet
						</p>
						<Button
							asChild
							className='mt-4'
						>
							<Link href='/dashboard/payments/new'>
								<Plus className='mr-2 h-4 w-4' /> Record First
								Payment
							</Link>
						</Button>
					</div>
				) : (
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
									<Link
										href={`/dashboard/payments/${row.id}`}
									>
										View
									</Link>
								</Button>
							</div>
						)}
					/>
				)}
			</div>
		</div>
	);
}

// Helper function to get month name
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
