import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getMassIntentions } from '@/app/actions/mass-intention.actions';
import { MassIntentionCalendar } from '@/components/features/mass-intentions/mass-intention-calendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
	title: 'Mass Intention Calendar | Ecclesia DPM',
	description: 'View and manage mass intention calendar',
};

export default async function MassIntentionCalendarPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login');
	}

	const result = await getMassIntentions();

	if (!result.success) {
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
						{result.message || 'Failed to load mass intentions'}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>
						Mass Intention Calendar
					</h1>
					<p className='text-muted-foreground mt-1'>
						View available mass times and book intentions
					</p>
				</div>
				<Link href='/dashboard/mass-intentions'>
					<Button variant='outline'>Back to List</Button>
				</Link>
			</div>

			<MassIntentionCalendar intentions={result.data || []} />
		</div>
	);
}
