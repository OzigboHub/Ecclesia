import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getPayment } from '@/app/actions/payment.actions';
import { Button } from '@/components/ui/button';
import {
	ArrowLeft,
	Printer,
	Calendar,
	User,
	CreditCard,
	FileText,
	CheckCircle2,
	Clock,
	XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { DownloadReceiptButton } from '@/components/features/payments/download-receipt-button';
import { PrintButton } from '@/components/features/payments/print-button';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: PageProps) {
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	const { id } = await params;
	const result = await getPayment(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const payment = result.data;

	// Format date
	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString('en-NG', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// Format amount
	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
		}).format(amount);
	};

	// Get status color and icon
	const getStatusInfo = (status: string) => {
		switch (status) {
			case 'COMPLETED':
				return {
					color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
					icon: CheckCircle2,
					label: 'Completed',
				};
			case 'PENDING':
				return {
					color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
					icon: Clock,
					label: 'Pending',
				};
			case 'FAILED':
				return {
					color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
					icon: XCircle,
					label: 'Failed',
				};
			case 'REFUNDED':
				return {
					color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
					icon: XCircle,
					label: 'Refunded',
				};
			default:
				return {
					color: 'bg-gray-100 text-gray-800',
					icon: Clock,
					label: status,
				};
		}
	};

	const statusInfo = getStatusInfo(payment.paymentStatus);
	const StatusIcon = statusInfo.icon;

	return (
		<div className='space-y-6 max-w-4xl'>
			{/* Header */}
			<div className='flex items-start justify-between gap-4'>
				<div className='flex items-start gap-4'>
					<Link href='/dashboard/payments'>
						<Button
							variant='ghost'
							size='icon'
						>
							<ArrowLeft className='h-5 w-5' />
						</Button>
					</Link>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>
							Payment Details
						</h1>
						<p className='text-muted-foreground mt-1'>
							Receipt Number: {payment.receiptNumber || 'N/A'}
						</p>
					</div>
				</div>
				<div className='flex gap-2'>
					<PrintButton />
					<DownloadReceiptButton
						paymentId={payment.id}
						receiptNumber={payment.receiptNumber || 'N/A'}
					/>
				</div>
			</div>

			{/* Receipt Preview */}
			<Card className='print:shadow-none print:border-0'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>Payment Receipt</CardTitle>
						<span
							className={cn(
								'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase',
								statusInfo.color
							)}
						>
							<StatusIcon className='h-3 w-3' />
							{statusInfo.label}
						</span>
					</div>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Organization Info */}
					<div className='text-center border-b pb-4'>
						<h2 className='text-2xl font-bold'>
							{payment.organization.name}
						</h2>
						{payment.organization.address && (
							<p className='text-sm text-muted-foreground mt-1'>
								{payment.organization.address}
							</p>
						)}
						{payment.organization.contactPhone && (
							<p className='text-sm text-muted-foreground'>
								Phone: {payment.organization.contactPhone}
							</p>
						)}
					</div>

					{/* Payment Details */}
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>
								Receipt Number
							</p>
							<p className='text-lg font-semibold'>
								{payment.receiptNumber || 'N/A'}
							</p>
						</div>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>
								Payment Date
							</p>
							<p className='text-lg font-semibold'>
								{formatDate(payment.paymentDate)}
							</p>
						</div>
					</div>

					<Separator />

					{/* Amount */}
					<div className='text-center py-4 bg-muted/50 rounded-lg'>
						<p className='text-sm font-medium text-muted-foreground mb-2'>
							Amount Paid
						</p>
						<p className='text-4xl font-bold text-foreground'>
							{formatAmount(payment.amount)}
						</p>
					</div>

					<Separator />

					{/* Payer Information */}
					<div>
						<h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
							<User className='h-5 w-5' />
							Payer Information
						</h3>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>
									Payer Name
								</p>
								<p className='text-base font-medium'>
									{payment.payerName}
								</p>
							</div>
							{payment.parishioner && (
								<div>
									<p className='text-sm font-medium text-muted-foreground'>
										Parishioner
									</p>
									<Link
										href={`/dashboard/parishioners/${payment.parishioner.id}`}
										className='text-base font-medium text-primary hover:underline'
									>
										{payment.parishioner.firstName}{' '}
										{payment.parishioner.lastName}
									</Link>
								</div>
							)}
							{payment.payerEmail && (
								<div>
									<p className='text-sm font-medium text-muted-foreground'>
										Email
									</p>
									<p className='text-base'>
										{payment.payerEmail}
									</p>
								</div>
							)}
							{payment.payerPhone && (
								<div>
									<p className='text-sm font-medium text-muted-foreground'>
										Phone
									</p>
									<p className='text-base'>
										{payment.payerPhone}
									</p>
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* Payment Information */}
					<div>
						<h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
							<CreditCard className='h-5 w-5' />
							Payment Information
						</h3>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>
									Purpose
								</p>
								<p className='text-base font-medium'>
									{payment.purpose.replace(/_/g, ' ')}
									{payment.month &&
										` (${new Date(
											2000,
											payment.month - 1
										).toLocaleString('default', {
											month: 'long',
										})})`}
								</p>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>
									Payment Method
								</p>
								<p className='text-base font-medium'>
									{payment.paymentMethod.replace(/_/g, ' ')}
								</p>
							</div>
							{payment.transactionRef && (
								<div>
									<p className='text-sm font-medium text-muted-foreground'>
										Transaction Reference
									</p>
									<p className='text-base font-mono'>
										{payment.transactionRef}
									</p>
								</div>
							)}
							{payment.donationCampaign && (
								<div>
									<p className='text-sm font-medium text-muted-foreground'>
										Campaign
									</p>
									<p className='text-base font-medium'>
										{payment.donationCampaign.name}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Mass Intention Link */}
					{payment.massIntention && (
						<>
							<Separator />
							<div>
								<h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
									<Calendar className='h-5 w-5' />
									Linked Mass Intention
								</h3>
								<div className='bg-muted/50 rounded-lg p-4 space-y-3'>
									<div className='flex items-start justify-between'>
										<div>
											<p className='text-sm font-medium text-muted-foreground'>
												Mass Type
											</p>
											<p className='text-base font-medium'>
												{payment.massIntention.intentionType.replace(
													/_/g,
													' '
												)}
											</p>
										</div>
										<Link
											href={`/mass-intentions/${payment.massIntention.id}`}
											className='text-sm text-primary hover:underline'
										>
											View Details
										</Link>
									</div>
									{payment.massIntention.intention && (
										<div>
											<p className='text-sm font-medium text-muted-foreground'>
												Intention
											</p>
											<p className='text-base'>
												{
													payment.massIntention
														.intention
												}
											</p>
										</div>
									)}
									{payment.massIntention.mass && (
										<div>
											<p className='text-sm font-medium text-muted-foreground'>
												Mass Date
											</p>
											<p className='text-base'>
												{new Date(
													payment.massIntention.mass.date
												).toLocaleDateString('en-NG')}
											</p>
										</div>
									)}
								</div>
							</div>
						</>
					)}

					{payment.notes && (
						<>
							<Separator />
							<div>
								<h3 className='text-lg font-semibold mb-2 flex items-center gap-2'>
									<FileText className='h-5 w-5' />
									Notes
								</h3>
								<p className='text-base text-muted-foreground'>
									{payment.notes}
								</p>
							</div>
						</>
					)}

					<Separator />

					{/* Recorded By */}
					<div>
						<p className='text-sm font-medium text-muted-foreground'>
							Recorded By
						</p>
						<p className='text-base'>
							{payment.recordedBy
								? `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}`
								: 'Online Payment (Guest/System)'}
						</p>
						<p className='text-xs text-muted-foreground mt-1'>
							{formatDate(payment.createdAt)}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
