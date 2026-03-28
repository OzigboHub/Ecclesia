import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllOrganizationsWithMetrics } from '@/app/actions/super-admin.actions';
import { Search, Eye, Settings, Building2, Users } from 'lucide-react';
import Link from 'next/link';

interface OrganizationsPageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		level?: 'PARISH' | 'OUTSTATION';
	}>;
}

export default async function OrganizationsPage({
	searchParams,
}: OrganizationsPageProps) {
	const session = await auth();

	if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
		redirect('/dashboard');
	}

	const params = await searchParams;
	const page = parseInt(params.page || '1');
	const searchQuery = params.search;
	const level = params.level;

	const result = await getAllOrganizationsWithMetrics(
		page,
		20,
		searchQuery,
		level
	);

	const organizations = result.data?.data || [];
	const total = result.data?.total || 0;
	const totalPages = result.data?.totalPages || 1;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>
						Organizations
					</h1>
					<p className='text-muted-foreground mt-2'>
						Manage all parishes and outstations
					</p>
				</div>
				<Link href='/dashboard/admin/organizations/new'>
					<Button>
						<Building2 className='h-4 w-4 mr-2' />
						Create Parish
					</Button>
				</Link>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className='pt-6'>
					<div className='flex gap-4'>
						<div className='flex-1 relative'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder='Search organizations...'
								className='pl-10'
								defaultValue={searchQuery}
							/>
						</div>
						<div className='flex gap-2'>
							<Link
								href='/dashboard/admin/organizations'
							>
								<Button
									variant={!level ? 'default' : 'outline'}
									size='sm'
								>
									All
								</Button>
							</Link>
							<Link
								href='/dashboard/admin/organizations?level=PARISH'
							>
								<Button
									variant={
										level === 'PARISH' ? 'default' : 'outline'
									}
									size='sm'
								>
									Parishes
								</Button>
							</Link>
							<Link
								href='/dashboard/admin/organizations?level=OUTSTATION'
							>
								<Button
									variant={
										level === 'OUTSTATION'
											? 'default'
											: 'outline'
									}
									size='sm'
								>
									Outstations
								</Button>
							</Link>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Organizations Table */}
			<Card>
				<CardHeader>
					<CardTitle>
						{total} Organization{total !== 1 ? 's' : ''}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Parent</TableHead>
								<TableHead>Users</TableHead>
								<TableHead>Parishioners</TableHead>
								<TableHead>Societies</TableHead>
								<TableHead className='text-right'>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{organizations.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className='text-center py-6 text-muted-foreground'
									>
										No organizations found
									</TableCell>
								</TableRow>
							) : (
								organizations.map((org) => (
									<TableRow key={org.id}>
										<TableCell className='font-medium'>
											{org.name}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													org.level === 'PARISH'
														? 'default'
														: 'secondary'
												}
											>
												{org.level === 'PARISH'
													? '⛪ Parish'
													: '🏛️ Outstation'}
											</Badge>
										</TableCell>
										<TableCell>
											{org.parent ? (
												<Link
													href={`/dashboard/admin/organizations/${org.parent.id}`}
													className='text-sm text-muted-foreground hover:underline'
												>
													{org.parent.name}
												</Link>
											) : (
												<span className='text-sm text-muted-foreground'>
													-
												</span>
											)}
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-1'>
												<Users className='h-3 w-3 text-muted-foreground' />
												<span>{org._count.users}</span>
											</div>
										</TableCell>
										<TableCell>{org._count.parishioners}</TableCell>
										<TableCell>{org._count.societies}</TableCell>
										<TableCell className='text-right'>
											<div className='flex justify-end gap-2'>
												<Link
													href={`/dashboard/admin/organizations/${org.id}`}
												>
													<Button
														variant='ghost'
														size='sm'
													>
														<Eye className='h-4 w-4' />
													</Button>
												</Link>
												<Link
													href={`/dashboard/admin/organizations/${org.id}/settings`}
												>
													<Button
														variant='ghost'
														size='sm'
													>
														<Settings className='h-4 w-4' />
													</Button>
												</Link>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className='flex items-center justify-center gap-2 mt-4'>
							<Link
								href={`/dashboard/admin/organizations?page=${Math.max(1, page - 1)}${searchQuery ? `&search=${searchQuery}` : ''}${level ? `&level=${level}` : ''}`}
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
								href={`/dashboard/admin/organizations?page=${Math.min(totalPages, page + 1)}${searchQuery ? `&search=${searchQuery}` : ''}${level ? `&level=${level}` : ''}`}
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
