import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminOrganizationForm } from '@/components/forms/admin-organization-form';

export default async function NewParishPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold tracking-tight'>
					Create New Parish
				</h1>
				<p className='text-muted-foreground mt-2'>
					Add a new parish to the system
				</p>
			</div>

			<div className='flex justify-center'>
				<AdminOrganizationForm type='parish' />
			</div>
		</div>
	);
}
