import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPiousOrganization } from '@/app/actions/pious-organization.actions';
import { OrganizationForm } from '@/components/forms/organization-form';

interface EditOrganizationPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditOrganizationPage({
	params,
}: EditOrganizationPageProps) {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	// Await params (Next.js 16 pattern)
	const { id } = await params;

	const result = await getPiousOrganization(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const organization = result.data;

	// Transform to match initialData format
	const initialData = {
		id: organization.id,
		name: organization.name,
		description: organization.description,
		patronSaint: organization.patronSaint,
		presidentId: organization.presidentId,
		secretaryId: organization.secretaryId,
		meetingSchedule: organization.meetingSchedule,
	};

	return (
		<div className='max-w-2xl mx-auto space-y-6'>
			<div>
				<h1 className='text-3xl font-bold tracking-tight'>
					Edit Organization
				</h1>
				<p className='text-muted-foreground'>
					Update organization details and leadership.
				</p>
			</div>

			<OrganizationForm initialData={initialData} />
		</div>
	);
}
