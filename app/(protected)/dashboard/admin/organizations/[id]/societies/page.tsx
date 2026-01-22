import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UsersRound } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getOrganizationSocieties } from '@/app/actions/organization.actions';

interface OrganizationSocietiesPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string }>;
}

export default async function OrganizationSocietiesPage({
	params,
	searchParams,
}: OrganizationSocietiesPageProps) {
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

	const result = await getOrganizationSocieties(id, limit, offset);

	if (!result.success || !result.data) {
		return <div>Failed to load societies</div>;
	}

	const { societies, total } = result.data;
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
					Societies
				</h1>
				<p className='text-muted-foreground'>
					All societies in {organization.name}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<UsersRound className='h-5 w-5' />
						{total} Society{total !== 1 ? 's' : ''}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Patron Saint</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead className='text-right'>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{societies.map((s) => (
								<TableRow key={s.id}>
									<TableCell className='font-medium'>
										{s.name}
									</TableCell>
									<TableCell>{s.patronSaint || '-'}</TableCell>
									<TableCell>
										{new Date(s.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className='text-right'>
										<Link href={`/dashboard/societies/${s.id}`}>
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
								href={`/dashboard/admin/organizations/${id}/societies?page=${Math.max(1, page - 1)}`}
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
								href={`/dashboard/admin/organizations/${id}/societies?page=${Math.min(totalPages, page + 1)}`}
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
