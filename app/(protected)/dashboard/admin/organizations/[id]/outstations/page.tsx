import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Plus } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface OrganizationOutstationsPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string }>;
}

export default async function OrganizationOutstationsPage({
	params,
	searchParams,
}: OrganizationOutstationsPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const { id } = await params;
	const sParams = await searchParams;
	const page = parseInt(sParams.page || '1');
	const limit = 20;
	const skip = (page - 1) * limit;

	const organization = await db.organization.findUnique({
		where: { id },
		select: { name: true, level: true },
	});

	if (!organization || organization.level !== 'PARISH') {
		notFound();
	}

	const [outstations, total] = await Promise.all([
		db.organization.findMany({
			where: { parentId: id },
			orderBy: { name: 'asc' },
			skip,
			take: limit,
		}),
		db.organization.count({ where: { parentId: id } }),
	]);

	const totalPages = Math.ceil(total / limit);

	return (
		<div className='space-y-6'>
			<div className='space-y-2 flex justify-between items-start'>
				<div>
					<Link href={`/dashboard/admin/organizations/${id}`}>
						<Button variant='ghost' size='sm' className='mb-2'>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back to {organization.name}
						</Button>
					</Link>
					<h1 className='text-3xl font-bold tracking-tight'>
						Outstations
					</h1>
					<p className='text-muted-foreground'>
						All outstations belonging to {organization.name}
					</p>
				</div>
				<Link href={`/dashboard/admin/organizations/${id}/new-outstation`}>
					<Button>
						<Plus className='h-4 w-4 mr-2' />
						Add Outstation
					</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Building2 className='h-5 w-5' />
						{total} Outstation{total !== 1 ? 's' : ''}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Address</TableHead>
								<TableHead>Contact Phone</TableHead>
								<TableHead className='text-right'>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{outstations.map((org) => (
								<TableRow key={org.id}>
									<TableCell className='font-medium'>
										{org.name}
									</TableCell>
									<TableCell>{org.address || '-'}</TableCell>
									<TableCell>{org.contactPhone || '-'}</TableCell>
									<TableCell className='text-right'>
										<Link href={`/dashboard/admin/organizations/${org.id}`}>
											<Button variant='ghost' size='sm'>
												View
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{totalPages > 1 && (
						<div className='flex items-center justify-center gap-2 mt-4'>
							<Link
								href={`/dashboard/admin/organizations/${id}/outstations?page=${Math.max(1, page - 1)}`}
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
								href={`/dashboard/admin/organizations/${id}/outstations?page=${Math.min(totalPages, page + 1)}`}
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
