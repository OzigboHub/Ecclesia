import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getMassIntention } from '@/app/actions/mass-intention.actions';
import { canManageMassIntentions } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Church, FileText, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { MassIntentionActions } from './mass-intention-actions';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function MassIntentionDetailPage({ params }: PageProps) {
	const session = await auth();
	if (!session?.user) redirect('/auth/login');

	const { id } = await params;
	const result = await getMassIntention(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const intention = result.data;
	const canManage = canManageMassIntentions(session.user.role);

	const statusStyles: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
		APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
		REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
		COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
		CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
	};

	const formatDate = (date: Date | string) =>
		new Date(date).toLocaleDateString('en-NG', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});

	const formatDateTime = (date: Date | string) =>
		new Date(date).toLocaleDateString('en-NG', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});

	return (
		<div className='space-y-6 max-w-4xl'>
			{/* Header */}
			<div className='flex items-start justify-between gap-4'>
				<div className='flex items-start gap-4'>
					<Link href='/mass-intentions'>
						<Button variant='ghost' size='icon'>
							<ArrowLeft className='h-5 w-5' />
						</Button>
					</Link>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>Mass Intention</h1>
						<p className='text-muted-foreground mt-1'>
							{intention.intentionType.replace(/_/g, ' ')}
						</p>
					</div>
				</div>
				<span
					className={cn(
						'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase',
						statusStyles[intention.status] || statusStyles.PENDING
					)}
				>
					{intention.status}
				</span>
			</div>

			{/* Admin Actions */}
			{canManage && (
				<MassIntentionActions id={intention.id} status={intention.status} />
			)}

			{/* Intention Details */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<FileText className='h-5 w-5' /> Intention Details
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Intention</p>
						<p className='text-base mt-1'>{intention.intention}</p>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>Type</p>
							<p className='text-base font-medium'>
								{intention.intentionType.replace(/_/g, ' ')}
							</p>
						</div>
						{intention.stipend != null && (
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Stipend</p>
								<p className='text-base font-bold'>
									{new Intl.NumberFormat('en-NG', {
										style: 'currency',
										currency: 'NGN',
									}).format(intention.stipend)}
								</p>
							</div>
						)}
					</div>

					{intention.notes && (
						<div>
							<p className='text-sm font-medium text-muted-foreground'>Notes</p>
							<p className='text-base text-muted-foreground mt-1'>
								{intention.notes}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Requester Info */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<User className='h-5 w-5' /> Requester Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>Requested By</p>
							<p className='text-base font-medium'>{intention.requestedBy}</p>
						</div>
						{intention.intendedFor && (
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Intended For</p>
								<p className='text-base'>{intention.intendedFor}</p>
							</div>
						)}
						{intention.contactEmail && (
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Email</p>
								<p className='text-base'>{intention.contactEmail}</p>
							</div>
						)}
						{intention.contactPhone && (
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Phone</p>
								<p className='text-base'>{intention.contactPhone}</p>
							</div>
						)}
						{intention.parishioner && (
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Parishioner</p>
								<Link
									href={`/parishioners/${intention.parishioner.id}`}
									className='text-base font-medium text-primary hover:underline'
								>
									{intention.parishioner.firstName} {intention.parishioner.lastName}
								</Link>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Mass Details */}
			{intention.mass && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Church className='h-5 w-5' /> Scheduled Mass
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Date</p>
								<p className='text-base font-medium'>
									{formatDate(intention.mass.date)}
								</p>
							</div>
							{intention.mass.time && (
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Time</p>
									<p className='text-base'>{intention.mass.time}</p>
								</div>
							)}
							{intention.mass.celebrant && (
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Celebrant</p>
									<p className='text-base'>{intention.mass.celebrant}</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<Separator />

			{/* Metadata */}
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
				<div>
					<p className='font-medium text-muted-foreground'>Organisation</p>
					<p>{intention.organization.name}</p>
				</div>
				<div>
					<p className='font-medium text-muted-foreground'>Submitted</p>
					<p>{formatDateTime(intention.createdAt)}</p>
				</div>
				{intention.approvedAt && (
					<div>
						<p className='font-medium text-muted-foreground'>Approved At</p>
						<p>{formatDateTime(intention.approvedAt)}</p>
					</div>
				)}
			</div>
		</div>
	);
}
