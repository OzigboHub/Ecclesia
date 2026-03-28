import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getSociety } from '@/app/actions/society.actions';
import { SocietyForm } from '@/components/forms/society-form';

interface EditSocietyPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditSocietyPage({
	params,
}: EditSocietyPageProps) {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	// Await params (Next.js 16 pattern)
	const { id } = await params;

	const result = await getSociety(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const society = result.data;

	// Transform to match initialData format
	const initialData = {
		id: society.id,
		name: society.name,
		description: society.description,
		patronSaint: society.patronSaint,
		presidentId: society.presidentId,
		secretaryId: society.secretaryId,
		meetingSchedule: society.meetingSchedule,
	};

	return (
		<div className='max-w-2xl mx-auto space-y-6'>
			<div>
				<h1 className='text-3xl font-bold tracking-tight'>
					Edit Society
				</h1>
				<p className='text-muted-foreground'>
					Update society details and leadership.
				</p>
			</div>

			<SocietyForm initialData={initialData} />
		</div>
	);
}
