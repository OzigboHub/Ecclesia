import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminOrganizationForm } from '@/components/forms/admin-organization-form';

interface NewOutstationPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function NewOutstationPage({
	params,
}: NewOutstationPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const { id } = await params;

	// Get all parishes for the dropdown
	const parishes = await db.organization.findMany({
		where: { level: 'PARISH' },
		select: { id: true, name: true },
		orderBy: { name: 'asc' },
	});

	const currentParish = await db.organization.findUnique({
		where: { id },
	});

	if (!currentParish || currentParish.level !== 'PARISH') {
		redirect('/dashboard/admin/organizations');
	}

	return (
		<div className='space-y-6'>
			<div>
				<Link href={`/dashboard/admin/organizations/${id}`}>
					<Button
						variant='ghost'
						size='sm'
						className='mb-2'
					>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to {currentParish.name}
					</Button>
				</Link>
				<h1 className='text-3xl font-bold tracking-tight'>
					Create New Outstation
				</h1>
				<p className='text-muted-foreground mt-2'>
					Create a new outstation under {currentParish.name}
				</p>
			</div>

			<div className='flex justify-center'>
				<AdminOrganizationForm
					type='outstation'
					parishes={[currentParish, ...parishes]}
				/>
			</div>
		</div>
	);
}
