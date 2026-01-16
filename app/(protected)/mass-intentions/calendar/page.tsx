import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getMassIntentions } from '@/app/actions/mass-intention.actions';
import { getMassesInRange } from '@/app/actions/mass.actions';
import { MassIntentionCalendar } from '@/components/features/mass-intentions/mass-intention-calendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export const metadata = {
	title: 'Mass Intention Calendar | Ecclesia DPM',
	description: 'View and manage mass intention calendar',
};

export default async function MassIntentionCalendarPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login');
	}

	// Fetch intentions and masses for user's organization
	const [intentionsResult, massesResult] = await Promise.all([
		getMassIntentions(),
		// Fetch masses for 3 months: previous, current, and next
		getMassesInRange(
			subMonths(startOfMonth(new Date()), 1),
			addMonths(endOfMonth(new Date()), 1),
			session.user.organizationId
		),
	]);

	if (!intentionsResult.success) {
		return (
			<div className='space-y-4'>
				<div className='flex items-center gap-2'>
					<Link href='/dashboard/mass-intentions'>
						<Button
							variant='ghost'
							size='sm'
						>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back
						</Button>
					</Link>
				</div>
				<div className='rounded-lg border border-destructive bg-destructive/10 p-4'>
					<p className='text-sm text-destructive'>
						{intentionsResult.message ||
							'Failed to load mass intentions'}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>Book Mass Intention</h1>
					<p className='text-muted-foreground mt-1'>
						Select a parish/outstation, then choose a mass date and
						time
					</p>
				</div>
				<Link href='/dashboard/mass-intentions'>
					<Button variant='outline'>View All</Button>
				</Link>
			</div>

			<MassIntentionCalendar
				intentions={intentionsResult.data || []}
				masses={massesResult.data || []}
				initialOrganizationId={session.user.organizationId}
			/>
		</div>
	);
}
