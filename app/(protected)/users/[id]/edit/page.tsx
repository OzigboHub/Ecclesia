import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/app/actions/user.actions';
import { UserEditForm } from '@/components/forms/user-edit-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

interface EditUserPageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditUserPageProps) {
	const { id } = await params;
	const result = await getUser(id);

	if (!result.success || !result.data) {
		return { title: 'User Not Found | Ecclesia' };
	}

	return {
		title: `Edit ${result.data.firstName} ${result.data.lastName} | Ecclesia`,
		description: 'Edit user account details',
	};
}

export default async function EditUserPage({ params }: EditUserPageProps) {
	const { id } = await params;
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login');
	}

	// Only admins can edit users
	const allowedRoles = ['SUPER_ADMIN', 'PARISH_ADMIN'];
	if (!allowedRoles.includes(session.user.role)) {
		redirect('/dashboard?error=unauthorized');
	}

	const result = await getUser(id);

	if (!result.success || !result.data) {
		notFound();
	}

	const user = result.data;

	// Check if current user can modify this user based on role hierarchy
	const roleHierarchy: Record<string, number> = {
		SUPER_ADMIN: 100,
		PARISH_ADMIN: 80,
		PARISH_SECRETARY: 60,
		PARISH_STAFF: 40,
		OUTSTATION_ADMIN: 40,
		SOCIETY_PRESIDENT: 30,
		SOCIETY_SECRETARY: 30,
		PARISHIONER: 10,
	};

	const currentUserLevel = roleHierarchy[session.user.role] ?? 0;
	const targetUserLevel = roleHierarchy[user.role] ?? 0;

	// Can't edit users at same or higher level (unless it's yourself)
	if (currentUserLevel <= targetUserLevel && session.user.id !== user.id) {
		redirect('/users?error=insufficient_permissions');
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
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
							Edit User
						</h1>
						<p className='text-muted-foreground'>
							{user.firstName} {user.lastName} ({user.email})
						</p>
					</div>
				</div>
				<Button
					variant='outline'
					asChild
				>
					<Link href={`/users/${id}/password`}>
						<KeyRound className='mr-2 h-4 w-4' />
						Change Password
					</Link>
				</Button>
			</div>

			{/* Form */}
			<div className='max-w-2xl'>
				<Card>
					<CardHeader>
						<CardTitle>User Information</CardTitle>
						<CardDescription>
							Update the user&apos;s account details and role
							assignment.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<UserEditForm
							user={user}
							currentUserRole={session.user.role}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
