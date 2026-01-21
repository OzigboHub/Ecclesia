import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ParishionerForm } from '@/components/forms/parishioner-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewParishionerPage() {
	const session = await auth();
	if (!session?.user) {
		redirect('/auth/login');
	}

	// Check if user has permission to create parishioners
	const allowedRoles = [
		'SUPER_ADMIN',
		'PARISH_ADMIN',
		'PARISH_SECRETARY',
		'PARISH_STAFF',
		'OUTSTATION_ADMIN',
	];

	if (!allowedRoles.includes(session.user.role)) {
		return (
			<div className='flex flex-col items-center justify-center py-12'>
				<h2 className='text-xl font-semibold'>Access Denied</h2>
				<p className='text-muted-foreground mt-2'>
					You don&apos;t have permission to create parishioners.
				</p>
				<Link
					href='/dashboard/parishioners'
					className='mt-4'
				>
					<Button variant='outline'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back to Parishioners
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className='space-y-6 max-w-2xl'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Link href='/dashboard/parishioners'>
					<Button
						variant='ghost'
						size='sm'
					>
						<ArrowLeft className='h-5 w-5' />
					</Button>
				</Link>
				<div>
					<h1 className='text-2xl md:text-3xl font-bold tracking-tight'>
						Add New Parishioner
					</h1>
					<p className='text-muted-foreground mt-1'>
						Fill in the details to register a new parishioner
					</p>
				</div>
			</div>

			{/* Form */}
			<div className='rounded-lg border bg-card p-6'>
				<ParishionerForm />
			</div>
		</div>
	);
}
