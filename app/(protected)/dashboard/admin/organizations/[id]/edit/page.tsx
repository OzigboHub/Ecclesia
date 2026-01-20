import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { OrganizationEditForm } from '@/components/forms/organization-edit-form';

interface OrganizationEditPageProps {
	params: {
		id: string;
	};
}

export default async function OrganizationEditPage({
	params,
}: OrganizationEditPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const organization = await db.organization.findUnique({
		where: { id: params.id },
	});

	if (!organization) {
		redirect('/dashboard/admin/organizations');
	}

	return (
		<div className='space-y-6'>
			<div>
				<Link
					href={`/dashboard/admin/organizations/${organization.id}`}
				>
					<Button
						variant='ghost'
						size='sm'
						className='mb-2'
					>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back
					</Button>
				</Link>
				<h1 className='text-3xl font-bold tracking-tight'>
					Edit {organization.name}
				</h1>
			</div>

			<OrganizationEditForm organization={organization} />
		</div>
	);
}
