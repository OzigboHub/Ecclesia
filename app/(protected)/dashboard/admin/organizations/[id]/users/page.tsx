import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getOrganizationUsers } from '@/app/actions/organization.actions';

interface OrganizationUsersPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string }>;
}

export default async function OrganizationUsersPage({
	params,
	searchParams,
}: OrganizationUsersPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const { id } = await params;
	const sParams = await searchParams;
	const page = parseInt(sParams.page || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	const organization = await db.organization.findUnique({
		where: { id },
		select: { name: true },
	});

	if (!organization) {
		notFound();
	}

	const result = await getOrganizationUsers(id, limit, offset);

	if (!result.success || !result.data) {
		return <div>Failed to load users</div>;
	}

	const { users, total } = result.data;
	const totalPages = Math.ceil(total / limit);

	return (
		<div className='space-y-6'>
			<div className='space-y-2'>
				<Link href={`/dashboard/admin/organizations/${id}`}>
					<Button variant='ghost' size='sm' className='mb-2'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to {organization.name}
					</Button>
				</Link>
				<h1 className='text-3xl font-bold tracking-tight'>
					Users
				</h1>
				<p className='text-muted-foreground'>
					All users associated with {organization.name}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5' />
						{total} User{total !== 1 ? 's' : ''}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Created At</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className='font-medium'>
										{user.firstName} {user.lastName}
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge variant='secondary'>
											{user.role}
										</Badge>
									</TableCell>
									<TableCell>
										{new Date(user.createdAt).toLocaleDateString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{totalPages > 1 && (
						<div className='flex items-center justify-center gap-2 mt-4'>
							<Link
								href={`/dashboard/admin/organizations/${id}/users?page=${Math.max(1, page - 1)}`}
							>
								<Button
									variant='outline'
									size='sm'
									disabled={page === 1}
								>
									Previous
								</Button>
							</Link>
							<span className='text-sm text-muted-foreground'>
								Page {page} of {totalPages}
							</span>
							<Link
								href={`/dashboard/admin/organizations/${id}/users?page=${Math.min(totalPages, page + 1)}`}
							>
								<Button
									variant='outline'
									size='sm'
									disabled={page === totalPages}
								>
									Next
								</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
