import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { OrganizationForm } from '@/components/forms/organization-form';

export default async function NewOrganizationPage() {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	return (
		<div className='max-w-2xl mx-auto space-y-6'>
			<div>
				<h1 className='text-3xl font-bold tracking-tight'>
					Create Organization
				</h1>
				<p className='text-muted-foreground'>
					Register a new pious organization or society.
				</p>
			</div>

			<OrganizationForm />
		</div>
	);
}
