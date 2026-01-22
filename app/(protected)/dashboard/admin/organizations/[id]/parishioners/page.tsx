import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getOrganizationParishioners } from '@/app/actions/organization.actions';

interface OrganizationParishionersPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string }>;
}

export default async function OrganizationParishionersPage({
	params,
	searchParams,
}: OrganizationParishionersPageProps) {
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

	const result = await getOrganizationParishioners(id, limit, offset);

	if (!result.success || !result.data) {
		return <div>Failed to load parishioners</div>;
	}

	const { parishioners, total } = result.data;
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
					Parishioners
				</h1>
				<p className='text-muted-foreground'>
					All parishioners registered in {organization.name}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<UserCircle className='h-5 w-5' />
						{total} Parishioner{total !== 1 ? 's' : ''}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Gender</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Created At</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{parishioners.map((p) => (
								<TableRow key={p.id}>
									<TableCell className='font-medium'>
										{p.firstName} {p.lastName}
									</TableCell>
									<TableCell>{p.gender}</TableCell>
									<TableCell>
										<Badge variant='outline'>
											{p.parishionerType}
										</Badge>
									</TableCell>
									<TableCell>
										{new Date(p.createdAt).toLocaleDateString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{totalPages > 1 && (
						<div className='flex items-center justify-center gap-2 mt-4'>
							<Link
								href={`/dashboard/admin/organizations/${id}/parishioners?page=${Math.max(1, page - 1)}`}
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
								href={`/dashboard/admin/organizations/${id}/parishioners?page=${Math.min(totalPages, page + 1)}`}
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
