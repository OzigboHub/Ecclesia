import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserForm } from '@/components/forms/user-form';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
	title: 'Add User | Ecclesia',
	description: 'Create a new user account',
};

export default async function NewUserPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login');
	}

	// Only admins can create users
	const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN'];
	if (!allowedRoles.includes(session.user.role)) {
		redirect('/dashboard?error=unauthorized');
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button
					variant='ghost'
					size='icon'
					asChild
				>
					<Link href='/users'>
						<ArrowLeft className='h-4 w-4' />
						<span className='sr-only'>Back to users</span>
					</Link>
				</Button>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>
						Add User
					</h1>
					<p className='text-muted-foreground'>
						Create a new user account for your organization
					</p>
				</div>
			</div>

			{/* Form */}
			<div className='max-w-2xl'>
				<Card>
					<CardHeader>
						<CardTitle>User Information</CardTitle>
						<CardDescription>
							Enter the details for the new user. They will
							receive login credentials to access the system.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<UserForm currentUserRole={session.user.role} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
