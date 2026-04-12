import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/app/actions/user.actions';
import { ChangePasswordForm } from '@/components/forms/change-password-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChangePasswordPageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ChangePasswordPageProps) {
	const { id } = await params;
	const result = await getUser(id);

	if (!result.success || !result.data) {
		return { title: 'User Not Found | Ecclesia' };
	}

	return {
		title: `Change Password - ${result.data.firstName} ${result.data.lastName} | Ecclesia`,
		description: 'Change user password',
	};
}

export default async function ChangePasswordPage({
	params,
}: ChangePasswordPageProps) {
	const { id } = await params;
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login');
	}

	// Only admins can change passwords
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

	// Can't change password for users at same or higher level (unless it's yourself)
	if (currentUserLevel <= targetUserLevel && session.user.id !== user.id) {
		redirect('/users?error=insufficient_permissions');
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
					<Link href={`/users/${id}/edit`}>
						<ArrowLeft className='h-4 w-4' />
						<span className='sr-only'>Back to edit user</span>
					</Link>
				</Button>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>
						Change Password
					</h1>
					<p className='text-muted-foreground'>
						{user.firstName} {user.lastName} ({user.email})
					</p>
				</div>
			</div>

			{/* Warning Alert */}
			<div className='max-w-2xl'>
				<Alert variant='destructive'>
					<AlertTriangle className='h-4 w-4' />
					<AlertTitle>Security Notice</AlertTitle>
					<AlertDescription>
						Changing a user&apos;s password will invalidate their
						current session and they will need to log in again with
						the new password. Make sure to communicate the new
						password to the user securely.
					</AlertDescription>
				</Alert>
			</div>

			{/* Form */}
			<div className='max-w-2xl'>
				<Card>
					<CardHeader>
						<CardTitle>New Password</CardTitle>
						<CardDescription>
							Set a new password for this user. The password must
							meet the security requirements below.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ChangePasswordForm
							userId={user.id}
							userName={`${user.firstName} ${user.lastName}`}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
